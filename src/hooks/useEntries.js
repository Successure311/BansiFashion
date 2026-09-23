import { useCallback, useEffect, useState } from "react";
import { sheetReadMany } from "../api/sheetApi";

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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sheetReadMany(["Inward", "Outward"]);
      setInward(normaliseRows(data.Inward));
      setOutward(normaliseRows(data.Outward));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { inward, outward, loading, error, refresh: load };
}
