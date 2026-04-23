export const appointmentStatuses = [
  "scheduled",
  "confirmed",
  "cancelled",
  "rescheduled",
  "attended",
  "missed",
] as const;

export type AppointmentStatus = (typeof appointmentStatuses)[number];

export type Appointment = {
  id: string;
  clinicId: string;
  patientId: string;
  professionalId: string;
  serviceId?: string | null;
  createdByUserId?: string | null;
  patientName?: string;
  professionalName?: string;
  serviceName?: string | null;
  status: AppointmentStatus;
  startsAt: string;
  endsAt: string;
  notes?: string | null;
};

export type AppointmentWriteInput = {
  patientId: string;
  professionalId: string;
  serviceId?: string | null;
  startsAt: string;
  endsAt: string;
  notes?: string | null;
};

export type AppointmentStatusUpdateInput = {
  notes?: string | null;
};

export type AppointmentSchedule = {
  referenceDate: string;
  startDate: string;
  endDate: string;
  items: Appointment[];
};

export type NoShowOverview = {
  clinicId: string;
  periodStart: string;
  periodEnd: string;
  totalAppointments: number;
  attendedAppointments: number;
  missedAppointments: number;
  noShowRate: number;
};
