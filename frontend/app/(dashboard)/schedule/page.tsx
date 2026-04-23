"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { api } from "@/lib/api";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { endOfDayIso, formatDateInput, formatDateLabel, formatTimeLabel, startOfDayIso } from "@/lib/utils";

type ScheduleView = "day" | "week" | "month";

type AppointmentFormState = {
  patientId: string;
  professionalId: string;
  serviceId: string;
  startsAt: string;
  durationMinutes: string;
  notes: string;
};

const scheduleViews = [
  { label: "Dia", value: "day" },
  { label: "Semana", value: "week" },
  { label: "Mês", value: "month" }
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

function buildAppointmentEnd(startsAt: string, durationMinutes: string): string {
  const startDate = new Date(startsAt);
  startDate.setMinutes(startDate.getMinutes() + Number(durationMinutes || 0));
  return startDate.toISOString();
}

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(formatDateInput(new Date()));
  const [view, setView] = useState<ScheduleView>("day");
  const [page, setPage] = useState(1);
  const [appointmentForm, setAppointmentForm] = useState<AppointmentFormState | null>(null);
  const limit = 10;
  const queryClient = useQueryClient();
  const range = getScheduleRange(selectedDate, view);

  const { data } = useQuery({
    queryKey: ["schedule", selectedDate, view, page, limit],
    queryFn: async () => {
      const appointments = await api.getAppointments({
        from: range.from,
        limit,
        page,
        to: range.to
      });

      const summary = page === 1 && appointments.total <= appointments.limit
        ? appointments
        : await api.getAppointments({ from: range.from, limit: 100, page: 1, to: range.to });

      return { appointments, summary };
    }
  });

  const formOptionsQuery = useQuery({
    enabled: Boolean(appointmentForm),
    queryKey: ["schedule-form-options"],
    queryFn: async () => {
      const [patients, professionals, services] = await Promise.all([
        api.getPatients({ limit: 100, page: 1 }),
        api.getProfessionals({ limit: 100, page: 1 }),
        api.getProfessionalServices({ limit: 100, page: 1 })
      ]);

      return {
        patients: patients.items.filter((patient) => patient.isActive),
        professionals: professionals.items.filter((professional) => professional.isActive),
        services: services.items.filter((service) => service.isActive)
      };
    }
  });

  const mutation = useMutation({
    mutationFn: async ({
      appointmentId,
      action
    }: {
      appointmentId: string;
      action: "attended" | "missed" | "cancelled";
    }) => {
      if (action === "attended") {
        return api.markAppointmentAttended(appointmentId);
      }

      if (action === "missed") {
        return api.markAppointmentMissed(appointmentId);
      }

      return api.cancelAppointment(appointmentId);
    },
    meta: {
      errorMessage: "Agenda não atualizada",
      successMessage: "Agenda atualizada com sucesso"
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["schedule", selectedDate] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["patients-table"] });
      await queryClient.invalidateQueries({ queryKey: ["reports"] });
    }
  });

  const createAppointmentMutation = useMutation({
    mutationFn: (input: AppointmentFormState) => api.createAppointment({
      patientId: input.patientId,
      professionalId: input.professionalId,
      serviceId: input.serviceId || null,
      startsAt: new Date(input.startsAt).toISOString(),
      endsAt: buildAppointmentEnd(input.startsAt, input.durationMinutes),
      notes: input.notes || null
    }),
    meta: {
      errorMessage: "Agendamento não criado",
      successMessage: "Agendamento criado com sucesso"
    },
    onSuccess: async () => {
      setAppointmentForm(null);
      await queryClient.invalidateQueries({ queryKey: ["schedule"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["patients-table"] });
    }
  });

  const appointments = data?.appointments.items ?? [];
  const summaryAppointments = data?.summary.items ?? [];
  const groupedAppointments = Array.from(new Set(summaryAppointments.map((appointment) => appointment.startsAt.slice(0, 10))));
  const formPatients = formOptionsQuery.data?.patients ?? [];
  const formProfessionals = formOptionsQuery.data?.professionals ?? [];
  const formServices = formOptionsQuery.data?.services ?? [];
  const availableServices = formServices.filter((service) => service.professionalId === appointmentForm?.professionalId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Agenda</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Visão por dia, semana e mês</h1>
        </div>
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-end">
          <Button
            onClick={() => setAppointmentForm({
              patientId: "",
              professionalId: "",
              serviceId: "",
              startsAt: toLocalDateTimeInput(new Date(`${selectedDate}T09:00:00`)),
              durationMinutes: "60",
              notes: ""
            })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo agendamento
          </Button>
          <div>
            <p className="mb-2 text-sm text-slate-400">Visão</p>
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
              {scheduleViews.map((item) => (
                <button
                  className={`rounded-lg px-4 py-2 text-sm transition ${
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
          <div className="w-full max-w-xs">
            <p className="mb-2 text-sm text-slate-400">Data de referência</p>
            <Input
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setPage(1);
              }}
              type="date"
              value={selectedDate}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {["confirmed", "scheduled", "missed"].map((status) => (
          <Card key={status}>
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">{status}</p>
            <p className="mt-4 text-4xl font-semibold text-white">
              {summaryAppointments.filter((appointment) => appointment.status === status).length}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <p className="text-sm uppercase tracking-[0.18em] text-slate-400">{getViewTitle(view)}</p>
        <p className="mt-2 text-sm capitalize text-slate-300">{range.label}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {groupedAppointments.map((day) => (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4" key={day}>
              <p className="text-sm font-medium text-white">{formatDateLabel(day)}</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {summaryAppointments.filter((appointment) => appointment.startsAt.slice(0, 10) === day).length}
              </p>
              <p className="mt-1 text-sm text-slate-400">consultas no período</p>
            </div>
          ))}
          {groupedAppointments.length === 0 ? <p className="text-sm text-slate-400">Nenhuma consulta neste período.</p> : null}
        </div>
      </Card>

      <div className="space-y-4">
        {mutation.error ? <p className="text-sm text-rose-300">{mutation.error.message}</p> : null}
        {appointments.map((appointment) => (
          <Card className="bg-panelAlt/80" key={appointment.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    {formatDateLabel(appointment.startsAt)}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">{formatTimeLabel(appointment.startsAt)}</p>
                </div>
                <div>
                  <p className="text-lg font-medium text-white">{appointment.patientName}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {appointment.professionalName}{appointment.serviceName ? ` - ${appointment.serviceName}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <StatusBadge status={appointment.status} />
                <Button
                  onClick={() => mutation.mutate({ appointmentId: appointment.id, action: "attended" })}
                  size="sm"
                  variant="secondary"
                >
                  Compareceu
                </Button>
                <Button
                  onClick={() => mutation.mutate({ appointmentId: appointment.id, action: "missed" })}
                  size="sm"
                  variant="secondary"
                >
                  Faltou
                </Button>
                <Button
                  onClick={() => mutation.mutate({ appointmentId: appointment.id, action: "cancelled" })}
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
          Página {data?.appointments.page ?? page} de {data?.appointments.totalPages ?? 1} - {data?.appointments.total ?? 0} consultas
        </p>
        <div className="flex gap-2">
          <Button disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} variant="secondary">
            Anterior
          </Button>
          <Button
            disabled={!data || page >= data.appointments.totalPages}
            onClick={() => setPage((current) => current + 1)}
            variant="secondary"
          >
            Próxima
          </Button>
        </div>
      </div>

      <Modal onClose={() => setAppointmentForm(null)} open={Boolean(appointmentForm)} title="Novo agendamento">
        {appointmentForm ? (
          <div className="space-y-4">
            <label className="block text-sm text-slate-300">
              Paciente
              <select
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-sky-300"
                onChange={(event) => setAppointmentForm({ ...appointmentForm, patientId: event.target.value })}
                value={appointmentForm.patientId}
              >
                <option className="bg-slate-950" value="">Selecione</option>
                {formPatients.map((patient) => (
                  <option className="bg-slate-950" key={patient.id} value={patient.id}>{patient.fullName}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Profissional
              <select
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-sky-300"
                onChange={(event) => setAppointmentForm({ ...appointmentForm, professionalId: event.target.value, serviceId: "" })}
                value={appointmentForm.professionalId}
              >
                <option className="bg-slate-950" value="">Selecione</option>
                {formProfessionals.map((professional) => (
                  <option className="bg-slate-950" key={professional.id} value={professional.id}>{professional.fullName}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Serviço
              <select
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-sky-300"
                onChange={(event) => {
                  const service = availableServices.find((item) => item.id === event.target.value);
                  setAppointmentForm({
                    ...appointmentForm,
                    serviceId: event.target.value,
                    durationMinutes: service ? service.durationMinutes.toString() : appointmentForm.durationMinutes
                  });
                }}
                value={appointmentForm.serviceId}
              >
                <option className="bg-slate-950" value="">Sem serviço específico</option>
                {availableServices.map((service) => (
                  <option className="bg-slate-950" key={service.id} value={service.id}>{service.name} - {service.durationMinutes} min</option>
                ))}
              </select>
            </label>
            <Input onChange={(event) => setAppointmentForm({ ...appointmentForm, startsAt: event.target.value })} type="datetime-local" value={appointmentForm.startsAt} />
            <Input min={5} onChange={(event) => setAppointmentForm({ ...appointmentForm, durationMinutes: event.target.value })} placeholder="Duração em minutos" type="number" value={appointmentForm.durationMinutes} />
            <Input onChange={(event) => setAppointmentForm({ ...appointmentForm, notes: event.target.value })} placeholder="Observações" value={appointmentForm.notes} />
            <div className="flex justify-end gap-3 pt-2">
              <Button onClick={() => setAppointmentForm(null)} type="button" variant="ghost">Cancelar</Button>
              <Button
                disabled={!appointmentForm.patientId || !appointmentForm.professionalId || !appointmentForm.startsAt || !appointmentForm.durationMinutes || createAppointmentMutation.isPending}
                onClick={() => createAppointmentMutation.mutate(appointmentForm)}
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
