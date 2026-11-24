import { useState } from "react";
import QualityPicker from "./QualityPicker";
import { sheetReadMany } from "../api/sheetApi";
import { inRange, normaliseRaw } from "../data/analytics";
import { isApcColour } from "../data/apc";

// End of the Analysis page. Downloads a PDF of colour-wise Difference (m) tables for the
// filters above. With more than one quality in the data, a pop-up first lets you pick which
// qualities go in the report. Reads the sheet fresh when tapped, so it has the latest entries.
export default function ExportButton({ range, quality = "", colour = "", qualities = [] }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [pending, setPending] = useState(null); // { inward, outward, items } waiting for the quality / range pick

  async function generate(inward, outward, label) {
    // Loaded on demand so the PDF library isn't part of the normal app download.
    const { exportPdf } = await import("../export/exportPdf");
    const safe = (label || "Report").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await exportPdf({ inward, outward, range, name: `${safe}-${new Date().toISOString().slice(0, 10)}` });
    setMessage({ ok: true, text: "PDF report downloaded." });
  }

  async function confirmPick(chosen) {
    const { inward, outward, items } = pending;
    setPending(null);
    setBusy(true);
    setMessage(null);
    try {
      const byName = new Map(chosen.map((c) => [c.name, c.keys]));
      const rangesOf = new Map(items.map((i) => [i.name, i.ranges]));
      // A row stays if its quality is ticked and, when only some colour ranges are ticked, its colour is in one of them.
      const keep = (r) => {
        if (!byName.has(r.QualityName)) return false;
        const keys = byName.get(r.QualityName);
        if (!keys) return true;
        if (isApcColour(r.ColourNo)) return keys.has("APC");
        const n = Number(r.ColourNo);
        return (rangesOf.get(r.QualityName) || []).some((g) => n >= g.start && n <= g.end && keys.has(`${g.start}-${g.end}`));
      };
      const label = chosen.length === 1 ? chosen[0].name : chosen.length === items.length ? "All-qualities" : "Selected-qualities";
      await generate(inward.filter(keep), outward.filter(keep), label);
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
      const allRows = [...inward, ...outward];
      const names = Array.from(new Set(allRows.map((r) => r.QualityName))).sort((x, y) => x.localeCompare(y));
      const items = names.map((name) => ({
        name,
        ranges: qualities.find((q) => q.name === name)?.ranges || [],
        hasApc: allRows.some((r) => r.QualityName === name && isApcColour(r.ColourNo)),
      }));
      // Several qualities, or one quality with several colour ranges: let the user choose what goes in.
      if (names.length > 1 || items[0].ranges.length > 1) {
        setPending({ inward, outward, items });
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
        Saves a PDF of the colour-wise table for the filters above.
      </p>
      {pending && (
        <QualityPicker items={pending.items} onCancel={() => setPending(null)} onConfirm={confirmPick} />
      )}
      {message && (
        <p className={`text-sm text-center font-semibold ${message.ok ? "text-emerald-700" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
