import { useCallback, useMemo, useState } from "react";
import Header from "./components/Header";
import EntryForm from "./components/EntryForm";
import AnalysisHub from "./components/AnalysisHub";
import Toast from "./components/Toast";
import { useQualities } from "./hooks/useQualities";
import { useEntries } from "./hooks/useEntries";
import { useToast } from "./hooks/useToast";

export default function App() {
  const [activeTab, setActiveTab] = useState("Inward");
  const { qualities, addQuality } = useQualities();
  const [range, setRange] = useState(null); // Analysis date filter; null = all dates
  const entries = useEntries(activeTab !== "Inward", range);
  const { toast, showToast, dismiss } = useToast();

  // APC remarks saved on this device show up instantly in the suggestions,
  // before the sheet totals have refreshed.
  const [localApc, setLocalApc] = useState([]);
  const onApcSaved = useCallback(
    (QualityName, ColourNo) => setLocalApc((prev) => [...prev, { QualityName, ColourNo }]),
    []
  );
  const entryRows = useMemo(() => [...entries.rows, ...localApc], [entries.rows, localApc]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header active={activeTab} onChange={setActiveTab} />

      <main className="flex-1 px-4 pt-5 pb-10 max-w-md w-full mx-auto">
        {activeTab === "Inward" && (
          <EntryForm mode="Inward" qualities={qualities} addQuality={addQuality} showToast={showToast} rows={entryRows} onApcSaved={onApcSaved} />
        )}
        {activeTab === "Outward" && (
          <EntryForm mode="Outward" qualities={qualities} addQuality={addQuality} showToast={showToast} rows={entryRows} onApcSaved={onApcSaved} />
        )}
        {activeTab === "Analysis" && <AnalysisHub qualities={qualities} entries={entries} onRangeChange={setRange} />}
      </main>

      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
