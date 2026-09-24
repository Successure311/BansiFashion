import { useCallback, useEffect, useRef, useState } from "react";
import { sheetReadMany, sheetSummary } from "../api/sheetApi";

const POLL_INTERVAL_MS = 8000;
const CACHE_KEY = "bansi_summary_cache_v2";

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
function summariseRaw(data) {
  const totals = new Map();
  for (const [field, list] of [["Inward", data.Inward], ["Outward", data.Outward]]) {
    for (const r of list || []) {
      if (!r.QualityName) continue;
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

async function fetchRows(fresh) {
  try {
    return normaliseSummary(await sheetSummary(fresh));
  } catch (err) {
    if (!/Missing sheet|not supported/i.test(err.message)) throw err;
    return normaliseSummary(summariseRaw(await sheetReadMany(["Inward", "Outward"])));
  }
}

// `active`: poll only while the Analysis tab is showing; the first load always
// runs at app start so the tab is ready before it is opened.
export function useEntries(active = true) {
  const [cache] = useState(() => loadCache());
  const [rows, setRows] = useState(cache || []);
  // Only block on a spinner when there's nothing cached to show yet.
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState(null);
  const inFlight = useRef(false);

  const load = useCallback(async (silent = false, fresh = false) => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (!silent) setLoading(true);
    try {
      const next = await fetchRows(fresh);
      setRows(next);
      saveCache(next);
      setError(null);
    } catch (err) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    load(!!cache);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

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
  }, [active, load]);

  const refresh = useCallback(() => load(false, true), [load]);

  return { rows, loading, error, refresh };
}
