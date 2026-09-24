import { useState } from "react";
import AddQualityModal from "./AddQualityModal";

const OTHER = "__other__";

export default function QualitySelect({ qualities, value, onChange, onAddQuality, showToast }) {
  const [modalOpen, setModalOpen] = useState(false);

  function handleSelect(e) {
    if (e.target.value === OTHER) {
      setModalOpen(true);
      return;
    }
    onChange(e.target.value);
  }

  async function handleAdd({ name, start, end }) {
    const savedName = await onAddQuality({ name, start, end });
    onChange(savedName);
    setModalOpen(false);
    showToast?.(`Added new quality "${savedName}"`, "success");
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">Quality Name</label>
      <select
        value={value || ""}
        onChange={handleSelect}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
      >
        <option value="">
          Select quality…
        </option>
        {qualities.map((q) => (
          <option key={q.name} value={q.name}>
            {q.name}
          </option>
        ))}
        <option value={OTHER}>Other… (add new quality)</option>
      </select>

      {modalOpen && (
        <AddQualityModal onClose={() => setModalOpen(false)} onAdd={handleAdd} />
      )}
    </div>
  );
}
