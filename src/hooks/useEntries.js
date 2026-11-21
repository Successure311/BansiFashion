import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sheetReadMany, sheetSummary, sheetDaily } from "../api/sheetApi";

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

// Same, but per day: { Date (yyyy-MM-dd), QualityName, ColourNo, Inward, Outward }.
function normaliseDaily(rows) {
  return (rows || []).map((r) => ({
    Date: String(r.Date).slice(0, 10),
    ...normaliseSummary([r])[0],
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
      const key = `${q}${c}`;
      const t = totals.get(key) || { QualityName: q, ColourNo: c, Inward: 0, Outward: 0 };
      t[field] += parseFloat(r.Meter) || 0;
      totals.set(key, t);
    }
  }
  return Array.from(totals.values());
}

// Fallback for an Apps Script that has no daily endpoint yet.
function dailyRaw(data) {
  const totals = new Map();
  for (const [field, list] of [["Inward", data.Inward], ["Outward", data.Outward]]) {
    for (const r of list || []) {
      if (!r.QualityName) continue;
      const day = String(r.Date).slice(0, 10);
      const q = String(r.QualityName).trim();
      const c = String(r.ColourNo).trim();
      const key = `${day}|${q}|${c}`;
      const t = totals.get(key) || { Date: day, QualityName: q, ColourNo: c, Inward: 0, Outward: 0 };
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

const isOldServer = (err) => /Missing sheet|not supported/i.test(err.message);

async function fetchRows(fresh) {
  try {
    return normaliseSummary(await sheetSummary(fresh));
  } catch (err) {
    if (!isOldServer(err)) throw err;
    return normaliseSummary(summariseRaw(await sheetReadMany(["Inward", "Outward"])));
  }
}

async function fetchDaily() {
  try {
    return normaliseDaily(await sheetDaily());
  } catch (err) {
    if (!isOldServer(err)) throw err;
    return normaliseDaily(dailyRaw(await sheetReadMany(["Inward", "Outward"])));
  }
}

// Add up the per-day rows inside [from, to] into per quality+colour totals.
function totalsForRange(daily, range) {
  const totals = new Map();
  for (const r of daily) {
    if (r.Date < range.from || r.Date > range.to) continue;
    const key = `${r.QualityName}|${r.ColourNo}`;
    const t = totals.get(key) || { QualityName: r.QualityName, ColourNo: r.ColourNo, Inward: 0, Outward: 0 };
    t.Inward += r.Inward;
    t.Outward += r.Outward;
    totals.set(key, t);
  }
  return Array.from(totals.values());
}

// `active`: poll only while the Analysis tab is showing; the first load always
// runs at app start so the tab is ready before it is opened.
// `range` ({from, to} or null = all dates) is applied in memory on the per-day
// data, so changing the dates is instant - no server round trip.
export function useEntries(active = true, range = null) {
  const [cache] = useState(() => loadCache());
  const [rows, setRows] = useState(cache || []);
  const [daily, setDaily] = useState(null); // null = not loaded yet
  // Only block on a spinner when there's nothing cached to show yet.
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState(null);
  const inFlight = useRef(false);
  const dailyInFlight = useRef(false);

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

  const loadDaily = useCallback(async () => {
    if (dailyInFlight.current) return;
    dailyInFlight.current = true;
    try {
      setDaily(await fetchDaily());
    } catch (err) {
      setError(err.message);
    } finally {
      dailyInFlight.current = false;
    }
  }, []);

  const hasRange = !!range;

  useEffect(() => {
    load(!!cache);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  useEffect(() => {
    if (!active) return;
    // Refresh right when the tab opens, then keep totals fresh so entries
    // added on other devices show up without a manual refresh. The per-day
    // data is fetched in the background as soon as Analysis opens, so a date
    // pick finds it ready; it is re-polled only while a date filter is on.
    load(true);
    loadDaily();
    const tick = () => {
      load(true);
      if (hasRange) loadDaily();
    };
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active, load, loadDaily, hasRange]);

  const refresh = useCallback(() => {
    load(false, true);
    loadDaily();
  }, [load, loadDaily]);

  const rangeFrom = range?.from;
  const rangeTo = range?.to;
  const ranged = useMemo(
    () => (daily && rangeFrom ? totalsForRange(daily, { from: rangeFrom, to: rangeTo }) : null),
    [daily, rangeFrom, rangeTo]
  );

  // With a date filter on but the per-day data still loading: show the spinner state.
  const waitingForDaily = hasRange && !daily;
  return {
    rows: hasRange ? ranged || [] : rows,
    loading: loading || waitingForDaily,
    error,
    refresh,
  };
}
