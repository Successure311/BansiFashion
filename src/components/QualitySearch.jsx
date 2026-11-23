import { useEffect, useMemo, useRef, useState } from "react";

// Searchable quality picker for Analysis: type to filter, Up/Down to move, Enter to pick.
// If only one quality matches what is typed, Enter picks it straight away.
// "" (value) means "All qualities".
export default function QualitySearch({ qualities, value, onChange, allLabel = "All qualities" }) {
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
  // "All qualities" first (only while nothing is typed), then the matching qualities.
  const items = useMemo(
    () => [...(query ? [] : [{ all: true }]), ...matches.map((q) => ({ name: q.name }))],
    [matches, query]
  );

  useEffect(() => {
    if (open && hi >= 0) listRef.current?.children[hi]?.scrollIntoView({ block: "nearest" });
  }, [hi, open]);

  function pick(item) {
    setOpen(false);
    setText(null);
    inputRef.current?.blur();
    onChange(item.all ? "" : item.name);
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      const n = items.length;
      if (n) setHi((h) => (e.key === "ArrowDown" ? (h + 1) % n : (h - 1 + n) % n));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (query && matches.length === 1) pick(items[0]);
      else if (hi >= 0 && items[hi]) pick(items[hi]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={text ?? value}
        placeholder={allLabel}
        onFocus={(e) => {
          setOpen(true);
          setHi(-1);
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
          {items.length === 0 && <li className="px-3.5 py-2.5 text-sm text-gray-400">No matching quality</li>}
          {items.map((it, i) => (
            <li
              key={it.all ? "__all__" : it.name}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(it)}
              className={`px-3.5 py-2.5 text-base cursor-pointer active:bg-brand-light ${
                i === hi ? "bg-brand-light" : ""
              } ${(it.all ? value === "" : it.name === value) ? "text-brand" : "text-gray-800"}`}
            >
              {it.all ? allLabel : it.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
