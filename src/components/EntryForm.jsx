import { useMemo, useRef, useState } from "react";
import DateField from "./DateField";
import QualitySelect from "./QualitySelect";
import ColourInput, { colourError } from "./ColourInput";
import { hasRanges } from "../data/ranges";
import { isApcColour, apcText as stripApc, makeApcColour } from "../data/apc";
import { appendEntry } from "../api/sheetApi";

const MODE_CONFIG = {
  // Inward's extra column is an optional "Remarks" box. The sheet column is still
  // called LotNo, so the Google Sheet / Apps Script need no change.
  Inward: { refField: "LotNo", refLabel: "Remarks", optional: true, inputMode: "text" },
  // Challan No. is optional too, but without the "(optional)" tag.
  Outward: { refField: "ChallanNo", refLabel: "Challan No.", optional: true, hideTag: true, inputMode: "numeric" },
};

function toSheetDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Enter moves to the next field; Enter on the last field saves the entry.
const NEXT_FIELD = { colour: "meter", meter: "ref" };

export default function EntryForm({ mode, qualities, addQuality, updateQuality, showToast, rows = [], onApcSaved }) {
  const config = MODE_CONFIG[mode];
  const [date, setDate] = useState(new Date());
  const [qualityName, setQualityName] = useState("");
  const [colourNo, setColourNo] = useState("");
  const [meter, setMeter] = useState("");
  const [apcMode, setApcMode] = useState(false);
  const [apcText, setApcText] = useState("");
  const [refValue, setRefValue] = useState("");
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);

  // `quiet`: focus without popping open the quality list (used after a save).
  function focusField(name, quiet = false) {
    const el = formRef.current?.querySelector(`[data-field="${name}"]`);
    if (!el) return;
    if (quiet) el.dataset.quiet = "1";
    el.focus();
  }

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

  function handleKeyDown(e) {
    if (e.key !== "Enter" || e.defaultPrevented || e.target.tagName !== "INPUT") return;
    const field = e.target.dataset.field;
    if (!field) return;
    e.preventDefault();
    if (field === "ref") {
      if (isValid && !saving) formRef.current?.requestSubmit();
    } else if (NEXT_FIELD[field]) {
      focusField(NEXT_FIELD[field]);
    }
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
    // On a laptop, go straight back to the quality box for the next entry.
    if (window.matchMedia?.("(pointer: fine)").matches) setTimeout(() => focusField("quality", true), 0);
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
    <form ref={formRef} onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4 surface-card card-accent rounded-3xl p-5 pt-6">
      <div>
        <h2 className="form-title">{mode} Entry</h2>
        <p className="form-sub">
          {mode === "Inward" ? "Record fabric received into stock" : "Record fabric sent out of stock"}
        </p>
        <div className="orn" aria-hidden />
      </div>

      <DateField value={date} onChange={setDate} />

      <QualitySelect
        qualities={qualities}
        value={qualityName}
        onChange={(name) => {
          setQualityName(name);
          setColourNo("");
          // A quality with no colour range only takes APC entries, so start in APC mode.
          const picked = qualities.find((q) => q.name === name);
          setApcMode(!!picked && !hasRanges(picked));
          setApcText("");
        }}
        onAddQuality={addQuality}
        onUpdateQuality={updateQuality}
        showToast={showToast}
        onPicked={() => setTimeout(() => focusField("colour"), 60)}
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
          data-field="meter"
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
          {config.optional && !config.hideTag && <span>(optional)</span>}
        </label>
        <input
          type="text"
          data-field="ref"
          inputMode={config.inputMode}
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
