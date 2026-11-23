import { useMemo, useState } from "react";

// Pop-up used by Export Report: tick the qualities (from the data that exists) to put in the PDF.
// Has a search box for long lists, plus Select all / Clear for the names currently shown.
export default function QualityPicker({ qualities, onCancel, onConfirm }) {
  const [selected, setSelected] = useState(() => new Set(qualities));
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return words.length ? qualities.filter((q) => words.every((w) => q.toLowerCase().includes(w))) : qualities;
  }, [qualities, query]);

  function toggle(name) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function setShown(on) {
    setSelected((prev) => {
      const next = new Set(prev);
      shown.forEach((q) => (on ? next.add(q) : next.delete(q)));
      return next;
    });
  }

  // Keep the original (alphabetical) order in the report.
  const chosen = qualities.filter((q) => selected.has(q));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-5 max-h-[90vh] flex flex-col">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Select Qualities for Report</h3>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search quality…"
          autoComplete="off"
          className="w-full field rounded-xl border border-gray-200 px-3.5 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
        />

        <div className="flex items-center justify-between mt-3 mb-2 text-sm">
          <span className="text-gray-500">
            {chosen.length} of {qualities.length} selected
          </span>
          <span className="flex gap-4 font-semibold text-brand">
            <button type="button" onClick={() => setShown(true)}>
              Select all
            </button>
            <button type="button" onClick={() => setShown(false)}>
              Clear
            </button>
          </span>
        </div>

        <ul className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-100">
          {shown.length === 0 && <li className="px-3.5 py-3 text-sm text-gray-400">No matching quality</li>}
          {shown.map((q) => (
            <li key={q}>
              <label className="flex items-center gap-3 px-3.5 py-3 cursor-pointer active:bg-brand-light">
                <input
                  type="checkbox"
                  checked={selected.has(q)}
                  onChange={() => toggle(q)}
                  className="w-5 h-5 shrink-0 accent-[#8e2466]"
                />
                <span className="text-base text-gray-800">{q}</span>
              </label>
            </li>
          ))}
        </ul>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-300 py-3 font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(chosen)}
            disabled={chosen.length === 0}
            className="flex-1 btn-primary py-3 font-semibold text-white"
          >
            Generate PDF
          </button>
        </div>
      </div>
    </div>
  );
}
