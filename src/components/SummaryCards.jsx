function fmt(n) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function SummaryCards({ totalInward, totalOutward, label }) {
  const diff = Math.abs(totalInward - totalOutward);
  return (
    <div className="space-y-3">
      {label && <p className="text-sm font-semibold text-gray-500">{label}</p>}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-center">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Inward</p>
          <p className="text-2xl font-bold text-emerald-800 mt-1">{fmt(totalInward)}</p>
          <p className="text-[11px] text-emerald-600">meters</p>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-center">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Outward</p>
          <p className="text-2xl font-bold text-amber-800 mt-1">{fmt(totalOutward)}</p>
          <p className="text-[11px] text-amber-600">meters</p>
        </div>
        <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 text-center">
          <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Difference</p>
          <p className="text-2xl font-bold text-rose-800 mt-1">{fmt(diff)}</p>
          <p className="text-[11px] text-rose-600">meters</p>
        </div>
      </div>
    </div>
  );
}
