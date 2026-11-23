import { byQualityColour, colourSort, formatDisplayDate } from "../data/analytics";

const RED = [200, 0, 0];
const BLACK = [0, 0, 0];
const MARGIN = 40;

const fmt = (n) => n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

// Colour numbers that appear under more than one quality go in one combined table:
// one row per colour number, and a column (with its Difference (m)) for each quality that uses it. Everything else gets one table per
// quality below it: the quality name as a red title, then Colour No. | Difference (m).
// All cells are centred and fully ruled.
export async function buildPdf({ inward, outward, range }) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const dateText = range
    ? range.from === range.to
      ? `Date: ${formatDisplayDate(range.from)}`
      : `Dates: ${formatDisplayDate(range.from)} to ${formatDisplayDate(range.to)}`
    : "";

  const lines = byQualityColour(inward, outward); // sorted by quality, then colour

  // Which colour numbers are used by two or more qualities?
  const qualitiesOf = new Map();
  for (const r of lines) {
    if (!qualitiesOf.has(r.ColourNo)) qualitiesOf.set(r.ColourNo, new Set());
    qualitiesOf.get(r.ColourNo).add(r.QualityName);
  }
  const isShared = (r) => qualitiesOf.get(r.ColourNo).size > 1;
  const shared = lines.filter(isShared);
  // Matrix for the shared colours: one row per colour number, one column per quality that uses any of them.
  const sharedColours = Array.from(new Set(shared.map((r) => r.ColourNo))).sort(colourSort);
  const sharedQualities = Array.from(new Set(shared.map((r) => r.QualityName))).sort((a, b) => a.localeCompare(b));
  const diffOf = new Map(shared.map((r) => [`${r.ColourNo}|${r.QualityName}`, r.inward - r.outward]));
  const groups = new Map();
  for (const r of lines.filter((r) => !isShared(r))) {
    if (!groups.has(r.QualityName)) groups.set(r.QualityName, []);
    groups.get(r.QualityName).push(r);
  }

  // Many quality columns need the wider (landscape) page.
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: sharedQualities.length > 4 ? "landscape" : "portrait" });
  const pageHeight = doc.internal.pageSize.getHeight();
  const textWidth = doc.internal.pageSize.getWidth() - MARGIN * 2;

  const common = {
    theme: "grid",
    margin: { left: MARGIN, right: MARGIN, top: MARGIN, bottom: MARGIN },
    styles: { font: "helvetica", fontSize: 10, textColor: BLACK, lineColor: BLACK, lineWidth: 0.7, cellPadding: 6, halign: "center", valign: "middle" },
    headStyles: { fillColor: [255, 255, 255], textColor: BLACK, fontStyle: "bold", halign: "center" },
  };

  let y = MARGIN + 6;

  // Red title (+ small date note); starts a new page if the table would not fit its first rows.
  function title(text, rowCount) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    const titleLines = doc.splitTextToSize(text, textWidth);
    const needed = titleLines.length * 20 + (dateText ? 14 : 0) + 30 * Math.min(rowCount + 1, 4);
    if (y + needed > pageHeight - MARGIN) {
      doc.addPage();
      y = MARGIN + 6;
    }
    doc.setTextColor(...RED);
    doc.text(titleLines, MARGIN, y);
    y += titleLines.length * 20 - 6;
    if (dateText) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);
      doc.text(dateText, MARGIN, y + 10);
      y += 14;
    }
  }

  if (shared.length) {
    title("Same Colour No. in Different Qualities", sharedColours.length);
    autoTable(doc, {
      ...common,
      startY: y + 6,
      head: [["Colour No.", ...sharedQualities.map((q) => `${q}
Difference (m)`)]],
      body: sharedColours.map((c) => [
        c,
        ...sharedQualities.map((q) => (diffOf.has(`${c}|${q}`) ? fmt(diffOf.get(`${c}|${q}`)) : "")),
      ]),
      columnStyles: { 0: { cellWidth: 70 } },
    });
    y = doc.lastAutoTable.finalY + 30;
  }

  for (const [quality, rows] of groups) {
    title(quality, rows.length);
    autoTable(doc, {
      ...common,
      startY: y + 6,
      head: [["Colour No.", "Difference (m)"]],
      body: rows.map((r) => [r.ColourNo, fmt(r.inward - r.outward)]),
      tableWidth: 300,
    });
    y = doc.lastAutoTable.finalY + 30;
  }
  return doc;
}

export async function exportPdf({ inward, outward, range, name }) {
  const doc = await buildPdf({ inward, outward, range });
  doc.save(`${name}.pdf`);
}
