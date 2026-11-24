import { byQualityColour, colourSort, formatDisplayDate } from "../data/analytics";

const BLACK = [0, 0, 0];
const MARGIN = 40;

const fmt = (n) => n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

// Two or more qualities: ONE table sorted by colour number - a row per colour number, a column
// per quality (headed by the quality name only), and "-" where that quality has no such colour.
// One quality: a Colour No. | <quality name> table. No titles. Cells are centred and fully ruled.
export async function buildPdf({ inward, outward, range }) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const dateText = range
    ? range.from === range.to
      ? `Date: ${formatDisplayDate(range.from)}`
      : `Dates: ${formatDisplayDate(range.from)} to ${formatDisplayDate(range.to)}`
    : "";

  const lines = byQualityColour(inward, outward); // sorted by quality, then colour
  const qualities = Array.from(new Set(lines.map((r) => r.QualityName))).sort((a, b) => a.localeCompare(b));
  const colours = Array.from(new Set(lines.map((r) => r.ColourNo))).sort(colourSort);
  const diffOf = new Map(lines.map((r) => [`${r.ColourNo}|${r.QualityName}`, r.inward - r.outward]));

  // Many quality columns need the wider (landscape) page.
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: qualities.length > 4 ? "landscape" : "portrait" });

  const common = {
    theme: "grid",
    margin: { left: MARGIN, right: MARGIN, top: MARGIN, bottom: MARGIN },
    styles: { font: "helvetica", fontSize: qualities.length > 8 ? 8 : 10, textColor: BLACK, lineColor: BLACK, lineWidth: 0.7, cellPadding: 6, halign: "center", valign: "middle" },
    headStyles: { fillColor: [255, 255, 255], textColor: BLACK, fontStyle: "bold", halign: "center" },
  };

  let y = MARGIN;
  // Only a small grey note when a date / range filter is on.
  if (dateText) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text(dateText, MARGIN, y + 6);
    y += 18;
  }

  if (qualities.length >= 2) {
    autoTable(doc, {
      ...common,
      startY: y,
      head: [["Colour No.", ...qualities]],
      body: colours.map((c) => [
        c,
        ...qualities.map((q) => (diffOf.has(`${c}|${q}`) ? fmt(diffOf.get(`${c}|${q}`)) : "-")),
      ]),
      columnStyles: { 0: { cellWidth: 70 } },
    });
  } else if (qualities.length === 1) {
    autoTable(doc, {
      ...common,
      startY: y,
      head: [["Colour No.", qualities[0]]],
      body: lines.map((r) => [r.ColourNo, fmt(r.inward - r.outward)]),
      tableWidth: 300,
    });
  }
  return doc;
}

export async function exportPdf({ inward, outward, range, name }) {
  const doc = await buildPdf({ inward, outward, range });
  doc.save(`${name}.pdf`);
}
