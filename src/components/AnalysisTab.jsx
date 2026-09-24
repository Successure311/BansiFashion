import { useMemo, useState } from "react";
import SummaryCards from "./SummaryCards";
import BreakdownTable from "./BreakdownTable";
import ColourSearch from "./ColourSearch";

function sumMeter(rows) {
  return rows.reduce((total, r) => total + (Number(r.Meter) || 0), 0);
}

// One pass over the rows instead of re-filtering per quality.
function totalsBy(rows, key) {
  const map = new Map();
  for (const r of rows) map.set(r[key], (map.get(r[key]) || 0) + r.Meter);
  return map;
}

export default function AnalysisTab({ qualities, entries }) {
  const { inward, outward, loading, error, refresh } = entries;
  const [qualityName, setQualityName] = useState("");
  const [colourNo, setColourNo] = useState("");

  // Default view (no quality picked): every quality's totals at a glance.
  const allQualityRows = useMemo(() => {
    const inTotals = totalsBy(inward, "QualityName");
    const outTotals = totalsBy(outward, "QualityName");
    return Array.from(new Set([...inTotals.keys(), ...outTotals.keys()]))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
        key: name,
        inward: inTotals.get(name) || 0,
        outward: outTotals.get(name) || 0,
      }));
  }, [inward, outward]);

  const qualityInward = useMemo(
    () => inward.filter((r) => r.QualityName === qualityName),
    [inward, qualityName]
  );
  const qualityOutward = useMemo(
    () => outward.filter((r) => r.QualityName === qualityName),
    [outward, qualityName]
  );

  const colourOptions = useMemo(() => {
    const set = new Set([
      ...qualityInward.map((r) => r.ColourNo),
      ...qualityOutward.map((r) => r.ColourNo),
    ]);
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [qualityInward, qualityOutward]);

  const summaryInward = colourNo
    ? sumMeter(qualityInward.filter((r) => r.ColourNo === colourNo))
    : sumMeter(qualityInward);
  const summaryOutward = colourNo
    ? sumMeter(qualityOutward.filter((r) => r.ColourNo === colourNo))
    : sumMeter(qualityOutward);

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
