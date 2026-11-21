import { useState } from "react";
import { sheetReadMany } from "../api/sheetApi";
import { formatDisplayDate, inRange, normaliseRaw } from "../data/analytics";

function describe({ range, quality, colour }) {
  const parts = [];
  if (!range) parts.push("All dates");
  else if (range.from === range.to) parts.push(formatDisplayDate(range.from));
  else parts.push(`${formatDisplayDate(range.from)} to ${formatDisplayDate(range.to)}`);
  parts.push(quality || "All qualities");
  if (colour) parts.push(`Colour ${colour}`);
  return parts.join(" | ");
}

// Sits at the end of each Analysis view. Downloads ONE workbook (summary, main
// table, pivots, graphs, inward and outward data) for the filters in use there.
// Reads the sheet fresh when tapped, so the file always has the latest entries.
export default function ExportButton({ range, quality = "", colour = "" }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleExport() {
    setBusy(true);
    setMessage(null);
    try {
      const raw = normaliseRaw(await sheetReadMany(["Inward", "Outward"]));
      const pick = (rows) =>
        inRange(rows, range).filter(
          (r) => (!quality || r.QualityName === quality) && (!colour || r.ColourNo === colour)
        );
      const inward = pick(raw.inward);
      const outward = pick(raw.outward);
      if (inward.length + outward.length === 0) {
        setMessage({ ok: false, text: "No entries for these filters." });
        return;
      }
      // Loaded on demand so the Excel library isn't part of the normal app download.
      const { exportExcel } = await import("../export/exportExcel");
      await exportExcel({ inward, outward, label: describe({ range, quality, colour }) });
      setMessage({ ok: true, text: "Excel file downloaded." });
    } catch (err) {
      setMessage({ ok: false, text: `Export failed — ${err.message || "try again"}` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleExport}
        disabled={busy}
        className="w-full btn-primary py-3.5 font-bold text-white text-base"
      >
        {busy ? "Preparing Excel…" : "Export Excel  ↓"}
      </button>
      <p className="text-xs text-gray-400 text-center">
        Saves inward, outward, summary, pivots and graphs for the filters above.
      </p>
      {message && (
        <p className={`text-sm text-center font-semibold ${message.ok ? "text-emerald-700" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
