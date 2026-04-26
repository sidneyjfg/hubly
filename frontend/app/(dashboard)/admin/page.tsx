"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Crown,
  ShieldCheck,
  Stethoscope,
  UserCog,
  UsersRound
} from "lucide-react";

import { RoleGuard } from "@/components/app/auth-guard";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { BookingStatus } from "@/lib/types";
import { addDays, endOfDayIso, formatDateInput, formatTimeLabel, getRoleAccessDescription, getRoleLabel, startOfDayIso } from "@/lib/utils";

type AdminMetric = {
  label: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
};

const statusLabels: Record<BookingStatus, string> = {
  scheduled: "Agendadas",
  confirmed: "Confirmadas",
  pending: "Pendentes",
  cancelled: "Canceladas",
  rescheduled: "Reagendadas",
  attended: "Compareceu",
  missed: "Faltou"
};

function AdminPageContent() {
  const today = useMemo(() => new Date(), []);
  const todayIso = today.toISOString();
  const periodStart = formatDateInput(addDays(today, -30));
  const periodEnd = formatDateInput(today);

  const meQuery = useQuery({
    queryKey: ["admin-me"],
    queryFn: api.getMe
  });

  const providersQuery = useQuery({
    queryKey: ["admin-providers"],
    queryFn: () => api.getProviders({ limit: 100 })
  });

  const customersQuery = useQuery({
    queryKey: ["admin-customers"],
    queryFn: () => api.getCustomers({ limit: 100 })
  });

  const dailyScheduleQuery = useQuery({
    queryKey: ["admin-daily-schedule", todayIso.slice(0, 10)],
    queryFn: () => api.getDailySchedule(todayIso, { limit: 100 })
  });

  const recentBookingsQuery = useQuery({
    queryKey: ["admin-recent-bookings"],
    queryFn: () =>
      api.getBookings({
        from: startOfDayIso(addDays(today, -7)),
        to: endOfDayIso(addDays(today, 7)),
        limit: 100
      })
  });

  const noShowQuery = useQuery({
    queryKey: ["admin-no-show", periodStart, periodEnd],
    queryFn: () => api.getNoShowOverview({ from: periodStart, to: periodEnd })
  });

  const integrationsQuery = useQuery({
    queryKey: ["admin-integrations"],
    queryFn: api.listIntegrations
  });

  const organization = meQuery.data?.organization;
  const providers = providersQuery.data?.items ?? [];
  const customers = customersQuery.data?.items ?? [];
  const dailyBookings = dailyScheduleQuery.data?.items ?? [];
  const recentBookings = recentBookingsQuery.data?.items ?? [];
  const activeProviders = providers.filter((provider) => provider.isActive).length;
  const activeCustomers = customers.filter((customer) => customer.isActive).length;
  const confirmedToday = dailyBookings.filter((booking) => booking.status === "confirmed").length;
  const noShowRate = noShowQuery.data?.noShowRate ?? 0;
  const integrations = integrationsQuery.data?.items ?? [];
  const activeIntegrations = integrations.filter((integration) => integration.enabled).length;

  const statusCounts = recentBookings.reduce<Record<BookingStatus, number>>(
    (accumulator, booking) => ({
      ...accumulator,
      [booking.status]: accumulator[booking.status] + 1
    }),
    {
      scheduled: 0,
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      rescheduled: 0,
      attended: 0,
      missed: 0
    }
  );

  const metrics: AdminMetric[] = [
    {
      label: "Agenda de hoje",
      value: String(dailyBookings.length),
      detail: `${confirmedToday} confirmadas`,
      icon: CalendarDays
    },
    {
      label: "Profissionais",
      value: String(providers.length),
      detail: `${activeProviders} ativos`,
      icon: Stethoscope
    },
    {
      label: "Pacientes",
      value: String(customers.length),
      detail: `${activeCustomers} ativos`,
      icon: UsersRound
    },
    {
      label: "No-show 30 dias",
      value: `${noShowRate}%`,
      detail: `${noShowQuery.data?.missedBookings ?? 0} faltas registradas`,
      icon: AlertTriangle
    }
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-xl border border-white/10 bg-panel/90 p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-400/15 text-sky-200">
                  <Crown className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-300">Painel administrativo</p>
                  <h1 className="mt-2 text-3xl font-semibold text-white">Admin da clínica</h1>
                </div>
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
                {organization?.tradeName ?? "Clínica"} com visão central de operação, equipe, agenda, notificações e indicadores. Esta área aparece somente para usuários com perfil administrador.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/providers" size="sm" variant="secondary">
                Profissionais
              </ButtonLink>
              <ButtonLink href="/settings" size="sm">
                Configurações
              </ButtonLink>
            </div>
          </div>
        </div>

        <Card>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
            <h2 className="text-lg font-semibold text-white">Acesso separado</h2>
          </div>
          <div className="mt-5 space-y-4">
            {(["administrator", "reception", "provider"] as const).map((role) => (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4" key={role}>
                <p className="text-sm font-semibold text-white">{getRoleLabel(role)}</p>
                <p className="mt-1 text-sm leading-5 text-slate-300">{getRoleAccessDescription(role)}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <Card key={metric.label}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">{metric.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{metric.value}</p>
                  <p className="mt-2 text-sm text-slate-300">{metric.detail}</p>
                </div>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/8 text-sky-200">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-300">Hoje</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Próximos atendimentos</h2>
            </div>
            <ButtonLink href="/bookings" size="sm" variant="secondary">
              Abrir agenda
            </ButtonLink>
          </div>
          <div className="mt-5 space-y-3">
            {dailyBookings.slice(0, 5).map((booking) => (
              <div className="grid gap-3 rounded-lg border border-white/10 bg-white/5 p-4 md:grid-cols-[80px_1fr_auto]" key={booking.id}>
                <p className="text-sm font-semibold text-white">{formatTimeLabel(booking.startsAt)}</p>
                <div>
                  <p className="text-sm font-medium text-white">{booking.customerName}</p>
                  <p className="mt-1 text-sm text-slate-400">{booking.providerName}</p>
                </div>
                <p className="text-sm text-slate-300">{statusLabels[booking.status]}</p>
              </div>
            ))}
            {dailyBookings.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                Nenhum atendimento agendado para hoje.
              </div>
            ) : null}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-sky-300" />
            <h2 className="text-xl font-semibold text-white">Status da operação</h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {(Object.keys(statusCounts) as BookingStatus[]).map((status) => (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4" key={status}>
                <p className="text-sm text-slate-400">{statusLabels[status]}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{statusCounts[status]}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <UserCog className="h-5 w-5 text-sky-300" />
            <h2 className="text-xl font-semibold text-white">Controle admin</h2>
          </div>
          <div className="mt-5 space-y-3">
            <ButtonLink className="w-full justify-start" href="/providers" variant="secondary">
              Gerenciar profissionais
            </ButtonLink>
            <ButtonLink className="w-full justify-start" href="/automations" variant="secondary">
              Notificações e automações
            </ButtonLink>
            <ButtonLink className="w-full justify-start" href="/settings" variant="secondary">
              Dados da clínica
            </ButtonLink>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-sky-300" />
            <h2 className="text-xl font-semibold text-white">Integrações</h2>
          </div>
          <div className="mt-5 space-y-3">
            {integrations.map((integration) => (
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4" key={integration.id}>
                <div>
                  <p className="text-sm font-medium text-white">WhatsApp</p>
                  <p className="mt-1 text-sm text-slate-400">{integration.status ?? "Sem status"}</p>
                </div>
                {integration.enabled ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-300" />
                )}
              </div>
            ))}
            {integrations.length === 0 ? (
              <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                Nenhuma integração configurada.
              </p>
            ) : null}
            <p className="text-sm text-slate-400">{activeIntegrations} integração ativa</p>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
            <h2 className="text-xl font-semibold text-white">Segurança</h2>
          </div>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <p className="rounded-lg border border-white/10 bg-white/5 p-4">RBAC ativo por perfil de usuário.</p>
            <p className="rounded-lg border border-white/10 bg-white/5 p-4">Tenant validado pelas rotas autenticadas.</p>
            <p className="rounded-lg border border-white/10 bg-white/5 p-4">Rotas críticas protegidas por rate limit.</p>
          </div>
        </Card>
      </section>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RoleGuard allowedRoles={["administrator"]} fallbackPath="/bookings">
      <AdminPageContent />
    </RoleGuard>
  );
}
