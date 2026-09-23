import { useCallback, useEffect, useRef, useState } from "react";
import { sheetReadMany } from "../api/sheetApi";

const POLL_INTERVAL_MS = 8000;

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

export function useEntries() {
  const [inward, setInward] = useState([]);
  const [outward, setOutward] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const inFlight = useRef(false);

  const load = useCallback(async (silent = false) => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (!silent) setLoading(true);
    try {
      const data = await sheetReadMany(["Inward", "Outward"]);
      setInward(normaliseRows(data.Inward));
      setOutward(normaliseRows(data.Outward));
      setError(null);
    } catch (err) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    load();
    // Keep totals fresh while the tab is open, so entries added by other
    // users on other devices show up without a manual refresh.
    const interval = setInterval(() => load(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const refresh = useCallback(() => load(false), [load]);

  return { inward, outward, loading, error, refresh };
}
