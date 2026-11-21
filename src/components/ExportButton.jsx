import { useState } from "react";
import { sheetReadMany } from "../api/sheetApi";
import { inRange, normaliseRaw } from "../data/analytics";

// End of the Analysis page. Downloads a PDF: the quality name as a red title and a
// colour-wise Inward / Outward / Difference (m) table under it, for the filters above
// (every quality gets its own table when "All qualities" is selected).
// Reads the sheet fresh when tapped, so the report always has the latest entries.
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
      // Loaded on demand so the PDF library isn't part of the normal app download.
      const { exportPdf } = await import("../export/exportPdf");
      const safe = (quality || "All-qualities").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
      await exportPdf({ inward, outward, range, name: `${safe}-${new Date().toISOString().slice(0, 10)}` });
      setMessage({ ok: true, text: "PDF report downloaded." });
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
        {busy ? "Preparing report…" : "Export Report  ↓"}
      </button>
      <p className="text-xs text-gray-400 text-center">
        Saves a PDF table of colour-wise Inward, Outward and Difference (m) for the filters above.
      </p>
      {message && (
        <p className={`text-sm text-center font-semibold ${message.ok ? "text-emerald-700" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
