import { useState } from "react";
import QualityPicker from "./QualityPicker";
import { sheetReadMany } from "../api/sheetApi";
import { inRange, normaliseRaw } from "../data/analytics";

// End of the Analysis page. Downloads a PDF of colour-wise Difference (m) tables for the
// filters above. With more than one quality in the data, a pop-up first lets you pick which
// qualities go in the report. Reads the sheet fresh when tapped, so it has the latest entries.
export default function ExportButton({ range, quality = "", colour = "" }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [pending, setPending] = useState(null); // { inward, outward } waiting for the quality pick

  async function generate(inward, outward, label) {
    // Loaded on demand so the PDF library isn't part of the normal app download.
    const { exportPdf } = await import("../export/exportPdf");
    const safe = (label || "Report").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await exportPdf({ inward, outward, range, name: `${safe}-${new Date().toISOString().slice(0, 10)}` });
    setMessage({ ok: true, text: "PDF report downloaded." });
  }

  async function confirmPick(chosen) {
    const { inward, outward } = pending;
    setPending(null);
    setBusy(true);
    setMessage(null);
    try {
      const keep = new Set(chosen);
      const label = chosen.length === 1 ? chosen[0] : chosen.length === pending.names.length ? "All-qualities" : "Selected-qualities";
      await generate(
        inward.filter((r) => keep.has(r.QualityName)),
        outward.filter((r) => keep.has(r.QualityName)),
        label
      );
    } catch (err) {
      setMessage({ ok: false, text: `Export failed — ${err.message || "try again"}` });
    } finally {
      setBusy(false);
    }
  }

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
      const names = Array.from(new Set([...inward, ...outward].map((r) => r.QualityName))).sort((x, y) =>
        x.localeCompare(y)
      );
      if (names.length > 1) {
        setPending({ inward, outward, names }); // let the user choose the qualities first
        return;
      }
      await generate(inward, outward, names[0]);
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
        Saves a PDF of colour-wise Difference (m) tables for the filters above.
      </p>
      {pending && (
        <QualityPicker qualities={pending.names} onCancel={() => setPending(null)} onConfirm={confirmPick} />
      )}
      {message && (
        <p className={`text-sm text-center font-semibold ${message.ok ? "text-emerald-700" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
