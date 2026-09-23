import { useCallback, useEffect, useRef, useState } from "react";
import { sheetRead, upsertQuality } from "../api/sheetApi";
import { defaultQualities } from "../data/defaultQualities";

const POLL_INTERVAL_MS = 8000;

function normaliseRows(rows) {
  return rows
    .filter((r) => r.QualityName)
    .map((r) => ({
      name: String(r.QualityName).trim(),
      start: Number(r.RangeStart),
      end: Number(r.RangeEnd),
    }));
}

function mergeByName(base, overrides) {
  const map = new Map(base.map((q) => [q.name.toLowerCase(), q]));
  overrides.forEach((q) => map.set(q.name.toLowerCase(), q));
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function useQualities() {
  const [qualities, setQualities] = useState(defaultQualities);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const inFlight = useRef(false);

  const load = useCallback(async (silent = false) => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (!silent) setLoading(true);
    try {
      const rows = await sheetRead("QualityMaster");
      setQualities(mergeByName(defaultQualities, normaliseRows(rows)));
      if (!silent) setError(null);
    } catch (err) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    load();
    // Pick up qualities added or edited directly in the Google Sheet
    // (not just ones added from this app) without needing a page reload.
    const interval = setInterval(() => load(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const addQuality = useCallback(async ({ name, start, end }) => {
    const trimmed = name.trim();
    await upsertQuality({ QualityName: trimmed, RangeStart: start, RangeEnd: end });
    setQualities((prev) => mergeByName(prev, [{ name: trimmed, start, end }]));
    return trimmed;
  }, []);

  return { qualities, loading, error, reload: load, addQuality };
}
