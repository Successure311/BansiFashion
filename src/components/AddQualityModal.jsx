import { useState } from "react";

export default function AddQualityModal({ onClose, onAdd }) {
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Range is optional - a quality with no range allows any colour number.
  // But if one side is given, the other must be too, and end >= start.
  const bothBlank = start === "" && end === "";
  const bothFilled = start !== "" && end !== "" && Number(end) >= Number(start);
  const isValid = name.trim() && (bothBlank || bothFilled);

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    setError(null);
    try {
      await onAdd({
        name: name.trim(),
        start: bothFilled ? Number(start) : null,
        end: bothFilled ? Number(end) : null,
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Add New Quality</h3>
        {/* Not a <form>: this modal renders inside the Inward/Outward <form>,
            and a nested <form> would let its submit event bubble into the
            outer form's handler instead of firing a save here. */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Quality Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. PURE MUL CHANDERI 56"'
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Range Start <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="number"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Range End <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="number"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 -mt-2">
            Leave both blank if this quality has no fixed colour range — you'll be able to enter any colour number for it.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 py-2.5 font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isValid || saving}
              className="flex-1 rounded-lg bg-brand py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
