import { useCallback, useEffect, useRef, useState } from "react";
import { sheetReadMany, sheetSummary, sheetSummaryRange } from "../api/sheetApi";

const POLL_INTERVAL_MS = 8000;
const CACHE_KEY = "anokhi_summary_cache_v2";

// Rows are pre-added totals: { QualityName, ColourNo, Inward, Outward }.
function normaliseSummary(rows) {
  return (rows || []).map((r) => ({
    QualityName: String(r.QualityName).trim(),
    ColourNo: String(r.ColourNo).trim(),
    Inward: Number(r.Inward) || 0,
    Outward: Number(r.Outward) || 0,
  }));
}

// Fallback for an Apps Script that has no summary endpoint yet.
function summariseRaw(data, range) {
  const totals = new Map();
  for (const [field, list] of [["Inward", data.Inward], ["Outward", data.Outward]]) {
    for (const r of list || []) {
      if (!r.QualityName) continue;
      if (range) {
        const day = String(r.Date).slice(0, 10);
        if (day < range.from || day > range.to) continue;
      }
      const q = String(r.QualityName).trim();
      const c = String(r.ColourNo).trim();
      const key = `${q}${c}`;
      const t = totals.get(key) || { QualityName: q, ColourNo: c, Inward: 0, Outward: 0 };
      t[field] += parseFloat(r.Meter) || 0;
      totals.set(key, t);
    }
  }
  return Array.from(totals.values());
}

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCache(rows) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(rows));
  } catch {
    // ignore (private browsing / storage disabled) - cache is a convenience only
  }
}

async function fetchRows(fresh, range) {
  try {
    return normaliseSummary(range ? await sheetSummaryRange(range) : await sheetSummary(fresh));
  } catch (err) {
    if (!/Missing sheet|not supported/i.test(err.message)) throw err;
    // Old Apps Script: read the raw tabs and add up (and date-filter) here.
    return normaliseSummary(summariseRaw(await sheetReadMany(["Inward", "Outward"]), range));
  }
}

// `active`: poll only while the Analysis tab is showing; the first load always
// runs at app start so the tab is ready before it is opened.
export function useEntries(active = true, range = null) {
  const rangeKey = range ? `${range.from}|${range.to}` : "";
  const [cache] = useState(() => loadCache());
  // Rows are tagged with the range they were fetched for, so switching the
  // range never shows the previous range's numbers.
  const [data, setData] = useState({ key: "", rows: cache || [] });
  // Only block on a spinner when there's nothing cached to show yet.
  const [busy, setBusy] = useState(!cache);
  const [error, setError] = useState(null);
  const inFlight = useRef(false);
  const reqId = useRef(0);
  const rangeRef = useRef(range);

  const load = useCallback(async (silent = false, fresh = false) => {
    if (silent && inFlight.current) return;
    const id = ++reqId.current;
    inFlight.current = true;
    const myRange = rangeRef.current;
    const myKey = myRange ? `${myRange.from}|${myRange.to}` : "";
    if (!silent) setBusy(true);
    try {
      const next = await fetchRows(fresh, myRange);
      if (id !== reqId.current) return; // a newer request superseded this one
      setData({ key: myKey, rows: next });
      if (!myRange) saveCache(next);
      setError(null);
    } catch (err) {
      if (id === reqId.current && !silent) setError(err.message);
    } finally {
      if (id === reqId.current) {
        inFlight.current = false;
        if (!silent) setBusy(false);
      }
    }
  }, []);

  useEffect(() => {
    rangeRef.current = range;
    load(!!cache && !rangeKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, rangeKey]);

  useEffect(() => {
    if (!active) return;
    // Refresh right when the tab opens, then keep totals fresh so entries
    // added on other devices show up without a manual refresh.
    load(true);
    const interval = setInterval(() => load(true), POLL_INTERVAL_MS);
    const onVisible = () => document.visibilityState === "visible" && load(true);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active, load, rangeKey]);

  const refresh = useCallback(() => load(false, true), [load]);

  const stale = data.key !== rangeKey;
  return { rows: stale ? [] : data.rows, loading: busy || stale, error, refresh };
}
