import { useMemo, useState } from "react";
import SummaryCards from "./SummaryCards";
import BreakdownTable from "./BreakdownTable";
import ColourSearch from "./ColourSearch";
import DateField from "./DateField";
import { buildRange } from "../data/dates";

const DATE_MODES = [
  { id: "all", label: "All dates" },
  { id: "single", label: "Single date" },
  { id: "range", label: "Date range" },
];

function sumOf(rows, field) {
  return rows.reduce((total, r) => total + r[field], 0);
}

export default function AnalysisTab({ qualities, entries, onRangeChange }) {
  const { rows, loading, error, refresh } = entries;
  const [qualityName, setQualityName] = useState("");
  const [colourNo, setColourNo] = useState("");
  // No date picked = all dates (the default).
  const [dateMode, setDateMode] = useState("all");
  const [d1, setD1] = useState(() => new Date());
  const [d2, setD2] = useState(() => new Date());

  function applyDates(mode, a, b) {
    setDateMode(mode);
    setD1(a);
    setD2(b);
    onRangeChange(buildRange(mode, a, b));
  }

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
      Array.from(new Set(qualityRows.map((r) => r.ColourNo))).sort((a, b) => {
        const na = Number(a);
        const nb = Number(b);
        if (Number.isNaN(na) || Number.isNaN(nb)) {
          if (Number.isNaN(na) && Number.isNaN(nb)) return a.localeCompare(b);
          return Number.isNaN(na) ? 1 : -1; // APC remarks after numbers
        }
        return na - nb;
      }),
    [qualityRows]
  );

  // Colour-wise rows for the selected quality (one colour if one is picked).
  const colourRows = useMemo(() => {
    const order = new Map(colourOptions.map((c, i) => [c, i]));
    return (colourNo ? qualityRows.filter((r) => r.ColourNo === colourNo) : qualityRows)
      .map((r) => ({ key: r.ColourNo, inward: r.Inward, outward: r.Outward }))
      .sort((x, y) => order.get(x.key) - order.get(y.key));
  }, [qualityRows, colourOptions, colourNo]);

  const shown = colourNo ? qualityRows.filter((r) => r.ColourNo === colourNo) : qualityRows;
  const summaryInward = sumOf(shown, "Inward");
  const summaryOutward = sumOf(shown, "Outward");

  function selectQuality(name) {
    setQualityName(name);
    setColourNo("");
    // Dates only apply once a quality is picked; back to all qualities = all dates.
    if (!name && dateMode !== "all") applyDates("all", d1, d2);
  }

  return (
    <div className="space-y-5">
      <div className="surface-card rounded-3xl p-5 space-y-4">
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
            <label className="lbl">Quality Name</label>
            <select
              value={qualityName}
              onChange={(e) => selectQuality(e.target.value)}
              className="w-full field rounded-xl border border-gray-200 px-3.5 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
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
              <label className="lbl">
                Colour No. <span>(optional)</span>
              </label>
              <ColourSearch
                key={qualityName}
                options={colourOptions}
                value={colourNo}
                onChange={setColourNo}
              />
            </div>
          )}
          {qualityName && (
            <>
            <div>
              <label className="lbl">Date</label>
              <div className="grid grid-cols-3 gap-1.5 bg-brand-light rounded-xl p-1">
                {DATE_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => applyDates(m.id, d1, d2)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      dateMode === m.id ? "bg-white text-brand shadow" : "text-gray-500"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            {dateMode === "single" && (
              <DateField label="Date" value={d1} onChange={(d) => d && applyDates("single", d, d2)} />
            )}
            {dateMode === "range" && (
              <div className="grid grid-cols-2 gap-3">
                <DateField label="From" value={d1} onChange={(d) => d && applyDates("range", d, d2)} />
                <DateField label="To" value={d2} onChange={(d) => d && applyDates("range", d1, d)} />
              </div>
            )}
            </>
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
          <div className="surface-card rounded-3xl p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-500">Colour-wise</p>
            <BreakdownTable
              columnLabel="Colour No."
              rows={colourRows}
              emptyMessage="No entries for this quality yet."
            />
          </div>
        </>
      ) : (
        <div className="surface-card rounded-3xl p-5 space-y-3">
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
