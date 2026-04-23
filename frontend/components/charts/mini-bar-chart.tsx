import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { RevenuePoint } from "@/lib/types";

export function MiniBarChart({ points }: { points: RevenuePoint[] }) {
  const maxValue = Math.max(1, ...points.map((point) => point.revenue));

  return (
    <Card>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Receita semanal</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{formatCurrency(points[2]?.revenue ?? 0)}</h3>
        </div>
        <p className="text-sm text-slate-400">Últimos 5 dias</p>
      </div>
      <div className="flex h-60 items-end gap-4">
        {points.map((point) => (
          <div className="flex flex-1 flex-col items-center gap-3" key={point.label}>
            <div className="flex h-full w-full items-end">
              <div
                className="w-full rounded-t-[20px] bg-gradient-to-t from-sky-700 via-sky-500 to-cyan-300"
                style={{ height: `${(point.revenue / maxValue) * 100}%` }}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white">{point.label}</p>
              <p className="text-xs text-slate-400">{point.noShowRate}% no-show</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
