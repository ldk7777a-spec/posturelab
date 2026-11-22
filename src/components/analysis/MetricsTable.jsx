import React from "react";

const DOT = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-red-500",
  none: "bg-gray-300",
};
const TEXT = {
  green: "text-emerald-600",
  yellow: "text-amber-600",
  red: "text-red-600",
  none: "text-gray-800",
};

const fmt = (v) => (v == null ? "—" : `${v}°`);

// Compact metric table: one row per metric with current / min / max / avg.
// Replaces the previous stacked card grids so everything fits on one screen.
export default function MetricsTable({ title, rows, showSummary = true }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-3">
      <p className="text-sm font-bold text-[#1A1A2E] mb-1.5">{title}</p>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[11px] text-gray-400">
            <th className="text-left font-medium pb-1">지표</th>
            <th className="text-right font-medium pb-1 w-12">현재</th>
            {showSummary && <th className="text-right font-medium pb-1 w-12">최소</th>}
            {showSummary && <th className="text-right font-medium pb-1 w-12">최대</th>}
            {showSummary && <th className="text-right font-medium pb-1 w-12">평균</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-t border-gray-50">
              <td className="py-1 pr-2">
                <div className="flex items-center gap-1.5 min-w-0" title={r.hint || undefined}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${DOT[r.currentRating] || DOT.none}`} />
                  <span className="text-gray-700 truncate">{r.label}</span>
                </div>
              </td>
              <td className={`py-1 text-right tabular-nums font-semibold ${TEXT[r.currentRating] || TEXT.none}`}>
                {fmt(r.current)}
              </td>
              {showSummary && <td className="py-1 text-right tabular-nums text-gray-500">{fmt(r.s?.min)}</td>}
              {showSummary && <td className="py-1 text-right tabular-nums text-gray-500">{fmt(r.s?.max)}</td>}
              {showSummary && (
                <td className={`py-1 text-right tabular-nums font-semibold ${TEXT[r.rating] || TEXT.none}`}>
                  {fmt(r.s?.avg)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}