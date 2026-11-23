import { byQualityColour, formatDisplayDate } from "../data/analytics";

const RED = [200, 0, 0];
const BLACK = [0, 0, 0];
const MARGIN = 40;

const fmt = (n) => n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

// Red title (the quality name, or "All Qualities") and one fully ruled table:
// Colour No. | Quality Name | Difference (m), everything centred.
export async function buildPdf({ inward, outward, range, quality = "" }) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const textWidth = doc.internal.pageSize.getWidth() - MARGIN * 2;

  const dateText = range
    ? range.from === range.to
      ? `Date: ${formatDisplayDate(range.from)}`
      : `Dates: ${formatDisplayDate(range.from)} to ${formatDisplayDate(range.to)}`
    : "";

  let y = MARGIN + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...RED);
  const titleLines = doc.splitTextToSize(quality || "All Qualities", textWidth);
  doc.text(titleLines, MARGIN, y);
  y += titleLines.length * 20 - 6;
  if (dateText) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text(dateText, MARGIN, y + 10);
    y += 14;
  }

  // Already sorted by quality, then colour.
  const lines = byQualityColour(inward, outward);
  autoTable(doc, {
    startY: y + 6,
    head: [["Colour No.", "Quality Name", "Difference (m)"]],
    body: lines.map((r) => [r.ColourNo, r.QualityName, fmt(r.inward - r.outward)]),
    theme: "grid",
    margin: { left: MARGIN, right: MARGIN, top: MARGIN, bottom: MARGIN },
    styles: { font: "helvetica", fontSize: 10, textColor: BLACK, lineColor: BLACK, lineWidth: 0.7, cellPadding: 6, halign: "center", valign: "middle" },
    headStyles: { fillColor: [255, 255, 255], textColor: BLACK, fontStyle: "bold", halign: "center" },
    columnStyles: { 0: { cellWidth: 90 }, 2: { cellWidth: 110 } },
  });
  return doc;
}

export async function exportPdf({ inward, outward, range, quality, name }) {
  const doc = await buildPdf({ inward, outward, range, quality });
  doc.save(`${name}.pdf`);
}
