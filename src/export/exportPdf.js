import { byQualityColour, formatDisplayDate } from "../data/analytics";

const RED = [200, 0, 0];
const BLACK = [0, 0, 0];
const MARGIN = 40;

const fmt = (n) => n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

// Quality name in red as the title, then a fully ruled table:
// Colour No. | Inward (m) | Outward (m) | Difference (m). One table per quality.
export async function buildPdf({ inward, outward, range }) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageHeight = doc.internal.pageSize.getHeight();
  const textWidth = doc.internal.pageSize.getWidth() - MARGIN * 2;

  const dateText = range
    ? range.from === range.to
      ? `Date: ${formatDisplayDate(range.from)}`
      : `Dates: ${formatDisplayDate(range.from)} to ${formatDisplayDate(range.to)}`
    : "";

  // Group the quality + colour lines by quality (already sorted by quality, then colour).
  const groups = new Map();
  for (const r of byQualityColour(inward, outward)) {
    if (!groups.has(r.QualityName)) groups.set(r.QualityName, []);
    groups.get(r.QualityName).push(r);
  }

  let y = MARGIN + 6;
  for (const [quality, lines] of groups) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    const titleLines = doc.splitTextToSize(quality, textWidth);
    const needed = titleLines.length * 20 + (dateText ? 14 : 0) + 30 * Math.min(lines.length + 2, 4);
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

    const totalIn = lines.reduce((t, r) => t + r.inward, 0);
    const totalOut = lines.reduce((t, r) => t + r.outward, 0);
    autoTable(doc, {
      startY: y + 6,
      head: [["Colour No.", "Inward (m)", "Outward (m)", "Difference (m)"]],
      body: lines.map((r) => [r.ColourNo, fmt(r.inward), fmt(r.outward), fmt(r.inward - r.outward)]),
      foot: [["Total", fmt(totalIn), fmt(totalOut), fmt(totalIn - totalOut)]],
      showFoot: "lastPage",
      theme: "grid",
      margin: { left: MARGIN, right: MARGIN, top: MARGIN, bottom: MARGIN },
      styles: { font: "helvetica", fontSize: 10, textColor: BLACK, lineColor: BLACK, lineWidth: 0.7, cellPadding: 6, halign: "right" },
      headStyles: { fillColor: [255, 255, 255], textColor: BLACK, fontStyle: "bold", halign: "center" },
      footStyles: { fillColor: [255, 255, 255], textColor: BLACK, fontStyle: "bold" },
      columnStyles: { 0: { halign: "left" } },
    });
    y = doc.lastAutoTable.finalY + 30;
  }
  return doc;
}

export async function exportPdf({ inward, outward, range, name }) {
  const doc = await buildPdf({ inward, outward, range });
  doc.save(`${name}.pdf`);
}
