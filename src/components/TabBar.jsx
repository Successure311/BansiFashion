const TABS = [
  { id: "Inward", icon: "↓" },
  { id: "Outward", icon: "↑" },
  { id: "Analysis", icon: "▤" },
];

export default function TabBar({ active, onChange }) {
  return (
    <div className="sticky top-16 z-30 bg-surface/90 backdrop-blur px-4 pt-3 pb-2">
      <div className="max-w-md mx-auto grid grid-cols-3 gap-1.5 tab-shell rounded-2xl p-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              active === tab.id
                ? "tab-active text-white"
                : "text-gray-500 hover:text-brand"
            }`}
          >
            <span aria-hidden className={active === tab.id ? "text-gold" : "text-brand/50"}>
              {tab.icon}
            </span>
            {tab.id}
          </button>
        ))}
      </div>
    </div>
  );
}
