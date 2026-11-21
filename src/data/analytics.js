// Helpers that turn raw Inward/Outward sheet rows into the tables used by the
// Analysis data views and the Excel export.

// Numbers first (by value), then anything else (APC remarks) alphabetically.
export function colourSort(a, b) {
  const na = Number(a);
  const nb = Number(b);
  const aNum = !Number.isNaN(na);
  const bNum = !Number.isNaN(nb);
  if (aNum && bNum) return na - nb;
  if (aNum) return -1;
  if (bNum) return 1;
  return String(a).localeCompare(String(b));
}

// Raw sheet read ({Inward: [...], Outward: [...]}) -> clean rows.
// `Note` is Remarks (Inward; the sheet column may still be called LotNo) or Challan No. (Outward).
export function normaliseRaw(data) {
  const clean = (list, noteKeys) =>
    (list || [])
      .filter((r) => r.QualityName)
      .map((r) => {
        const noteKey = noteKeys.find((k) => r[k] !== undefined && r[k] !== "");
        return {
          Date: String(r.Date).slice(0, 10),
          QualityName: String(r.QualityName).trim(),
          ColourNo: String(r.ColourNo).trim(),
          Meter: parseFloat(r.Meter) || 0,
          Note: noteKey ? String(r[noteKey]).trim() : "",
        };
      });
  return {
    inward: clean(data.Inward, ["Remarks", "LotNo"]),
    outward: clean(data.Outward, ["ChallanNo"]),
  };
}

export function inRange(rows, range) {
  if (!range) return rows;
  return rows.filter((r) => r.Date >= range.from && r.Date <= range.to);
}

export function sumMeters(rows) {
  return rows.reduce((t, r) => t + r.Meter, 0);
}

// One row per quality + colour: { QualityName, ColourNo, inward, outward }.
export function byQualityColour(inward, outward) {
  const map = new Map();
  const add = (rows, field) => {
    for (const r of rows) {
      const key = `${r.QualityName}|${r.ColourNo}`;
      const t = map.get(key) || { QualityName: r.QualityName, ColourNo: r.ColourNo, inward: 0, outward: 0 };
      t[field] += r.Meter;
      map.set(key, t);
    }
  };
  add(inward, "inward");
  add(outward, "outward");
  return Array.from(map.values()).sort(
    (a, b) => a.QualityName.localeCompare(b.QualityName) || colourSort(a.ColourNo, b.ColourNo)
  );
}

// One row per quality: totals + number of entries.
export function byQuality(inward, outward) {
  const map = new Map();
  const add = (rows, field, count) => {
    for (const r of rows) {
      const t = map.get(r.QualityName) || { QualityName: r.QualityName, inward: 0, outward: 0, inEntries: 0, outEntries: 0 };
      t[field] += r.Meter;
      t[count] += 1;
      map.set(r.QualityName, t);
    }
  };
  add(inward, "inward", "inEntries");
  add(outward, "outward", "outEntries");
  return Array.from(map.values()).sort((a, b) => a.QualityName.localeCompare(b.QualityName));
}

// One row per date (oldest first) with the running stock balance.
export function byDate(inward, outward) {
  const map = new Map();
  const add = (rows, field) => {
    for (const r of rows) {
      const t = map.get(r.Date) || { Date: r.Date, inward: 0, outward: 0 };
      t[field] += r.Meter;
      map.set(r.Date, t);
    }
  };
  add(inward, "inward");
  add(outward, "outward");
  let running = 0;
  return Array.from(map.values())
    .sort((a, b) => a.Date.localeCompare(b.Date))
    .map((t) => {
      running += t.inward - t.outward;
      return { ...t, net: t.inward - t.outward, running };
    });
}

// Quality x Date matrix of meters for one list of rows.
export function pivotQualityDate(rows) {
  const qualities = Array.from(new Set(rows.map((r) => r.QualityName))).sort((a, b) => a.localeCompare(b));
  const dates = Array.from(new Set(rows.map((r) => r.Date))).sort();
  const cells = new Map();
  for (const r of rows) {
    const key = `${r.QualityName}|${r.Date}`;
    cells.set(key, (cells.get(key) || 0) + r.Meter);
  }
  return { qualities, dates, get: (q, d) => cells.get(`${q}|${d}`) || 0 };
}

export function formatDisplayDate(iso) {
  const [y, m, d] = String(iso).split("-");
  return y && m && d ? `${d}/${m}/${y}` : String(iso);
}
