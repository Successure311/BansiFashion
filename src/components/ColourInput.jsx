import { useMemo, useState } from "react";
import { colourNumbers, formatRanges, hasRanges, inRanges } from "../data/ranges";

const inputCls =
  "w-full field rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand disabled:bg-gray-100 disabled:text-gray-400";

// Whole-number colour inside the quality's fixed range (no range = any number).
export function colourError(quality, value) {
  if (!quality || value === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n)) return "Enter a whole colour number";
  // Only colours inside a fixed range are allowed; a quality with no range takes APC entries only.
  if (!hasRanges(quality)) return "No colour range set for this quality — use APC";
  if (!inRanges(quality, n)) {
    return `Colour must be in ${formatRanges(quality)}`;
  }
  return null;
}

// Colour number (validated against the quality's range) OR the APC option,
// which opens a free-text box. `apcSuggestions` are APC remarks already saved
// for this quality so Inward and Outward can pick the same ones.
export default function ColourInput({
  quality,
  value,
  onChange,
  apcMode,
  onApcMode,
  apcText,
  onApcText,
  apcSuggestions,
}) {
  const hasRange = hasRanges(quality);
  const options = useMemo(() => (hasRange ? colourNumbers(quality) : []), [hasRange, quality]);

  const error = apcMode ? null : colourError(quality, value);
  const [open, setOpen] = useState(false);
  // Saved APC remarks for this quality that match what is typed (all when empty).
  const typed = apcText.trim().toLowerCase();
  const matches = apcSuggestions.filter(
    (s) => s.toLowerCase().includes(typed) && s.toLowerCase() !== typed
  );

  return (
    <div>
      <label className="lbl flex-wrap">
        Colour No.
        {hasRange && !apcMode && <span>({formatRanges(quality)})</span>}
      </label>

      <div className="grid grid-cols-2 gap-1.5 bg-brand-light rounded-xl p-1 mb-2">
        {[
          { id: false, label: "Colour number" },
          { id: true, label: "APC" },
        ].map((o) => (
          <button
            key={o.label}
            type="button"
            disabled={!quality}
            onClick={() => onApcMode(o.id)}
            className={`py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 ${
              apcMode === o.id ? "bg-white text-brand shadow" : "text-gray-500"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {apcMode ? (
        <div className="relative">
          <input
            type="text"
            data-field="colour"
            autoComplete="off"
            value={apcText}
            onChange={(e) => {
              onApcText(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={apcSuggestions.length ? "Search saved APC or write new" : "Write APC remark"}
            className={inputCls}
          />
          {open && matches.length > 0 && (
            <ul className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
              {matches.map((m) => (
                <li
                  key={m}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onApcText(m);
                    setOpen(false);
                    document.activeElement?.blur();
                  }}
                  className="px-3.5 py-2.5 text-base cursor-pointer text-gray-800 active:bg-brand-light hover:bg-brand-light"
                >
                  {m}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          <input
            type="number"
            data-field="colour"
            step="1"
            list={hasRange ? "colour-options" : undefined}
            inputMode="numeric"
            value={value}
            disabled={!quality}
            onChange={(e) => onChange(e.target.value)}
            placeholder={quality ? "Enter colour no." : "Select quality first"}
            className={`${inputCls} ${error ? "!border-red-400 !ring-red-200" : ""}`}
          />
          {error && <p className="text-xs font-semibold text-red-600 mt-1">{error}</p>}
          {quality && !hasRange && !error && (
            <p className="text-xs font-semibold text-amber-700 mt-1">
              No colour range set for this quality — only APC entries are allowed. Add a range via "Other…" in Quality Name.
            </p>
          )}
          {hasRange && (
            <datalist id="colour-options">
              {options.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          )}
        </>
      )}
    </div>
  );
}
