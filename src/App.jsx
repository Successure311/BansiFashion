import { useState } from "react";
import Header from "./components/Header";
import TabBar from "./components/TabBar";
import EntryForm from "./components/EntryForm";
import AnalysisTab from "./components/AnalysisTab";
import Toast from "./components/Toast";
import { useQualities } from "./hooks/useQualities";
import { useEntries } from "./hooks/useEntries";
import { useToast } from "./hooks/useToast";

export default function App() {
  const [activeTab, setActiveTab] = useState("Inward");
  const { qualities, addQuality } = useQualities();
  const entries = useEntries(activeTab === "Analysis");
  const { toast, showToast, dismiss } = useToast();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <TabBar active={activeTab} onChange={setActiveTab} />

      <main className="flex-1 px-4 pb-10 max-w-md w-full mx-auto">
        {activeTab === "Inward" && (
          <EntryForm mode="Inward" qualities={qualities} addQuality={addQuality} showToast={showToast} />
        )}
        {activeTab === "Outward" && (
          <EntryForm mode="Outward" qualities={qualities} addQuality={addQuality} showToast={showToast} />
        )}
        {activeTab === "Analysis" && <AnalysisTab qualities={qualities} entries={entries} />}
      </main>

      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
