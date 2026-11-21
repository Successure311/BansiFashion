import { useState } from "react";

const ITEMS = [
  { id: "Inward", icon: "↓", hint: "Add fabric received" },
  { id: "Outward", icon: "↑", hint: "Add fabric sent out" },
  { id: "Analysis", icon: "▤", hint: "Totals, data and Excel export" },
];

// Hamburger button (three lines) that opens a dropdown of the app sections.
export default function NavMenu({ active, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        aria-expanded={open}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex flex-col items-center justify-center gap-[5px] active:bg-white/20"
      >
        <span className={`h-[2.5px] w-5 rounded bg-white transition-transform ${open ? "translate-y-[7.5px] rotate-45" : ""}`} />
        <span className={`h-[2.5px] w-5 rounded bg-white transition-opacity ${open ? "opacity-0" : ""}`} />
        <span className={`h-[2.5px] w-5 rounded bg-white transition-transform ${open ? "-translate-y-[7.5px] -rotate-45" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setOpen(false)} />
          <nav className="absolute left-3 top-[68px] z-50 w-64 surface-card rounded-2xl p-2 text-gray-800">
            {ITEMS.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => {
                  onChange(it.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                  active === it.id ? "tab-active text-white" : "hover:bg-brand-light"
                }`}
              >
                <span className={`text-xl w-6 text-center ${active === it.id ? "text-gold" : "text-brand"}`}>{it.icon}</span>
                <span>
                  <span className="block font-display font-bold text-base leading-tight">{it.id}</span>
                  <span className={`block text-xs ${active === it.id ? "text-white/80" : "text-gray-500"}`}>{it.hint}</span>
                </span>
              </button>
            ))}
          </nav>
        </>
      )}
    </>
  );
}
