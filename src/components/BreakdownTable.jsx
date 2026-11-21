function fmt(n) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function BreakdownTable({ columnLabel, rows, activeKey, onRowClick, emptyMessage }) {
  if (!rows.length) {
    return <p className="text-sm text-gray-400 text-center py-6">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
            <th className="text-left px-3 py-2.5">{columnLabel}</th>
            <th className="text-right px-3 py-2.5">Inward</th>
            <th className="text-right px-3 py-2.5">Outward</th>
            <th className="text-right px-3 py-2.5">Diff</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.key}
              onClick={onRowClick ? () => onRowClick(r.key) : undefined}
              className={`border-t border-gray-100 ${activeKey === r.key ? "bg-brand-light" : ""} ${
                onRowClick ? "cursor-pointer active:bg-brand-light" : ""
              }`}
            >
              <td className="px-3 py-2.5 font-semibold text-gray-700">{r.key}</td>
              <td className="px-3 py-2.5 text-right text-emerald-700">{fmt(r.inward)}</td>
              <td className="px-3 py-2.5 text-right text-amber-700">{fmt(r.outward)}</td>
              <td className="px-3 py-2.5 text-right font-semibold text-rose-700">
                {fmt(Math.abs(r.inward - r.outward))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
