import { useState } from "react";
import AnalysisTab from "./AnalysisTab";
import RawDataView from "./RawDataView";
import ExportView from "./ExportView";
import { useRawData } from "../hooks/useRawData";

const VIEWS = [
  { id: "summary", label: "Summary" },
  { id: "inward", label: "Inward Data" },
  { id: "outward", label: "Outward Data" },
  { id: "export", label: "Export Excel" },
];

// Analysis section: the totals summary plus Inward data, Outward data and Excel export.
export default function AnalysisHub({ qualities, entries, onRangeChange }) {
  const [view, setView] = useState("summary");
  const { raw, loading, error, refresh } = useRawData(view !== "summary");

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-1.5 tab-shell rounded-2xl p-1.5">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
              view === v.id ? "tab-active text-white" : "text-gray-500"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "summary" && <AnalysisTab qualities={qualities} entries={entries} onRangeChange={onRangeChange} />}
      {view === "inward" && (
        <RawDataView kind="Inward" rows={raw.inward} qualities={qualities} loading={loading} error={error} onRefresh={refresh} />
      )}
      {view === "outward" && (
        <RawDataView kind="Outward" rows={raw.outward} qualities={qualities} loading={loading} error={error} onRefresh={refresh} />
      )}
      {view === "export" && <ExportView raw={raw} loading={loading} error={error} onRefresh={refresh} />}
    </div>
  );
}
