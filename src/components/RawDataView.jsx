import { useMemo, useState } from "react";
import DateFilter from "./DateFilter";
import { useDateFilter } from "../hooks/useDateFilter";
import { colourSort, formatDisplayDate, inRange, sumMeters } from "../data/analytics";

const MAX_ROWS = 500;

function fmt(n) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

// Every Inward (or Outward) entry, filtered by quality and date.
export default function RawDataView({ kind, rows, qualities, loading, error, onRefresh }) {
  const [quality, setQuality] = useState("");
  const dates = useDateFilter();
  const noteLabel = kind === "Inward" ? "Remarks" : "Challan No.";

  const shown = useMemo(() => {
    const list = inRange(rows, dates.range).filter((r) => !quality || r.QualityName === quality);
    return [...list].sort(
      (a, b) =>
        b.Date.localeCompare(a.Date) ||
        a.QualityName.localeCompare(b.QualityName) ||
        colourSort(a.ColourNo, b.ColourNo)
    );
  }, [rows, dates.range, quality]);

  return (
    <div className="space-y-5">
      <div className="surface-card card-accent rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">{kind} Data</h2>
          <button onClick={onRefresh} className="text-xs font-semibold text-brand hover:text-brand-dark">
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <label className="lbl">Quality Name</label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="w-full field rounded-xl border border-gray-200 px-3.5 py-3 text-base bg-white focus:outline-none"
          >
            <option value="">All qualities</option>
            {qualities.map((q) => (
              <option key={q.name} value={q.name}>
                {q.name}
              </option>
            ))}
          </select>
        </div>
        <DateFilter {...dates} onChange={dates.set} />
      </div>

      <div className="surface-card card-accent rounded-3xl p-5 space-y-3">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-gray-500">{shown.length} entries</p>
          <p className="text-sm font-bold text-brand">{fmt(sumMeters(shown))} m</p>
        </div>
        {loading && !rows.length ? (
          <p className="text-sm text-gray-400 text-center py-6">Loading…</p>
        ) : shown.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No entries.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
                  <th className="text-left px-3 py-2.5">Date</th>
                  <th className="text-left px-3 py-2.5">Quality</th>
                  <th className="text-left px-3 py-2.5">Colour</th>
                  <th className="text-right px-3 py-2.5">Meter</th>
                  <th className="text-left px-3 py-2.5">{noteLabel}</th>
                </tr>
              </thead>
              <tbody>
                {shown.slice(0, MAX_ROWS).map((r, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-3 py-2.5">{formatDisplayDate(r.Date)}</td>
                    <td className="px-3 py-2.5 font-semibold text-gray-700">{r.QualityName}</td>
                    <td className="px-3 py-2.5">{r.ColourNo}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-brand">{fmt(r.Meter)}</td>
                    <td className="px-3 py-2.5 text-gray-500">{r.Note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {shown.length > MAX_ROWS && (
          <p className="text-xs text-gray-400 text-center">
            Showing the latest {MAX_ROWS} of {shown.length}. Use Export Excel for everything.
          </p>
        )}
      </div>
    </div>
  );
}
