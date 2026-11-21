import { useEffect, useMemo, useRef, useState } from "react";
import AddQualityModal from "./AddQualityModal";

// Searchable quality picker: type to filter, Up/Down to move, Enter to pick.
// If only one quality matches what is typed, Enter picks it straight away.
export default function QualitySelect({ qualities, value, onChange, onAddQuality, onUpdateQuality, showToast, onPicked }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const selected = qualities.find((q) => q.name === value) || null;
  const [newName, setNewName] = useState("");
  const [text, setText] = useState(null); // null = show the selected quality
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const query = (text ?? "").trim().toLowerCase();
  const matches = useMemo(() => {
    const words = query.split(/\s+/).filter(Boolean);
    return words.length
      ? qualities.filter((q) => words.every((w) => q.name.toLowerCase().includes(w)))
      : qualities;
  }, [qualities, query]);
  // The list: matching qualities, then the "add new" entry.
  const items = useMemo(() => [...matches.map((q) => ({ name: q.name })), { other: true }], [matches]);

  useEffect(() => {
    if (open && hi >= 0) listRef.current?.children[hi]?.scrollIntoView({ block: "nearest" });
  }, [hi, open]);

  // Back to the quality box (list stays closed) after a pop-up window closes.
  function refocus() {
    setTimeout(() => {
      if (!inputRef.current) return;
      inputRef.current.dataset.quiet = "1";
      inputRef.current.focus();
    }, 0);
  }

  function pick(item) {
    setOpen(false);
    setText(null);
    inputRef.current?.blur();
    if (item.other) {
      setNewName(""); // always open an empty box, not the text typed to search
      setModalOpen(true);
      return;
    }
    onChange(item.name);
    onPicked?.();
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      const n = items.length;
      setHi((h) => (e.key === "ArrowDown" ? (h + 1) % n : (h - 1 + n) % n));
    } else if (e.key === "Enter") {
      e.preventDefault(); // handled here; the form must not also react
      if (query && matches.length === 1) pick(items[0]);
      else if (hi >= 0 && items[hi]) pick(items[hi]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  async function handleAdd({ name, ranges }) {
    const savedName = await onAddQuality({ name, ranges });
    onChange(savedName);
    setModalOpen(false);
    showToast?.(`Saved quality "${savedName}"`, "success");
    onPicked?.();
  }

  async function handleEdit({ name, ranges }) {
    const saved = await onUpdateQuality({ oldName: selected.name, name, ranges });
    if (saved !== selected.name) onChange(saved); // keep the renamed quality selected
    setEditOpen(false);
    refocus();
    showToast?.(`Updated "${saved}"`, "success");
  }

  return (
    <div>
      <label className="lbl">Quality Name</label>
      <div className="flex items-stretch gap-2">
      <div className="relative min-w-0 flex-1">
        <input
          ref={inputRef}
          type="text"
          data-field="quality"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={text ?? value}
          placeholder="Select quality…"
          onFocus={(e) => {
            setHi(-1);
            if (e.target.dataset.quiet) {
              // Focus put here by the form after a save: ready to type, list stays closed.
              delete e.target.dataset.quiet;
              return;
            }
            setOpen(true);
            e.target.select();
          }}
          onClick={() => setOpen(true)}
          onBlur={() =>
            setTimeout(() => {
              setOpen(false);
              setText(null);
            }, 150)
          }
          onChange={(e) => {
            setText(e.target.value);
            setHi(e.target.value.trim() ? 0 : -1);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className="w-full field rounded-xl border border-gray-200 px-3.5 py-3 pr-10 text-base bg-white focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
        />
        <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-brand text-xs">
          ▼
        </span>
        {open && (
          <ul
            ref={listRef}
            className="absolute z-30 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg"
          >
            {items.map((it, i) => (
              <li
                key={it.other ? "__other__" : it.name}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(it)}
                className={`px-3.5 py-2.5 text-base cursor-pointer active:bg-brand-light ${
                  i === hi ? "bg-brand-light" : ""
                } ${it.other ? "text-brand border-t border-gray-100" : it.name === value ? "text-brand" : "text-gray-800"}`}
              >
                {it.other ? "Other… (add new quality / colour range)" : it.name}
              </li>
            ))}
          </ul>
        )}
      </div>
        {selected && (
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            aria-label="Edit colour ranges"
            title="Edit colour ranges"
            className="field w-12 shrink-0 rounded-xl border border-gray-200 bg-white text-brand text-xl active:bg-brand-light"
          >
            ✎
          </button>
        )}
      </div>

      {editOpen && selected && (
        <AddQualityModal
          editing
          initialName={selected.name}
          initialRanges={selected.ranges}
          onClose={() => {
            setEditOpen(false);
            refocus();
          }}
          onAdd={handleEdit}
        />
      )}

      {modalOpen && (
        <AddQualityModal initialName={newName} onClose={() => setModalOpen(false)} onAdd={handleAdd} />
      )}
    </div>
  );
}
