import { useMemo, useState } from "react";
import DateFilter from "./DateFilter";
import { useDateFilter } from "../hooks/useDateFilter";
import { inRange, formatDisplayDate } from "../data/analytics";

function describe(range) {
  if (!range) return "All dates";
  return range.from === range.to
    ? formatDisplayDate(range.from)
    : `${formatDisplayDate(range.from)} to ${formatDisplayDate(range.to)}`;
}

// Pick dates, then download one Excel workbook with the raw data, the main
// table, pivots, charts and a stock position sheet.
export default function ExportView({ raw, loading, error, onRefresh }) {
  const dates = useDateFilter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const inward = useMemo(() => inRange(raw.inward, dates.range), [raw.inward, dates.range]);
  const outward = useMemo(() => inRange(raw.outward, dates.range), [raw.outward, dates.range]);
  const empty = inward.length + outward.length === 0;

  async function handleExport() {
    setBusy(true);
    setMessage(null);
    try {
      // Loaded on demand so the Excel library isn't part of the normal app download.
      const { exportExcel } = await import("../export/exportExcel");
      await exportExcel({ inward, outward, label: describe(dates.range) });
      setMessage({ ok: true, text: "Excel file downloaded." });
    } catch (err) {
      setMessage({ ok: false, text: `Export failed — ${err.message || "try again"}` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="surface-card card-accent rounded-3xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-800">Export Excel</h2>
        <button onClick={onRefresh} className="text-xs font-semibold text-brand hover:text-brand-dark">
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <DateFilter {...dates} onChange={dates.set} />

      <div className="rounded-2xl bg-brand-light p-4 text-sm text-gray-700 space-y-1">
        <p>
          <b>{describe(dates.range)}</b>
        </p>
        <p>
          {inward.length} inward entries · {outward.length} outward entries
        </p>
        <p className="text-xs text-gray-500 pt-1">
          Sheets: Overview (with graphs), Main Table, Quality Summary, Day-wise, Pivot Inward, Pivot Outward, Stock
          Position, Inward Data, Outward Data.
        </p>
      </div>

      <button
        type="button"
        onClick={handleExport}
        disabled={busy || loading || empty}
        className="w-full btn-primary py-3.5 font-bold text-white text-base"
      >
        {busy ? "Preparing…" : "Export Excel  ↓"}
      </button>
      {empty && !loading && <p className="text-xs text-gray-400 text-center">No entries for this selection.</p>}
      {message && (
        <p className={`text-sm text-center font-semibold ${message.ok ? "text-emerald-700" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
