// yyyy-MM-dd in local time - the format the sheet stores in its Date column.
export function toSheetDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// null = all dates. Otherwise { from, to } as yyyy-MM-dd (inclusive, from <= to).
export function buildRange(mode, d1, d2) {
  if (mode === "single" && d1) {
    const s = toSheetDate(d1);
    return { from: s, to: s };
  }
  if (mode === "range" && d1 && d2) {
    const a = toSheetDate(d1);
    const b = toSheetDate(d2);
    return a <= b ? { from: a, to: b } : { from: b, to: a };
  }
  return null;
}
