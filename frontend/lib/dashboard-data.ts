import type { Appointment, DashboardInsight, Patient, PatientRow, Professional, RevenuePoint } from "@/lib/types";
import { addDays, endOfDayIso, formatDateInput, startOfDayIso } from "@/lib/utils";

const activeAppointmentStatuses = ["scheduled", "confirmed", "rescheduled"] as string[];

export function buildEmptyRevenueSeries(days = 5): RevenuePoint[] {
  const today = new Date();
  const points: RevenuePoint[] = [];

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = addDays(today, -index);
    const label = new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date).replace(".", "");

    points.push({
      label,
      revenue: 0,
      noShowRate: 0
    });
  }

  return points;
}

export function buildRevenueSeries(appointments: Appointment[], days = 5): RevenuePoint[] {
  const today = new Date();
  const points: RevenuePoint[] = [];

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = addDays(today, -index);
    const label = new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date).replace(".", "");
    const dayKey = formatDateInput(date);
    const dayAppointments = appointments.filter((appointment) => appointment.startsAt.slice(0, 10) === dayKey);
    const attended = dayAppointments.filter((appointment) => appointment.status === "attended").length;
    const expected = dayAppointments.filter((appointment) => activeAppointmentStatuses.includes(appointment.status)).length;
    const missed = dayAppointments.filter((appointment) => appointment.status === "missed").length;
    const total = dayAppointments.length;

    points.push({
      label,
      revenue: (attended * 220) + (expected * 160),
      noShowRate: total === 0 ? 0 : Number(((missed / total) * 100).toFixed(1))
    });
  }

  return points;
}

export function buildDashboardInsights(
  todaysAppointments: Appointment[],
  recentAppointments: Appointment[],
  professionals: Professional[]
): DashboardInsight[] {
  const activeToday = todaysAppointments.filter((appointment) =>
    activeAppointmentStatuses.includes(appointment.status)
  );
  const confirmedToday = todaysAppointments.filter((appointment) => appointment.status === "confirmed").length;
  const completedRecent = recentAppointments.filter((appointment) =>
    ["attended", "missed"].includes(appointment.status)
  );
  const missedRecent = completedRecent.filter((appointment) => appointment.status === "missed").length;
  const rescheduledRecent = recentAppointments.filter((appointment) => appointment.status === "rescheduled").length;
  const activeProfessionals = professionals.filter((professional) => professional.isActive).length;

  return [
    {
      label: "Consultas confirmadas hoje",
      value: activeToday.length === 0 ? 0 : Math.round((confirmedToday / activeToday.length) * 100)
    },
    {
      label: "No-show nos últimos dias",
      value: completedRecent.length === 0 ? 0 : Math.round((missedRecent / completedRecent.length) * 100)
    },
    {
      label: "Reagendamentos no período",
      value: recentAppointments.length === 0 ? 0 : Math.round((rescheduledRecent / recentAppointments.length) * 100)
    },
    {
      label: "Profissionais ativos",
      value: professionals.length === 0 ? 0 : Math.round((activeProfessionals / professionals.length) * 100)
    }
  ];
}

export function buildPatientRows(patients: Patient[], appointments: Appointment[]): PatientRow[] {
  const now = Date.now();

  return patients.map((patient) => {
    const relatedAppointments = appointments
      .filter((appointment) => appointment.patientId === patient.id)
      .sort((left, right) => new Date(right.startsAt).getTime() - new Date(left.startsAt).getTime());

    const hasUpcoming = relatedAppointments.some(
      (appointment) => new Date(appointment.startsAt).getTime() >= now && appointment.status !== "cancelled"
    );
    const latestFinished = relatedAppointments.find((appointment) =>
      ["attended", "missed"].includes(appointment.status)
    );

    return {
      id: patient.id,
      fullName: patient.fullName,
      email: patient.email,
      phone: patient.phone,
      isActive: patient.isActive,
      status: hasUpcoming ? "active" : latestFinished ? "returning" : "pending",
      lastVisit: latestFinished ? latestFinished.startsAt.slice(0, 10) : "Sem histórico"
    };
  });
}

export function getPeriodRange(days: number): { from: string; to: string } {
  const end = new Date();
  const start = addDays(end, -(days - 1));

  return {
    from: startOfDayIso(start),
    to: endOfDayIso(end)
  };
}
