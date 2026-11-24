import { useMemo, useState } from "react";

const rangeKey = (r) => `${r.start}-${r.end}`;
const APC_KEY = "APC";

// Pop-up used by Export Report: tick the qualities (from the data that exists) to put in the PDF.
// A quality with several colour ranges also shows its ranges, so the report can be limited to
// some of them. Search box for long lists, plus Select all / Clear for the names shown.
//
// `items`: [{ name, ranges: [{start, end}], hasApc }]  (ranges only when the quality has 2+)
// onConfirm receives [{ name, keys }]; `keys` is null (everything) or the Set of chosen range keys.
export default function QualityPicker({ items, onCancel, onConfirm }) {
  const [selected, setSelected] = useState(() => new Set(items.map((i) => i.name)));
  // name -> Set of ticked range keys (starts with every option ticked)
  const [picked, setPicked] = useState(() => new Map(items.map((i) => [i.name, new Set(optionsOf(i))])));
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return words.length ? items.filter((i) => words.every((w) => i.name.toLowerCase().includes(w))) : items;
  }, [items, query]);

  function toggle(name) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function toggleRange(item, key) {
    const cur = new Set(picked.get(item.name));
    if (cur.has(key)) cur.delete(key);
    else cur.add(key);
    setPicked(new Map(picked).set(item.name, cur));
    // Nothing left ticked under a quality = the quality is not in the report.
    setSelected((prev) => {
      const next = new Set(prev);
      if (cur.size === 0) next.delete(item.name);
      else next.add(item.name);
      return next;
    });
  }

  function setShown(on) {
    setSelected((prev) => {
      const next = new Set(prev);
      shown.forEach((i) => (on ? next.add(i.name) : next.delete(i.name)));
      return next;
    });
    if (on) {
      setPicked((prev) => {
        const next = new Map(prev);
        shown.forEach((i) => {
          if (next.get(i.name).size === 0) next.set(i.name, new Set(optionsOf(i)));
        });
        return next;
      });
    }
  }

  const chosen = items.filter((i) => selected.has(i.name));

  function confirm() {
    onConfirm(
      chosen.map((i) => {
        const all = optionsOf(i);
        const ticked = picked.get(i.name);
        const full = all.length === 0 || all.every((k) => ticked.has(k));
        return { name: i.name, keys: full ? null : ticked };
      })
    );
  }

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
            {chosen.length} of {items.length} selected
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
          {shown.map((i) => {
            const opts = optionsOf(i);
            return (
              <li key={i.name}>
                <label className="flex items-center gap-3 px-3.5 py-3 cursor-pointer active:bg-brand-light">
                  <input
                    type="checkbox"
                    checked={selected.has(i.name)}
                    onChange={() => toggle(i.name)}
                    className="w-5 h-5 shrink-0 accent-[#8e2466]"
                  />
                  <span className="text-base text-gray-800">{i.name}</span>
                </label>
                {opts.length > 0 && selected.has(i.name) && (
                  <div className="pl-11 pr-3.5 pb-3">
                    <p className="text-xs text-gray-400 mb-1">Colour ranges in the report</p>
                    <div className="flex flex-wrap gap-2">
                      {opts.map((k) => {
                        const on = picked.get(i.name).has(k);
                        return (
                          <label
                            key={k}
                            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm cursor-pointer ${
                              on ? "border-brand bg-brand-light text-brand" : "border-gray-200 text-gray-500"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => toggleRange(i, k)}
                              className="w-4 h-4 accent-[#8e2466]"
                            />
                            {k === APC_KEY ? "APC" : k.replace("-", "–")}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
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
            onClick={confirm}
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

// Range choices for a quality: its ranges (by start) plus APC when it has APC entries; none if it has a single range.
function optionsOf(item) {
  if (!item.ranges || item.ranges.length < 2) return [];
  const list = [...item.ranges].sort((a, b) => a.start - b.start).map(rangeKey);
  if (item.hasApc) list.push(APC_KEY);
  return list;
}
