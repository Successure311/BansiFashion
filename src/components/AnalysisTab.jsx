import { useMemo, useState } from "react";
import { useEntries } from "../hooks/useEntries";
import SummaryCards from "./SummaryCards";
import ColourBreakdownTable from "./ColourBreakdownTable";

function sumMeter(rows) {
  return rows.reduce((total, r) => total + (Number(r.Meter) || 0), 0);
}

export default function AnalysisTab({ qualities }) {
  const { inward, outward, loading, error, refresh } = useEntries();
  const [qualityName, setQualityName] = useState("");
  const [colourNo, setColourNo] = useState("");

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

  const breakdownRows = useMemo(() => {
    return colourOptions.map((colour) => ({
      colour,
      inward: sumMeter(qualityInward.filter((r) => r.ColourNo === colour)),
      outward: sumMeter(qualityOutward.filter((r) => r.ColourNo === colour)),
    }));
  }, [colourOptions, qualityInward, qualityOutward]);

  const summaryInward = colourNo
    ? sumMeter(qualityInward.filter((r) => r.ColourNo === colourNo))
    : sumMeter(qualityInward);
  const summaryOutward = colourNo
    ? sumMeter(qualityOutward.filter((r) => r.ColourNo === colourNo))
    : sumMeter(qualityOutward);

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
              onChange={(e) => {
                setQualityName(e.target.value);
                setColourNo("");
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            >
              <option value="">Select quality…</option>
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
              <select
                value={colourNo}
                onChange={(e) => setColourNo(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              >
                <option value="">All colours</option>
                {colourOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-500">Colour-wise breakdown</p>
            <ColourBreakdownTable rows={breakdownRows} activeColour={colourNo} />
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-400 text-center py-10">
          Select a quality above to see Inward / Outward totals.
        </p>
      )}
    </div>
  );
}
