"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, LockKeyhole, Plus, UserRound, X } from "lucide-react";

import { api } from "@/lib/api";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { endOfDayIso, formatDateInput, formatDateLabel, formatTimeLabel, startOfDayIso } from "@/lib/utils";
import { usePlanAccess } from "@/components/billing/plan-access-provider";

type ScheduleView = "day" | "week" | "month";

type BookingFormState = {
  customerId: string;
  providerId: string;
  offeringId: string;
  startsAt: string;
  durationMinutes: string;
  notes: string;
};

const scheduleViews = [
  { label: "Dia", value: "day" },
  { label: "Semana", value: "week" },
  { label: "Mês", value: "month" }
] as const;

const scheduleSummaryStatuses = [
  { label: "Confirmados", value: "confirmed" },
  { label: "Agendados", value: "scheduled" },
  { label: "Faltas", value: "missed" }
] as const;

function addDays(value: Date, amount: number): Date {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
}

function getScheduleRange(dateInput: string, view: ScheduleView): { from: string; label: string; to: string } {
  const date = new Date(`${dateInput}T12:00:00`);

  if (view === "week") {
    const start = addDays(date, -date.getDay());
    const end = addDays(start, 6);

    return {
      from: startOfDayIso(start),
      to: endOfDayIso(end),
      label: `${formatDateLabel(start.toISOString())} a ${formatDateLabel(end.toISOString())}`
    };
  }

  if (view === "month") {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    return {
      from: startOfDayIso(start),
      to: endOfDayIso(end),
      label: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date)
    };
  }

  return {
    from: startOfDayIso(date),
    to: endOfDayIso(date),
    label: formatDateLabel(date.toISOString())
  };
}

function getViewTitle(view: ScheduleView): string {
  const titles = {
    day: "Consultas do dia",
    month: "Consultas do mês",
    week: "Consultas da semana"
  };

  return titles[view];
}

function toLocalDateTimeInput(date: Date): string {
  const offsetDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60 * 1000));
  return offsetDate.toISOString().slice(0, 16);
}

function buildBookingEnd(startsAt: string, durationMinutes: string): string {
  const startDate = new Date(startsAt);
  startDate.setMinutes(startDate.getMinutes() + Number(durationMinutes || 0));
  return startDate.toISOString();
}

function moveScheduleDate(dateInput: string, view: ScheduleView, direction: -1 | 1): string {
  const date = new Date(`${dateInput}T12:00:00`);
  if (view === "month") {
    date.setMonth(date.getMonth() + direction);
    return formatDateInput(date);
  }

  return formatDateInput(addDays(date, direction * (view === "week" ? 7 : 1)));
}

export default function SchedulePage() {
  const { currentPlan, requestUpgrade } = usePlanAccess();
  const [selectedDate, setSelectedDate] = useState(formatDateInput(new Date()));
  const [view, setView] = useState<ScheduleView>("day");
  const [page, setPage] = useState(1);
  const [bookingForm, setBookingForm] = useState<BookingFormState | null>(null);
  const limit = 10;
  const queryClient = useQueryClient();
  const range = getScheduleRange(selectedDate, view);

  const { data } = useQuery({
    queryKey: ["schedule", selectedDate, view, page, limit],
    queryFn: async () => {
      const bookings = await api.getBookings({
        from: range.from,
        limit,
        page,
        to: range.to
      });

      const summary = page === 1 && bookings.total <= bookings.limit
        ? bookings
        : await api.getBookings({ from: range.from, limit: 100, page: 1, to: range.to });

      return { bookings, summary };
    }
  });

  const monthlyUsageQuery = useQuery({
    enabled: currentPlan === "free",
    queryKey: ["booking-monthly-plan-usage", formatDateInput(new Date()).slice(0, 7)],
    queryFn: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return api.getBookings({ from: startOfDayIso(start), to: endOfDayIso(end), limit: 1, page: 1 });
    }
  });

  const formOptionsQuery = useQuery({
    enabled: Boolean(bookingForm),
    queryKey: ["schedule-form-options"],
    queryFn: async () => {
      const [customers, providers, services] = await Promise.all([
        api.getCustomers({ limit: 100, page: 1 }),
        api.getProviders({ limit: 100, page: 1 }),
        api.getServiceOfferings({ limit: 100, page: 1 })
      ]);

      return {
        customers: customers.items.filter((customer) => customer.isActive),
        providers: providers.items.filter((provider) => provider.isActive),
        services: services.items.filter((service) => service.isActive)
      };
    }
  });

  const mutation = useMutation({
    mutationFn: async ({
      bookingId,
      action
    }: {
      bookingId: string;
      action: "attended" | "missed" | "cancelled";
    }) => {
      if (action === "attended") {
        return api.markBookingAttended(bookingId);
      }

      if (action === "missed") {
        return api.markBookingMissed(bookingId);
      }

      return api.cancelBooking(bookingId);
    },
    meta: {
      errorMessage: "Agenda não atualizada",
      successMessage: "Agenda atualizada com sucesso"
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["schedule", selectedDate] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["customers-table"] });
      await queryClient.invalidateQueries({ queryKey: ["reports"] });
    }
  });

  const createBookingMutation = useMutation({
    mutationFn: (input: BookingFormState) => api.createBooking({
      customerId: input.customerId,
      providerId: input.providerId,
      offeringId: input.offeringId || null,
      startsAt: new Date(input.startsAt).toISOString(),
      endsAt: buildBookingEnd(input.startsAt, input.durationMinutes),
      notes: input.notes || null
    }),
    meta: {
      errorMessage: "Agendamento não criado",
      successMessage: "Agendamento criado com sucesso"
    },
    onSuccess: async () => {
      setBookingForm(null);
      await queryClient.invalidateQueries({ queryKey: ["schedule"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["customers-table"] });
    }
  });

  const bookings = data?.bookings.items ?? [];
  const summaryBookings = data?.summary.items ?? [];
  const groupedBookings = Array.from(new Set(summaryBookings.map((booking) => booking.startsAt.slice(0, 10))));
  const formCustomers = formOptionsQuery.data?.customers ?? [];
  const formProviders = formOptionsQuery.data?.providers ?? [];
  const formServices = formOptionsQuery.data?.services ?? [];
  const availableServices = formServices.filter((service) => service.providerId === bookingForm?.providerId);
  const isBookingCreationBlocked = currentPlan === "free" && (monthlyUsageQuery.data?.total ?? 0) >= 30;
  const openBookingForm = () => {
    if (isBookingCreationBlocked) {
      requestUpgrade({ feature: "Mais de 30 agendamentos por mês", requiredPlan: "pro" });
      return;
    }
    setBookingForm({
    customerId: "",
    providerId: "",
    offeringId: "",
    startsAt: toLocalDateTimeInput(new Date(`${selectedDate}T09:00:00`)),
    durationMinutes: "60",
      notes: ""
    });
  };
  const changeDate = (direction: -1 | 1) => {
    setSelectedDate((current) => moveScheduleDate(current, view, direction));
    setPage(1);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3 md:items-end">
        <div>
          <p className="hidden text-sm uppercase tracking-[0.18em] text-sky-300 md:block">Agenda</p>
          <h1 className="text-2xl font-semibold text-white md:mt-2 md:text-3xl">Agendamentos</h1>
          <p className="mt-1 text-sm capitalize text-slate-400 md:hidden">{range.label}</p>
        </div>
        <Button className="shrink-0 px-4" onClick={openBookingForm} variant={isBookingCreationBlocked ? "secondary" : "primary"}>
            {isBookingCreationBlocked ? <LockKeyhole className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            <span className="md:hidden">Novo</span>
            <span className="hidden md:inline">Novo agendamento</span>
        </Button>
      </div>

      <div className="sticky top-[73px] z-10 -mx-4 border-y border-white/10 bg-background/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:flex md:items-end md:justify-end md:border-0 md:bg-transparent md:p-0">
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-end">
          <div>
            <p className="mb-2 hidden text-sm text-slate-400 md:block">Visão</p>
            <div className="grid grid-cols-3 rounded-xl border border-white/10 bg-white/5 p-1 md:flex">
              {scheduleViews.map((item) => (
                <button
                  className={`min-h-10 rounded-lg px-4 py-2 text-sm transition ${
                    view === item.value ? "bg-primary text-white" : "text-slate-300 hover:bg-white/8"
                  }`}
                  key={item.value}
                  onClick={() => {
                    setView(item.value);
                    setPage(1);
                  }}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button aria-label="Período anterior" className="shrink-0 px-3" onClick={() => changeDate(-1)} variant="secondary">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Input
              aria-label="Data de referência"
              className="min-w-0 flex-1 md:w-44"
              onChange={(event) => { setSelectedDate(event.target.value); setPage(1); }}
              type="date"
              value={selectedDate}
            />
            <Button aria-label="Próximo período" className="shrink-0 px-3" onClick={() => changeDate(1)} variant="secondary">
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button className="hidden md:inline-flex" onClick={() => { setSelectedDate(formatDateInput(new Date())); setPage(1); }} variant="ghost">
              Hoje
            </Button>
          </div>
        </div>
      </div>

      <div className="hidden gap-4 md:grid md:grid-cols-3">
        {scheduleSummaryStatuses.map((status) => (
          <Card key={status.value}>
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">{status.label}</p>
            <p className="mt-4 text-4xl font-semibold text-white">
              {summaryBookings.filter((booking) => booking.status === status.value).length}
            </p>
          </Card>
        ))}
      </div>

      <Card className="hidden md:block">
        <p className="text-sm uppercase tracking-[0.18em] text-slate-400">{getViewTitle(view)}</p>
        <p className="mt-2 text-sm capitalize text-slate-300">{range.label}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {groupedBookings.map((day) => (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4" key={day}>
              <p className="text-sm font-medium text-white">{formatDateLabel(day)}</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {summaryBookings.filter((booking) => booking.startsAt.slice(0, 10) === day).length}
              </p>
              <p className="mt-1 text-sm text-slate-400">consultas no período</p>
            </div>
          ))}
          {groupedBookings.length === 0 ? <p className="text-sm text-slate-400">Nenhuma consulta neste período.</p> : null}
        </div>
      </Card>

      <div className="space-y-3 md:space-y-4">
        {mutation.error ? <p className="text-sm text-rose-300">{mutation.error.message}</p> : null}
        {!data ? (
          <Card className="text-sm text-slate-400">Carregando agenda...</Card>
        ) : bookings.length === 0 ? (
          <Card className="flex flex-col items-center px-5 py-10 text-center">
            <CalendarDays className="h-8 w-8 text-slate-500" />
            <p className="mt-4 font-medium text-white">Nenhum agendamento neste período</p>
            <p className="mt-1 text-sm text-slate-400">Você pode avançar a data ou criar um novo horário.</p>
            <Button className="mt-5" onClick={openBookingForm}><Plus className="mr-2 h-4 w-4" />Novo agendamento</Button>
          </Card>
        ) : null}
        {bookings.map((booking) => (
          <Card className="bg-panelAlt/80 p-4 md:p-6" key={booking.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-3 md:items-center md:gap-4">
                <div className="w-20 shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center md:w-auto md:px-4">
                  <p className="hidden text-xs uppercase tracking-[0.18em] text-slate-400 md:block">
                    {formatDateLabel(booking.startsAt)}
                  </p>
                  <p className="text-xl font-semibold text-white md:mt-1 md:text-lg">{formatTimeLabel(booking.startsAt)}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-base font-semibold text-white md:text-lg md:font-medium">{booking.customerName}</p>
                    <div className="shrink-0 lg:hidden"><StatusBadge status={booking.status} /></div>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-slate-400"><UserRound className="h-3.5 w-3.5 shrink-0" />{booking.providerName}</p>
                  {booking.serviceName ? <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-slate-400"><Clock3 className="h-3.5 w-3.5 shrink-0" />{booking.serviceName}</p> : null}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-3 lg:flex lg:flex-wrap lg:items-center lg:border-0 lg:pt-0">
                <div className="hidden lg:block"><StatusBadge status={booking.status} /></div>
                <Button
                  className="px-2"
                  onClick={() => mutation.mutate({ bookingId: booking.id, action: "attended" })}
                  size="sm"
                  variant="secondary"
                >
                  <Check className="mr-1.5 h-4 w-4 md:hidden" />
                  <span className="md:hidden">Atendido</span><span className="hidden md:inline">Compareceu</span>
                </Button>
                <Button
                  className="px-2"
                  onClick={() => mutation.mutate({ bookingId: booking.id, action: "missed" })}
                  size="sm"
                  variant="secondary"
                >
                  <X className="mr-1.5 h-4 w-4 md:hidden" />
                  Faltou
                </Button>
                <Button
                  className="px-2 text-rose-300 hover:text-rose-200"
                  onClick={() => mutation.mutate({ bookingId: booking.id, action: "cancelled" })}
                  size="sm"
                  variant="ghost"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
        <p>
          Página {data?.bookings.page ?? page} de {data?.bookings.totalPages ?? 1} - {data?.bookings.total ?? 0} consultas
        </p>
        <div className="flex gap-2">
          <Button disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} variant="secondary">
            Anterior
          </Button>
          <Button
            disabled={!data || page >= data.bookings.totalPages}
            onClick={() => setPage((current) => current + 1)}
            variant="secondary"
          >
            Próxima
          </Button>
        </div>
      </div>

      <Modal className="sm:max-w-xl" onClose={() => setBookingForm(null)} open={Boolean(bookingForm)} title="Novo agendamento">
        {bookingForm ? (
          <div className="space-y-4">
            <label className="block text-sm text-slate-300">
              Cliente
              <select
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-sky-300"
                onChange={(event) => setBookingForm({ ...bookingForm, customerId: event.target.value })}
                value={bookingForm.customerId}
              >
                <option className="bg-slate-950" value="">Selecione</option>
                {formCustomers.map((customer) => (
                  <option className="bg-slate-950" key={customer.id} value={customer.id}>{customer.fullName}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Profissional
              <select
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-sky-300"
                onChange={(event) => setBookingForm({ ...bookingForm, providerId: event.target.value, offeringId: "" })}
                value={bookingForm.providerId}
              >
                <option className="bg-slate-950" value="">Selecione</option>
                {formProviders.map((provider) => (
                  <option className="bg-slate-950" key={provider.id} value={provider.id}>{provider.fullName}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Serviço
              <select
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-sky-300"
                onChange={(event) => {
                  const service = availableServices.find((item) => item.id === event.target.value);
                  setBookingForm({
                    ...bookingForm,
                    offeringId: event.target.value,
                    durationMinutes: service ? service.durationMinutes.toString() : bookingForm.durationMinutes
                  });
                }}
                value={bookingForm.offeringId}
              >
                <option className="bg-slate-950" value="">Sem serviço específico</option>
                {availableServices.map((service) => (
                  <option className="bg-slate-950" key={service.id} value={service.id}>{service.name} - {service.durationMinutes} min</option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-slate-300">Data e horário<Input className="mt-2" onChange={(event) => setBookingForm({ ...bookingForm, startsAt: event.target.value })} type="datetime-local" value={bookingForm.startsAt} /></label>
              <label className="block text-sm text-slate-300">Duração em minutos<Input className="mt-2" min={5} onChange={(event) => setBookingForm({ ...bookingForm, durationMinutes: event.target.value })} type="number" value={bookingForm.durationMinutes} /></label>
            </div>
            <label className="block text-sm text-slate-300">Observações (opcional)<Input className="mt-2" onChange={(event) => setBookingForm({ ...bookingForm, notes: event.target.value })} placeholder="Ex.: cliente pediu encaixe" value={bookingForm.notes} /></label>
            <div className="grid grid-cols-2 gap-3 pt-2 sm:flex sm:justify-end">
              <Button onClick={() => setBookingForm(null)} type="button" variant="ghost">Cancelar</Button>
              <Button
                disabled={!bookingForm.customerId || !bookingForm.providerId || !bookingForm.startsAt || !bookingForm.durationMinutes || createBookingMutation.isPending}
                onClick={() => createBookingMutation.mutate(bookingForm)}
                type="button"
              >
                Criar agendamento
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
