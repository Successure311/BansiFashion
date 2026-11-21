// A quality has one or more colour ranges: { name, ranges: [{ start, end }] }.
// No ranges = no fixed range (any colour number is accepted).
export const hasRanges = (q) => !!q && q.ranges.length > 0;

export const inRanges = (q, n) => q.ranges.some((r) => n >= r.start && n <= r.end);

export const sortedRanges = (q) => [...q.ranges].sort((a, b) => a.start - b.start);

export const formatRanges = (q) =>
  sortedRanges(q)
    .map((r) => `${r.start}–${r.end}`)
    .join(", ");

// Every colour number allowed for the quality, ascending (for the suggestion list).
export function colourNumbers(q) {
  const set = new Set();
  for (const r of q.ranges) for (let n = r.start; n <= r.end; n++) set.add(n);
  return Array.from(set).sort((a, b) => a - b);
}
