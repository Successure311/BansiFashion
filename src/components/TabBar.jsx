const TABS = ["Inward", "Outward", "Analysis"];

export default function TabBar({ active, onChange }) {
  return (
    <div className="sticky top-[60px] z-30 bg-[#f7f3f4] px-4 pt-3 pb-2">
      <div className="grid grid-cols-3 gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`py-2.5 rounded-lg text-sm font-bold transition-colors ${
              active === tab
                ? "bg-brand text-white shadow"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
