import DateField from "./DateField";

const DATE_MODES = [
  { id: "all", label: "All dates" },
  { id: "single", label: "Single date" },
  { id: "range", label: "Date range" },
];

// All dates (default) / single date / date range. Controlled by the parent.
export default function DateFilter({ mode, d1, d2, onChange }) {
  return (
    <>
      <div>
        <label className="lbl">Date</label>
        <div className="grid grid-cols-3 gap-1.5 bg-brand-light rounded-xl p-1">
          {DATE_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id, d1, d2)}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                mode === m.id ? "bg-white text-brand shadow" : "text-gray-500"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      {mode === "single" && (
        <DateField label="Date" value={d1} onChange={(d) => d && onChange("single", d, d2)} />
      )}
      {mode === "range" && (
        <div className="grid grid-cols-2 gap-3">
          <DateField label="From" value={d1} onChange={(d) => d && onChange("range", d, d2)} />
          <DateField label="To" value={d2} onChange={(d) => d && onChange("range", d1, d)} />
        </div>
      )}
    </>
  );
}
