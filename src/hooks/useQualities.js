import { useCallback, useEffect, useState } from "react";
import { sheetRead, upsertQuality } from "../api/sheetApi";
import { defaultQualities } from "../data/defaultQualities";

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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await sheetRead("QualityMaster");
      setQualities((prev) => mergeByName(defaultQualities, normaliseRows(rows)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addQuality = useCallback(async ({ name, start, end }) => {
    const trimmed = name.trim();
    await upsertQuality({ QualityName: trimmed, RangeStart: start, RangeEnd: end });
    setQualities((prev) => mergeByName(prev, [{ name: trimmed, start, end }]));
    return trimmed;
  }, []);

  return { qualities, loading, error, reload: load, addQuality };
}
