import { byQualityColour, colourSort, formatDisplayDate } from "../data/analytics";

const RED = [200, 0, 0];
const BLACK = [0, 0, 0];
const MARGIN = 40;

const fmt = (n) => n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

// Two or more qualities: ONE table sorted by colour number - a row per colour number, a column
// (with its Difference (m)) per quality, and "-" where that quality has no such colour.
// One quality: its name as a red title and a Colour No. | Difference (m) table.
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
  const qualities = Array.from(new Set(lines.map((r) => r.QualityName))).sort((a, b) => a.localeCompare(b));
  const colours = Array.from(new Set(lines.map((r) => r.ColourNo))).sort(colourSort);
  const diffOf = new Map(lines.map((r) => [`${r.ColourNo}|${r.QualityName}`, r.inward - r.outward]));

  // Many quality columns need the wider (landscape) page.
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: qualities.length > 4 ? "landscape" : "portrait" });
  const textWidth = doc.internal.pageSize.getWidth() - MARGIN * 2;

  const common = {
    theme: "grid",
    margin: { left: MARGIN, right: MARGIN, top: MARGIN, bottom: MARGIN },
    styles: { font: "helvetica", fontSize: qualities.length > 8 ? 8 : 10, textColor: BLACK, lineColor: BLACK, lineWidth: 0.7, cellPadding: 6, halign: "center", valign: "middle" },
    headStyles: { fillColor: [255, 255, 255], textColor: BLACK, fontStyle: "bold", halign: "center" },
  };

  let y = MARGIN + 6;
  // Red title (+ small date note).
  function title(text) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    const titleLines = doc.splitTextToSize(text, textWidth);
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

  if (qualities.length >= 2) {
    title("Colour-wise Difference (m)");
    autoTable(doc, {
      ...common,
      startY: y + 6,
      head: [["Colour No.", ...qualities.map((q) => `${q}
Difference (m)`)]],
      body: colours.map((c) => [
        c,
        ...qualities.map((q) => (diffOf.has(`${c}|${q}`) ? fmt(diffOf.get(`${c}|${q}`)) : "-")),
      ]),
      columnStyles: { 0: { cellWidth: 70 } },
    });
  } else if (qualities.length === 1) {
    title(qualities[0]);
    autoTable(doc, {
      ...common,
      startY: y + 6,
      head: [["Colour No.", "Difference (m)"]],
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
