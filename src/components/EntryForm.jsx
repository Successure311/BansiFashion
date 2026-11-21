import { useMemo, useState } from "react";
import DateField from "./DateField";
import QualitySelect from "./QualitySelect";
import ColourInput, { colourError } from "./ColourInput";
import { isApcColour, apcText as stripApc, makeApcColour } from "../data/apc";
import { appendEntry } from "../api/sheetApi";

const MODE_CONFIG = {
  // Inward's extra column is an optional "Remarks" box. The sheet column is still
  // called LotNo, so the Google Sheet / Apps Script need no change.
  Inward: { refField: "LotNo", refLabel: "Remarks", optional: true },
  Outward: { refField: "ChallanNo", refLabel: "Challan No." },
};

function toSheetDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function EntryForm({ mode, qualities, addQuality, showToast, rows = [], onApcSaved }) {
  const config = MODE_CONFIG[mode];
  const [date, setDate] = useState(new Date());
  const [qualityName, setQualityName] = useState("");
  const [colourNo, setColourNo] = useState("");
  const [meter, setMeter] = useState("");
  const [apcMode, setApcMode] = useState(false);
  const [apcText, setApcText] = useState("");
  const [refValue, setRefValue] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedQuality = useMemo(
    () => qualities.find((q) => q.name === qualityName) || null,
    [qualities, qualityName]
  );

  // APC remarks already saved for this quality (Inward or Outward), shown for quick re-use.
  const apcSuggestions = useMemo(() => {
    const seen = new Map();
    for (const r of rows) {
      if (r.QualityName === qualityName && isApcColour(r.ColourNo)) {
        const t = stripApc(r.ColourNo);
        if (t && !seen.has(t.toLowerCase())) seen.set(t.toLowerCase(), t);
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
  }, [rows, qualityName]);

  const colourOk = apcMode
    ? apcText.trim() !== ""
    : colourNo !== "" && !colourError(selectedQuality, colourNo);
  const refOk = config.optional || refValue.trim() !== "";
  const isValid = date && qualityName && colourOk && meter !== "" && refOk;

  function resetFieldsAfterSubmit() {
    setQualityName("");
    setColourNo("");
    setApcMode(false);
    setApcText("");
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
      ColourNo: apcMode ? makeApcColour(apcText) : colourNo,
      Meter: meter,
      [config.refField]: refValue.trim(),
      // Inward remarks are sent under both names so the app works with the old
      // (LotNo) and the new (Remarks) Apps Script, whichever is deployed.
      ...(mode === "Inward" ? { Remarks: refValue.trim() } : {}),
    };

    // Optimistic: confirm instantly and clear the form so the next entry can
    // be typed right away. The actual save to the sheet happens in the
    // background; only surface a toast if it turns out to have failed.
    showToast(`${mode} Entry Done`, "success");
    if (apcMode) onApcSaved?.(qualityName, row.ColourNo);
    resetFieldsAfterSubmit();
    setSaving(true);
    setTimeout(() => setSaving(false), 400); // brief guard against a double-tap

    appendEntry(mode, row).catch((err) => {
      showToast(
        `Could not save ${mode.toLowerCase()} entry (${row.QualityName} ${row.ColourNo}) — ${
          err.message || "check your connection"
        }`,
        "error"
      );
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 surface-card card-accent rounded-3xl p-5 pt-6">
      <div>
        <h2 className="form-title">{mode} Entry</h2>
        <p className="form-sub">
          {mode === "Inward" ? "Record fabric received into stock" : "Record fabric sent out of stock"}
        </p>
        <div className="orn" aria-hidden>◆</div>
      </div>

      <DateField value={date} onChange={setDate} />

      <QualitySelect
        qualities={qualities}
        value={qualityName}
        onChange={(name) => {
          setQualityName(name);
          setColourNo("");
          setApcMode(false);
          setApcText("");
        }}
        onAddQuality={addQuality}
        showToast={showToast}
      />

      <ColourInput
        quality={selectedQuality}
        value={colourNo}
        onChange={setColourNo}
        apcMode={apcMode}
        onApcMode={setApcMode}
        apcText={apcText}
        onApcText={setApcText}
        apcSuggestions={apcSuggestions}
      />

      <div>
        <label className="lbl">Meter</label>
        <input
          type="number"
          step="0.01"
          inputMode="decimal"
          value={meter}
          onChange={(e) => setMeter(e.target.value)}
          className="w-full field rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
        />
      </div>

      <div>
        <label className="lbl">
          {config.refLabel}
          {config.optional && <span className="ml-1.5 text-xs font-normal text-gray-400">(optional)</span>}
        </label>
        <input
          type="text"
          inputMode={config.optional ? "text" : "numeric"}
          value={refValue}
          onChange={(e) => setRefValue(e.target.value)}
          className="w-full field rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
        />
      </div>

      <button
        type="submit"
        disabled={!isValid || saving}
        className="w-full btn-primary py-3.5 font-bold text-white text-base"
      >
        Add {mode} Entry  →
      </button>
    </form>
  );
}
