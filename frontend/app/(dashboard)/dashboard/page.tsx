"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { MiniBarChart } from "@/components/charts/mini-bar-chart";
import { StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buildDashboardInsights, buildEmptyRevenueSeries, buildRevenueSeries, getPeriodRange } from "@/lib/dashboard-data";
import { addDays, endOfDayIso, startOfDayIso } from "@/lib/utils";
import { formatCurrency, formatTimeLabel } from "@/lib/utils";

export default function DashboardPage() {
  const today = new Date();
  const todayDate = today.toISOString();
  const weekRange = {
    from: startOfDayIso(addDays(today, -4)),
    to: endOfDayIso(today)
  };

  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [dailySchedule, professionals, noShowOverview, recentAppointments] = await Promise.all([
        api.getDailySchedule(todayDate, { limit: 100, page: 1 }),
        api.getProfessionals({ limit: 100, page: 1 }),
        api.getNoShowOverview(getPeriodRange(30)),
        api.getAppointments({ ...weekRange, limit: 100, page: 1 })
      ]);

      const activeCount = dailySchedule.items.filter((item) =>
        ["scheduled", "confirmed", "rescheduled"].includes(item.status)
      ).length;
      const attendedCount = dailySchedule.items.filter((item) => item.status === "attended").length;

      return {
        todaysAppointments: dailySchedule.items,
        summary: {
          todaysAppointments: dailySchedule.items.length,
          noShowRate: noShowOverview.noShowRate,
          estimatedRevenue: (attendedCount * 220) + (activeCount * 160),
          occupancyRate:
            professionals.items.length === 0
              ? 0
              : Math.round((dailySchedule.items.length / (professionals.items.length * 8)) * 100)
        },
        professionalsCount: professionals.items.length,
        insights: buildDashboardInsights(dailySchedule.items, recentAppointments.items, professionals.items),
        revenueSeries: buildRevenueSeries(recentAppointments.items)
      };
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Resumo do dia</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Operação da clínica em tempo real</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-400">Consultas do dia</p>
          <p className="mt-4 text-4xl font-semibold text-white">{data?.summary.todaysAppointments ?? 0}</p>
          <p className="mt-2 text-sm text-slate-400">
            Agenda distribuída entre {data?.professionalsCount ?? 0} profissionais
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-400">Taxa de no-show</p>
          <p className="mt-4 text-4xl font-semibold text-white">{data?.summary.noShowRate ?? 0}%</p>
          <p className="mt-2 text-sm text-emerald-300">-1.7 p.p. em relação à semana passada</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-400">Faturamento estimado</p>
          <p className="mt-4 text-4xl font-semibold text-white">
            {formatCurrency(data?.summary.estimatedRevenue ?? 0)}
          </p>
          <p className="mt-2 text-sm text-slate-400">Estimativa com presença confirmada</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-400">Ocupação</p>
          <p className="mt-4 text-4xl font-semibold text-white">{data?.summary.occupancyRate ?? 0}%</p>
          <p className="mt-2 text-sm text-slate-400">Capacidade saudável para encaixes</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <MiniBarChart points={data?.revenueSeries ?? buildEmptyRevenueSeries()} />
        <Card>
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Indicadores ativos</p>
          <div className="mt-6 space-y-4">
            {(data?.insights ?? []).map((item) => (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4" key={item.label}>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-300">{item.label}</p>
                  <p className="text-2xl font-semibold text-white">{item.value}%</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Consultas de hoje</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Fila operacional</h2>
          </div>
        </div>
        <div className="space-y-4">
          {data?.todaysAppointments.map((appointment) => (
            <div
              className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-5 lg:flex-row lg:items-center lg:justify-between"
              key={appointment.id}
            >
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-white/8 px-4 py-3 text-sm font-semibold text-white">
                  {formatTimeLabel(appointment.startsAt)}
                </div>
                <div>
                  <p className="text-lg font-medium text-white">{appointment.patientName}</p>
                  <p className="text-sm text-slate-400">{appointment.professionalName}</p>
                </div>
              </div>
              <StatusBadge status={appointment.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
