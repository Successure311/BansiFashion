import { useMemo } from "react";

export default function ColourInput({ quality, value, onChange }) {
  const hasRange = !!quality && Number.isFinite(quality.start) && Number.isFinite(quality.end);

  const options = useMemo(() => {
    if (!hasRange) return [];
    const { start, end } = quality;
    if (end < start) return [];
    const list = [];
    for (let n = start; n <= end; n++) list.push(n);
    return list;
  }, [hasRange, quality]);

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        Colour No.
        {hasRange && (
          <span className="ml-1 text-xs font-normal text-gray-400">
            ({quality.start}–{quality.end})
          </span>
        )}
      </label>
      <input
        type="number"
        list={hasRange ? "colour-options" : undefined}
        inputMode="numeric"
        value={value}
        min={hasRange ? quality.start : undefined}
        max={hasRange ? quality.end : undefined}
        disabled={!quality}
        onChange={(e) => onChange(e.target.value)}
        placeholder={quality ? "Enter colour no." : "Select quality first"}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand disabled:bg-gray-100 disabled:text-gray-400"
      />
      {hasRange && (
        <datalist id="colour-options">
          {options.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      )}
    </div>
  );
}
