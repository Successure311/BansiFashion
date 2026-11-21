import { useCallback, useEffect, useRef, useState } from "react";
import { sheetRead, appendQualityRow, replaceQualityRanges } from "../api/sheetApi";
import { defaultQualities } from "../data/defaultQualities";

const POLL_INTERVAL_MS = 8000;

function toRangeNumber(v) {
  // Blank/missing range means "no fixed range" - any colour number is valid.
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const sameRange = (a, b) => a.start === b.start && a.end === b.end;

// One sheet row per range -> one quality with all its ranges.
function normaliseRows(rows) {
  const map = new Map();
  for (const r of rows) {
    if (!r.QualityName) continue;
    const name = String(r.QualityName).trim();
    const key = name.toLowerCase();
    const q = map.get(key) || { name, ranges: [] };
    const start = toRangeNumber(r.RangeStart);
    const end = toRangeNumber(r.RangeEnd);
    if (start !== null && end !== null && end >= start && !q.ranges.some((x) => sameRange(x, { start, end }))) {
      q.ranges.push({ start, end });
    }
    map.set(key, q);
  }
  return Array.from(map.values());
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
  const latest = useRef(qualities);

  useEffect(() => {
    latest.current = qualities;
  }, [qualities]);

  const load = useCallback(async (silent = false) => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (!silent) setLoading(true);
    try {
      const rows = await sheetRead("QualityMaster");
      // The sheet is the source of truth; the built-in list is only a fallback when the sheet has no qualities.
      const list = normaliseRows(rows);
      setQualities(list.length ? mergeByName([], list) : defaultQualities);
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

  // Add a quality, or add more colour ranges to an existing one. Ranges the
  // quality already has are skipped; each new range becomes its own sheet row.
  const addQuality = useCallback(async ({ name, ranges }) => {
    const typed = name.trim();
    const existing = latest.current.find((q) => q.name.toLowerCase() === typed.toLowerCase());
    const trimmed = existing ? existing.name : typed;
    const fresh = ranges.filter((r) => !(existing && existing.ranges.some((x) => sameRange(x, r))));

    if (fresh.length) {
      for (const r of fresh) {
        await appendQualityRow({ QualityName: trimmed, RangeStart: r.start, RangeEnd: r.end });
      }
    } else if (!existing) {
      await appendQualityRow({ QualityName: trimmed, RangeStart: "", RangeEnd: "" });
    }

    setQualities((prev) => {
      const cur = prev.find((q) => q.name.toLowerCase() === trimmed.toLowerCase());
      return mergeByName(prev, [{ name: trimmed, ranges: [...(cur ? cur.ranges : []), ...fresh] }]);
    });
    return trimmed;
  }, []);

  // Edit box: the quality's ranges become exactly `ranges` (can be empty = APC only)
  // and the quality may be renamed (past entries are renamed in the sheet too).
  const updateQuality = useCallback(async ({ oldName, name, ranges }) => {
    const trimmed = name.trim();
    await replaceQualityRanges(oldName, trimmed, ranges);
    setQualities((prev) =>
      mergeByName(
        prev.filter((q) => q.name.toLowerCase() !== oldName.toLowerCase()),
        [{ name: trimmed, ranges }]
      )
    );
    return trimmed;
  }, []);

  return { qualities, loading, error, reload: load, addQuality, updateQuality };
}
