import { useCallback, useEffect, useRef, useState } from "react";
import { sheetReadMany } from "../api/sheetApi";
import { normaliseRaw } from "../data/analytics";

const POLL_INTERVAL_MS = 10000;

// Raw Inward + Outward rows (every entry, with dates). Only fetched while
// `enabled`, then kept fresh so entries from other devices appear.
export function useRawData(enabled) {
  const [raw, setRaw] = useState({ inward: [], outward: [] });
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inFlight = useRef(false);

  const load = useCallback(async (silent = false) => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (!silent) setLoading(true);
    try {
      setRaw(normaliseRaw(await sheetReadMany(["Inward", "Outward"])));
      setLoaded(true);
      setError(null);
    } catch (err) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    load(false);
    const interval = setInterval(() => load(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [enabled, load]);

  return { raw, loading: loading || (enabled && !loaded && !error), error, refresh: () => load(false) };
}
