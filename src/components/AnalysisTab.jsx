import { useMemo, useState } from "react";
import SummaryCards from "./SummaryCards";
import BreakdownTable from "./BreakdownTable";
import ColourSearch from "./ColourSearch";

function sumOf(rows, field) {
  return rows.reduce((total, r) => total + r[field], 0);
}

export default function AnalysisTab({ qualities, entries }) {
  const { rows, loading, error, refresh } = entries;
  const [qualityName, setQualityName] = useState("");
  const [colourNo, setColourNo] = useState("");

  // Default view (no quality picked): every quality's totals at a glance.
  const allQualityRows = useMemo(() => {
    const byQuality = new Map();
    for (const r of rows) {
      const t = byQuality.get(r.QualityName) || { key: r.QualityName, inward: 0, outward: 0 };
      t.inward += r.Inward;
      t.outward += r.Outward;
      byQuality.set(r.QualityName, t);
    }
    return Array.from(byQuality.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [rows]);

  const qualityRows = useMemo(
    () => rows.filter((r) => r.QualityName === qualityName),
    [rows, qualityName]
  );

  const colourOptions = useMemo(
    () =>
      Array.from(new Set(qualityRows.map((r) => r.ColourNo))).sort(
        (a, b) => Number(a) - Number(b)
      ),
    [qualityRows]
  );

  const shown = colourNo ? qualityRows.filter((r) => r.ColourNo === colourNo) : qualityRows;
  const summaryInward = sumOf(shown, "Inward");
  const summaryOutward = sumOf(shown, "Outward");

  function selectQuality(name) {
    setQualityName(name);
    setColourNo("");
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">Analysis</h2>
          <button
            onClick={refresh}
            className="text-xs font-semibold text-brand hover:text-brand-dark"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Quality Name</label>
            <select
              value={qualityName}
              onChange={(e) => selectQuality(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            >
              <option value="">All qualities</option>
              {qualities.map((q) => (
                <option key={q.name} value={q.name}>
                  {q.name}
                </option>
              ))}
            </select>
          </div>

          {qualityName && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Colour No. (optional)
              </label>
              <ColourSearch
                key={qualityName}
                options={colourOptions}
                value={colourNo}
                onChange={setColourNo}
              />
            </div>
          )}
        </div>
      </div>

      {qualityName ? (
        <>
          <SummaryCards
            totalInward={summaryInward}
            totalOutward={summaryOutward}
            label={colourNo ? `${qualityName} — Colour ${colourNo}` : qualityName}
          />
        </>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
          <p className="text-sm font-semibold text-gray-500">All qualities</p>
          <BreakdownTable
            columnLabel="Quality Name"
            rows={allQualityRows}
            onRowClick={selectQuality}
            emptyMessage="No entries yet."
          />
        </div>
      )}
    </div>
  );
}
