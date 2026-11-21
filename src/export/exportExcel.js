import {
  byDate,
  byQuality,
  byQualityColour,
  colourSort,
  formatDisplayDate,
  pivotQualityDate,
  sumMeters,
} from "../data/analytics";

const PLUM = "FF8E2466";
const LIGHT = "FFF9E8F2";
const WHITE = "FFFFFFFF";
const NUM = "#,##0.00";

// ---- charts: drawn on a canvas and embedded as pictures (the Excel library has no native charts)
function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, w, h);
  return [c, g];
}

function niceMax(v) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

function frame(g, W, H, L, R, T, B, title, series, max) {
  g.fillStyle = "#5f1749";
  g.font = "bold 22px sans-serif";
  g.textAlign = "left";
  g.fillText(title, L, 30);
  let lx = W - R;
  g.font = "16px sans-serif";
  [...series].reverse().forEach((s) => {
    const w = g.measureText(s.name).width;
    lx -= w + 26;
    g.fillStyle = s.color;
    g.fillRect(lx, 16, 14, 14);
    g.fillStyle = "#444";
    g.fillText(s.name, lx + 20, 29);
    lx -= 10;
  });
  g.strokeStyle = "#e5d5de";
  g.fillStyle = "#777";
  g.font = "14px sans-serif";
  g.textAlign = "right";
  for (let i = 0; i <= 5; i++) {
    const y = T + ((H - T - B) * (5 - i)) / 5;
    g.beginPath();
    g.moveTo(L, y);
    g.lineTo(W - R, y);
    g.stroke();
    g.fillText(Math.round((max * i) / 5).toLocaleString(), L - 8, y + 5);
  }
}

function fmtVal(v) {
  return v.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function rotatedLabel(g, text, x, y) {
  g.save();
  g.translate(x, y);
  g.rotate(-Math.PI / 6);
  g.textAlign = "right";
  g.fillStyle = "#444";
  g.font = "13px sans-serif";
  g.fillText(text.length > 28 ? `${text.slice(0, 27)}…` : text, 0, 0);
  g.restore();
}

function barChart(title, labels, series) {
  const W = 1000;
  const H = 440;
  const [c, g] = makeCanvas(W, H);
  const L = 80;
  const R = 20;
  const T = 56;
  const B = 120;
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
  frame(g, W, H, L, R, T, B, title, series, max);
  const groupW = (W - L - R) / Math.max(labels.length, 1);
  const barW = Math.min(46, (groupW * 0.8) / series.length);
  labels.forEach((label, i) => {
    const gx = L + groupW * i + groupW / 2 - (barW * series.length) / 2;
    series.forEach((s, k) => {
      const h = ((H - T - B) * s.values[i]) / max;
      g.fillStyle = s.color;
      g.fillRect(gx + barW * k, H - B - h, barW - 2, h);
      if (s.values[i] > 0) {
        g.fillStyle = "#222";
        g.font = "bold 12px sans-serif";
        g.textAlign = "center";
        g.fillText(fmtVal(s.values[i]), gx + barW * k + (barW - 2) / 2, H - B - h - 6);
      }
    });
    rotatedLabel(g, label, L + groupW * i + groupW / 2 + 6, H - B + 18);
  });
  return c.toDataURL("image/png");
}

function lineChart(title, labels, series) {
  const W = 1000;
  const H = 440;
  const [c, g] = makeCanvas(W, H);
  const L = 80;
  const R = 20;
  const T = 56;
  const B = 90;
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
  frame(g, W, H, L, R, T, B, title, series, max);
  const step = (W - L - R) / Math.max(labels.length - 1, 1);
  const x = (i) => (labels.length === 1 ? L + (W - L - R) / 2 : L + step * i);
  const y = (v) => H - B - ((H - T - B) * v) / max;
  const labelEvery = Math.ceil(labels.length / 12); // keep value labels readable on long ranges
  series.forEach((s, k) => {
    g.strokeStyle = s.color;
    g.lineWidth = 3;
    g.beginPath();
    s.values.forEach((v, i) => (i ? g.lineTo(x(i), y(v)) : g.moveTo(x(i), y(v))));
    g.stroke();
    g.fillStyle = s.color;
    s.values.forEach((v, i) => {
      g.beginPath();
      g.arc(x(i), y(v), 4, 0, Math.PI * 2);
      g.fill();
      if (i % labelEvery === 0) {
        // Stagger the series so labels of different lines don't sit on top of each other.
        const dy = k === 1 ? 20 : k === 0 ? -10 : -24;
        g.fillStyle = s.color;
        g.font = "bold 12px sans-serif";
        g.textAlign = "center";
        g.fillText(fmtVal(v), x(i), y(v) + dy);
        g.fillStyle = s.color;
      }
    });
  });
  const every = Math.ceil(labels.length / 14);
  labels.forEach((label, i) => {
    if (i % every === 0) rotatedLabel(g, label, x(i) + 6, H - B + 18);
  });
  return c.toDataURL("image/png");
}

// ---- sheet helpers
function styleHeader(row) {
  row.height = 22;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PLUM } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });
}

function styleTotal(row) {
  row.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT } };
  });
}

function heat(ws, ref, color) {
  ws.addConditionalFormatting({
    ref,
    rules: [
      {
        type: "colorScale",
        cfvo: [{ type: "min" }, { type: "max" }],
        color: [{ argb: WHITE }, { argb: color }],
      },
    ],
  });
}

// A simple table sheet: header row, data rows, optional totals row, freeze + filter.
function tableSheet(wb, name, columns, rows, { totals = false } = {}) {
  const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width || 14 }));
  rows.forEach((r) => ws.addRow(r));
  styleHeader(ws.getRow(1));
  columns.forEach((c, i) => {
    if (c.fmt) ws.getColumn(i + 1).numFmt = c.fmt;
  });
  if (totals && rows.length) {
    const sumKeys = columns.filter((c) => c.sum);
    const t = { [columns[0].key]: "TOTAL" };
    sumKeys.forEach((c) => {
      t[c.key] = rows.reduce((a, r) => a + (Number(r[c.key]) || 0), 0);
    });
    styleTotal(ws.addRow(t));
  }
  if (rows.length) {
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1 + rows.length, column: columns.length } };
  }
  return ws;
}

function pivotSheet(wb, name, rows, color) {
  const p = pivotQualityDate(rows);
  const ws = wb.addWorksheet(name, { views: [{ state: "frozen", xSplit: 1, ySplit: 1 }] });
  ws.addRow(["Quality", ...p.dates.map(formatDisplayDate), "TOTAL"]);
  styleHeader(ws.getRow(1));
  const colTotals = p.dates.map(() => 0);
  p.qualities.forEach((q) => {
    const vals = p.dates.map((d, i) => {
      const v = p.get(q, d);
      colTotals[i] += v;
      return v || null;
    });
    ws.addRow([q, ...vals, vals.reduce((a, v) => a + (v || 0), 0)]);
  });
  styleTotal(ws.addRow(["TOTAL", ...colTotals, colTotals.reduce((a, v) => a + v, 0)]));
  ws.getColumn(1).width = 30;
  for (let c = 2; c <= p.dates.length + 2; c++) ws.getColumn(c).numFmt = NUM;
  for (let c = 2; c <= p.dates.length + 2; c++) ws.getColumn(c).width = 13;
  if (p.qualities.length && p.dates.length) {
    const lastCol = ws.getColumn(p.dates.length + 1).letter;
    heat(ws, `B2:${lastCol}${p.qualities.length + 1}`, color);
  }
  return ws;
}

function statusOf(inward, outward) {
  if (outward > inward) return "Over-dispatched";
  if (inward > 0 && outward === 0) return "Not dispatched";
  if (inward > 0 && outward === inward) return "Fully dispatched";
  return "Partly dispatched";
}

// inward/outward: already filtered to the chosen dates. label: text describing the filter.
export async function exportExcel({ inward, outward, label }) {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "Anokhi Fabrics";
  wb.created = new Date();

  const totalIn = sumMeters(inward);
  const totalOut = sumMeters(outward);
  const quality = byQuality(inward, outward);
  const colours = byQualityColour(inward, outward);
  const days = byDate(inward, outward);

  // 1. Overview + charts
  const ov = wb.addWorksheet("Overview");
  ov.getColumn(1).width = 26;
  ov.getColumn(2).width = 22;
  ov.mergeCells("A1:H1");
  ov.getCell("A1").value = "Anokhi Fabrics — Inward / Outward Report";
  ov.getCell("A1").font = { bold: true, size: 18, color: { argb: PLUM } };
  ov.addRow(["Filter", label]);
  ov.addRow(["Generated", new Date().toLocaleString()]);
  ov.addRow([]);
  [
    ["Total Inward (m)", totalIn],
    ["Total Outward (m)", totalOut],
    ["Balance (m)", totalIn - totalOut],
    ["Inward entries", inward.length],
    ["Outward entries", outward.length],
    ["Qualities", quality.length],
    ["Quality + colour lines", colours.length],
  ].forEach(([k, v]) => {
    const row = ov.addRow([k, v]);
    row.getCell(1).font = { bold: true };
    row.getCell(2).numFmt = NUM;
    row.getCell(2).alignment = { horizontal: "left" };
  });
  if (quality.length) {
    const img = wb.addImage({
      base64: barChart(
        "Inward vs Outward by Quality (m)",
        quality.map((q) => q.QualityName),
        [
          { name: "Inward", color: "#2f9e72", values: quality.map((q) => q.inward) },
          { name: "Outward", color: "#e08a1e", values: quality.map((q) => q.outward) },
        ]
      ),
      extension: "png",
    });
    ov.addImage(img, { tl: { col: 0, row: 12 }, ext: { width: 900, height: 396 } });
  }
  if (days.length) {
    const shown = days.slice(-60);
    const img = wb.addImage({
      base64: lineChart(
        "Day-wise Inward / Outward / Running stock (m)",
        shown.map((d) => formatDisplayDate(d.Date)),
        [
          { name: "Inward", color: "#2f9e72", values: shown.map((d) => d.inward) },
          { name: "Outward", color: "#e08a1e", values: shown.map((d) => d.outward) },
          { name: "Running stock", color: "#8e2466", values: shown.map((d) => Math.max(d.running, 0)) },
        ]
      ),
      extension: "png",
    });
    ov.addImage(img, { tl: { col: 0, row: 33 }, ext: { width: 900, height: 396 } });
  }

  // 2. Main table: quality + colour inward / outward / difference
  const main = tableSheet(
    wb,
    "Main Table",
    [
      { header: "Quality", key: "q", width: 32 },
      { header: "Colour No.", key: "c", width: 18 },
      { header: "Inward (m)", key: "i", fmt: NUM, sum: true },
      { header: "Outward (m)", key: "o", fmt: NUM, sum: true },
      { header: "Difference (m)", key: "d", fmt: NUM, sum: true },
    ],
    colours.map((r) => ({ q: r.QualityName, c: r.ColourNo, i: r.inward, o: r.outward, d: r.inward - r.outward })),
    { totals: true }
  );
  if (colours.length) heat(main, `E2:E${colours.length + 1}`, "FFF0B94D");

  // 3. Quality summary
  const qs = tableSheet(
    wb,
    "Quality Summary",
    [
      { header: "Quality", key: "q", width: 32 },
      { header: "Inward (m)", key: "i", fmt: NUM, sum: true },
      { header: "Outward (m)", key: "o", fmt: NUM, sum: true },
      { header: "Balance (m)", key: "b", fmt: NUM, sum: true },
      { header: "% Dispatched", key: "p", fmt: "0.0%" },
      { header: "Inward entries", key: "ie", fmt: "0", sum: true },
      { header: "Outward entries", key: "oe", fmt: "0", sum: true },
    ],
    quality.map((r) => ({
      q: r.QualityName,
      i: r.inward,
      o: r.outward,
      b: r.inward - r.outward,
      p: r.inward ? r.outward / r.inward : 0,
      ie: r.inEntries,
      oe: r.outEntries,
    })),
    { totals: true }
  );
  if (quality.length) {
    heat(qs, `B2:B${quality.length + 1}`, "FF7FD1AE");
    heat(qs, `C2:C${quality.length + 1}`, "FFF6C177");
  }

  // 4. Day-wise
  const dw = tableSheet(
    wb,
    "Day-wise",
    [
      { header: "Date", key: "d", width: 14 },
      { header: "Inward (m)", key: "i", fmt: NUM, sum: true },
      { header: "Outward (m)", key: "o", fmt: NUM, sum: true },
      { header: "Net (m)", key: "n", fmt: NUM, sum: true },
      { header: "Running stock (m)", key: "r", fmt: NUM, width: 18 },
    ],
    days.map((r) => ({ d: formatDisplayDate(r.Date), i: r.inward, o: r.outward, n: r.net, r: r.running })),
    { totals: true }
  );
  if (days.length) {
    heat(dw, `B2:B${days.length + 1}`, "FF7FD1AE");
    heat(dw, `C2:C${days.length + 1}`, "FFF6C177");
  }

  // 5. Pivots: quality x date
  pivotSheet(wb, "Pivot Inward", inward, "FF7FD1AE");
  pivotSheet(wb, "Pivot Outward", outward, "FFF6C177");

  // 6. Stock position by colour (biggest balance first)
  const stock = [...colours].sort((a, b) => b.inward - b.outward - (a.inward - a.outward));
  const sp = tableSheet(
    wb,
    "Stock Position",
    [
      { header: "Quality", key: "q", width: 32 },
      { header: "Colour No.", key: "c", width: 18 },
      { header: "Inward (m)", key: "i", fmt: NUM },
      { header: "Outward (m)", key: "o", fmt: NUM },
      { header: "Balance (m)", key: "b", fmt: NUM },
      { header: "% Dispatched", key: "p", fmt: "0.0%" },
      { header: "Status", key: "s", width: 18 },
    ],
    stock.map((r) => ({
      q: r.QualityName,
      c: r.ColourNo,
      i: r.inward,
      o: r.outward,
      b: r.inward - r.outward,
      p: r.inward ? r.outward / r.inward : 0,
      s: statusOf(r.inward, r.outward),
    }))
  );
  if (stock.length) heat(sp, `E2:E${stock.length + 1}`, "FFE9A3C4");

  // 7. Raw data
  const sortRaw = (rows) =>
    [...rows].sort(
      (a, b) =>
        a.Date.localeCompare(b.Date) || a.QualityName.localeCompare(b.QualityName) || colourSort(a.ColourNo, b.ColourNo)
    );
  const rawCols = (noteHeader) => [
    { header: "Date", key: "d", width: 14 },
    { header: "Quality", key: "q", width: 32 },
    { header: "Colour No.", key: "c", width: 18 },
    { header: "Meter", key: "m", fmt: NUM },
    { header: noteHeader, key: "n", width: 24 },
  ];
  const rawRow = (r) => ({ d: formatDisplayDate(r.Date), q: r.QualityName, c: r.ColourNo, m: r.Meter, n: r.Note });
  tableSheet(wb, "Inward Data", rawCols("Remarks"), sortRaw(inward).map(rawRow));
  tableSheet(wb, "Outward Data", rawCols("Challan No."), sortRaw(outward).map(rawRow));

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Anokhi-Fabrics-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return blob;
}
