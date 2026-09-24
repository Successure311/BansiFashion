import { useMemo, useState } from "react";

// Numeric-keyboard search box with tap-to-pick suggestions from the colours
// that already exist for the chosen quality.
export default function ColourSearch({ options, value, onChange }) {
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);

  // "" stands for "All colours"; it is listed whenever the full list is shown.
  const items = useMemo(() => {
    const q = text.trim();
    // A colour is already picked: show the whole list so another can be chosen.
    if (!q || q === value) return ["", ...options];
    return options.filter((c) => c.includes(q));
  }, [options, text, value]);

  function commit(next) {
    setText(next);
    onChange(next);
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      const n = items.length;
      if (n) setHi((h) => (e.key === "ArrowDown" ? (h + 1) % n : (h - 1 + n) % n));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const q = text.trim();
      // Exact number typed wins; otherwise the highlighted (default: first) match.
      const choice = options.includes(q) ? q : items[Math.min(hi, items.length - 1)];
      if (choice !== undefined) {
        pick(choice);
        e.target.blur();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function pick(c) {
    commit(c);
    setOpen(false);
  }

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        value={text}
        onFocus={(e) => {
          setOpen(true);
          e.target.select();
        }}
        onClick={() => setOpen(true)}
        onKeyDown={onKeyDown}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => {
          const v = e.target.value;
          setText(v);
          setHi(0);
          setOpen(true);
          onChange(options.includes(v.trim()) ? v.trim() : "");
        }}
        placeholder="All colours — type to search"
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-base bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
      />
      {text && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            commit("");
            setOpen(false);
          }}
          aria-label="Clear colour"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 text-gray-400 text-lg leading-none"
        >
          ×
        </button>
      )}
      {open && (
        <ul className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {items.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-gray-400">No matching colour</li>
          ) : (
            items.map((c, i) => (
              <li
                key={c || "all"}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(c)}
                className={`px-3 py-2.5 text-base cursor-pointer active:bg-gray-100 ${
                  i === hi ? "bg-gray-100 " : ""
                }${
                  c === value ? "font-bold text-brand" : "text-gray-800"
                }`}
              >
                {c || "All colours"}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
