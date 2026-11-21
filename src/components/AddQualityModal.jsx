import { useState } from "react";

const blankRange = () => ({ start: "", end: "" });
const boxCls =
  "w-full field rounded-xl border border-gray-200 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand";

export default function AddQualityModal({ initialName = "", onClose, onAdd }) {
  const [name, setName] = useState(initialName);
  const [rows, setRows] = useState([blankRange()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Ranges are optional: a row left completely blank is ignored, and a quality
  // with no ranges only takes APC entries. A started row needs both ends, end >= start.
  const rowState = rows.map((r) => {
    if (r.start === "" && r.end === "") return "blank";
    if (r.start !== "" && r.end !== "" && Number(r.end) >= Number(r.start)) return "ok";
    return "bad";
  });
  const isValid = name.trim() && !rowState.includes("bad");

  function update(i, key, value) {
    setRows((prev) => prev.map((r, k) => (k === i ? { ...r, [key]: value } : r)));
  }

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    setError(null);
    try {
      await onAdd({
        name: name.trim(),
        ranges: rows.filter((_, i) => rowState[i] === "ok").map((r) => ({ start: Number(r.start), end: Number(r.end) })),
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-5 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Add Quality / Colour Range</h3>
        {/* Not a <form>: this modal renders inside the Inward/Outward <form>,
            and a nested <form> would let its submit event bubble into the
            outer form's handler instead of firing a save here. */}
        <div className="space-y-4">
          <div>
            <label className="lbl">Quality Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. PURE MUL CHANDERI 56"'
              className={boxCls}
            />
          </div>

          <div>
            <label className="lbl">
              Colour ranges <span>(optional)</span>
            </label>
            <div className="space-y-2">
              {rows.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    aria-label="Range start"
                    placeholder="Start"
                    value={r.start}
                    onChange={(e) => update(i, "start", e.target.value)}
                    className={`${boxCls} min-w-0 flex-1 ${rowState[i] === "bad" ? "!border-red-400" : ""}`}
                  />
                  <span className="text-gray-400">–</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    aria-label="Range end"
                    placeholder="End"
                    value={r.end}
                    onChange={(e) => update(i, "end", e.target.value)}
                    className={`${boxCls} min-w-0 flex-1 ${rowState[i] === "bad" ? "!border-red-400" : ""}`}
                  />
                  {rows.length > 1 && (
                    <button
                      type="button"
                      aria-label="Remove range"
                      onClick={() => setRows((prev) => prev.filter((_, k) => k !== i))}
                      className="w-9 h-9 shrink-0 rounded-full text-gray-400 text-xl leading-none active:bg-gray-100"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setRows((prev) => [...prev, blankRange()])}
              className="mt-2 text-sm font-semibold text-brand"
            >
              + Add another range
            </button>
          </div>

          <p className="text-xs text-gray-400 -mt-1">
            A quality can have several colour ranges. If the name already exists, the new ranges are added to it.
            Only colour numbers inside a range are accepted. A quality with no range allows APC entries only.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-300 py-3 font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isValid || saving}
              className="flex-1 btn-primary py-3 font-semibold text-white"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
