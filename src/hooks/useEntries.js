import { useCallback, useEffect, useRef, useState } from "react";
import { sheetReadMany } from "../api/sheetApi";

const POLL_INTERVAL_MS = 8000;
const CACHE_KEY = "bansi_entries_cache_v1";

function normaliseRows(rows) {
  return (rows || [])
    .filter((r) => r.QualityName)
    .map((r) => ({
      ...r,
      QualityName: String(r.QualityName).trim(),
      ColourNo: String(r.ColourNo).trim(),
      Meter: parseFloat(r.Meter) || 0,
    }));
}

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore (private browsing / storage disabled) - cache is a convenience only
  }
}

export function useEntries() {
  const [cache] = useState(() => loadCache());
  const [inward, setInward] = useState(cache?.inward || []);
  const [outward, setOutward] = useState(cache?.outward || []);
  // Only block on a spinner when there's nothing cached to show yet.
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState(null);
  const inFlight = useRef(false);

  const load = useCallback(async (silent = false) => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (!silent) setLoading(true);
    try {
      const data = await sheetReadMany(["Inward", "Outward"]);
      const nextInward = normaliseRows(data.Inward);
      const nextOutward = normaliseRows(data.Outward);
      setInward(nextInward);
      setOutward(nextOutward);
      saveCache({ inward: nextInward, outward: nextOutward });
      setError(null);
    } catch (err) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    // If we already have cached totals to show, fetch fresh data quietly
    // in the background instead of blocking the screen with a spinner.
    load(!!cache);
    // Keep totals fresh while the tab is open, so entries added by other
    // users on other devices show up without a manual refresh.
    const interval = setInterval(() => load(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const refresh = useCallback(() => load(false), [load]);

  return { inward, outward, loading, error, refresh };
}
