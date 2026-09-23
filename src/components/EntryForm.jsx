import { useMemo, useState } from "react";
import DateField from "./DateField";
import QualitySelect from "./QualitySelect";
import ColourInput from "./ColourInput";
import { appendEntry } from "../api/sheetApi";

const MODE_CONFIG = {
  Inward: { refField: "LotNo", refLabel: "Lot No." },
  Outward: { refField: "ChallanNo", refLabel: "Challan No." },
};

function toSheetDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function EntryForm({ mode, qualities, addQuality, showToast }) {
  const config = MODE_CONFIG[mode];
  const [date, setDate] = useState(new Date());
  const [qualityName, setQualityName] = useState("");
  const [colourNo, setColourNo] = useState("");
  const [meter, setMeter] = useState("");
  const [refValue, setRefValue] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedQuality = useMemo(
    () => qualities.find((q) => q.name === qualityName) || null,
    [qualities, qualityName]
  );

  const isValid = date && qualityName && colourNo !== "" && meter !== "" && refValue.trim() !== "";

  function resetFieldsAfterSubmit() {
    setQualityName("");
    setColourNo("");
    setMeter("");
    setRefValue("");
    // date is kept, since consecutive entries are usually the same day
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || saving) return;

    const row = {
      Date: toSheetDate(date),
      QualityName: qualityName,
      ColourNo: colourNo,
      Meter: meter,
      [config.refField]: refValue.trim(),
    };

    // Optimistic: confirm instantly and clear the form so the next entry can
    // be typed right away. The actual save to the sheet happens in the
    // background; only surface a toast if it turns out to have failed.
    showToast(`${mode} Entry Done`, "success");
    resetFieldsAfterSubmit();
    setSaving(true);
    setTimeout(() => setSaving(false), 400); // brief guard against a double-tap

    appendEntry(mode, row).catch((err) => {
      showToast(
        `Could not save ${mode.toLowerCase()} entry (${config.refLabel} ${row[config.refField]}) — ${
          err.message || "check your connection"
        }`,
        "error"
      );
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <DateField value={date} onChange={setDate} />

      <QualitySelect
        qualities={qualities}
        value={qualityName}
        onChange={(name) => {
          setQualityName(name);
          setColourNo("");
        }}
        onAddQuality={addQuality}
        showToast={showToast}
      />

      <ColourInput quality={selectedQuality} value={colourNo} onChange={setColourNo} />

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Meter</label>
        <input
          type="number"
          step="0.01"
          inputMode="decimal"
          value={meter}
          onChange={(e) => setMeter(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">{config.refLabel}</label>
        <input
          type="text"
          inputMode="numeric"
          value={refValue}
          onChange={(e) => setRefValue(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
        />
      </div>

      <button
        type="submit"
        disabled={!isValid || saving}
        className="w-full rounded-lg bg-brand py-3 font-bold text-white text-base hover:bg-brand-dark disabled:opacity-50 transition-colors"
      >
        Add {mode} Entry
      </button>
    </form>
  );
}
