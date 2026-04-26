"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { buildEmptyRevenueSeries, buildRevenueSeries, getPeriodRange } from "@/lib/dashboard-data";
import { MiniBarChart } from "@/components/charts/mini-bar-chart";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const filters = ["7 dias", "30 dias", "90 dias"] as const;
const filterToDays = {
  "7 dias": 7,
  "30 dias": 30,
  "90 dias": 90
} as const;

export default function ReportsPage() {
  const [activeFilter, setActiveFilter] = useState<keyof typeof filterToDays>("30 dias");
  const { data } = useQuery({
    queryKey: ["reports", activeFilter],
    queryFn: async () => {
      const range = getPeriodRange(filterToDays[activeFilter]);
      const [overview, bookings] = await Promise.all([
        api.getNoShowOverview(range),
        api.getBookings({ ...range, limit: 100, page: 1 })
      ]);

      const attended = bookings.items.filter((booking) => booking.status === "attended").length;
      const futureOrConfirmed = bookings.items.filter((booking) =>
        ["scheduled", "confirmed", "rescheduled"].includes(booking.status)
      ).length;

      return {
        overview,
        bookings: bookings.items,
        revenue: (attended * 220) + (futureOrConfirmed * 160),
        recovered: futureOrConfirmed
      };
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Relatórios</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">No-show e receita por período</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          {filters.map((filter) => (
            <button
              className={`rounded-lg px-4 py-2 text-sm transition ${
                activeFilter === filter ? "bg-primary text-white" : "bg-white/5 text-slate-300 hover:bg-white/8"
              }`}
              key={filter}
              onClick={() => setActiveFilter(filter)}
              type="button"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-400">No-show médio</p>
          <p className="mt-4 text-4xl font-semibold text-white">{data?.overview.noShowRate ?? 0}%</p>
          <p className="mt-2 text-sm text-emerald-300">Em tendência de queda</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-400">Receita prevista</p>
          <p className="mt-4 text-4xl font-semibold text-white">{formatCurrency(data?.revenue ?? 0)}</p>
          <p className="mt-2 text-sm text-slate-400">Período: {activeFilter}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-400">Consultas recuperadas</p>
          <p className="mt-4 text-4xl font-semibold text-white">{data?.recovered ?? 0}</p>
          <p className="mt-2 text-sm text-slate-400">Via automações e reagendamento</p>
        </Card>
      </div>

      <MiniBarChart points={data ? buildRevenueSeries(data.bookings) : buildEmptyRevenueSeries()} />
    </div>
  );
}
