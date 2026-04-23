import type {
  Appointment,
  Clinic,
  IntegrationSummary,
  MeResponse,
  Patient,
  ProfessionalService,
  UserProfile,
  UserRole,
  WhatsAppConnectionStatus,
  WhatsAppDisconnectResult,
  WhatsAppReminderSettings,
  WhatsAppSessionConnectResult
} from "@/lib/types";

export const apiRoutes = {
  auth: {
    signIn: "/v1/auth/sign-in",
    signUp: "/v1/auth/sign-up",
    refresh: "/v1/auth/refresh",
    me: "/v1/auth/me",
    account: "/v1/auth/account",
    password: "/v1/auth/password"
  },
  clinics: {
    update: (id: string) => `/v1/clinics/${id}`
  },
  professionals: {
    list: "/v1/professionals",
    create: "/v1/professionals",
    update: (id: string) => `/v1/professionals/${id}`,
    status: (id: string) => `/v1/professionals/${id}/status`
  },
  professionalServices: {
    list: "/v1/professional-services",
    create: "/v1/professional-services",
    update: (id: string) => `/v1/professional-services/${id}`,
    status: (id: string) => `/v1/professional-services/${id}/status`
  },
  patients: {
    list: "/v1/patients",
    create: "/v1/patients",
    update: (id: string) => `/v1/patients/${id}`,
    status: (id: string) => `/v1/patients/${id}/status`
  },
  appointments: {
    list: "/v1/appointments",
    create: "/v1/appointments",
    cancel: (id: string) => `/v1/appointments/${id}/cancel`,
    reschedule: (id: string) => `/v1/appointments/${id}/reschedule`,
    attendance: (id: string) => `/v1/appointments/${id}/attendance`,
    missed: (id: string) => `/v1/appointments/${id}/missed`,
    dailySchedule: "/v1/appointments/daily-schedule",
    weeklySchedule: "/v1/appointments/weekly-schedule"
  },
  reports: {
    catalog: "/v1/reports/catalog",
    noShowOverview: "/v1/reports/no-show-overview"
  },
  notifications: {
    channels: "/v1/notifications/channels",
    whatsappSettings: "/v1/notifications/whatsapp/settings",
    process: "/v1/notifications/whatsapp/process"
  },
  integrations: {
    list: "/v1/integrations",
    whatsappStatus: "/v1/integrations/whatsapp/status",
    whatsappConnect: "/v1/integrations/whatsapp/connect",
    whatsappSession: "/v1/integrations/whatsapp/session",
    whatsappRegenerateCode: "/v1/integrations/whatsapp/session/regenerate-code",
    whatsappDisconnect: "/v1/integrations/whatsapp/disconnect",
    whatsappSendText: "/v1/integrations/whatsapp/messages/send"
  }
} as const;

export type AuthSessionDTO = {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  clinicId: string;
  actorId: string;
  role: UserRole;
};

export type PatientDTO = Patient;

export type PatientWriteDTO = {
  fullName: string;
  email?: string | null;
  phone: string;
};

export type ProfessionalWriteDTO = {
  fullName: string;
  specialty: string;
  isActive?: boolean;
};

export type ProfessionalServiceDTO = ProfessionalService;

export type ProfessionalServiceWriteDTO = {
  professionalId: string;
  name: string;
  durationMinutes: number;
  priceCents?: number | null;
  isActive?: boolean;
};

export type AppointmentDTO = Appointment;

export type AppointmentWriteDTO = {
  patientId: string;
  professionalId: string;
  serviceId?: string | null;
  startsAt: string;
  endsAt: string;
  notes?: string | null;
};

export type SignInInputDTO = {
  email: string;
  password: string;
};

export type SignUpInputDTO = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  clinic: {
    legalName: string;
    tradeName: string;
    timezone: string;
  };
};

export type RefreshInputDTO = {
  refreshToken: string;
};

export type UpdateAccountInputDTO = {
  fullName: string;
  email: string;
  phone: string;
};

export type UpdatePasswordInputDTO = {
  currentPassword: string;
  newPassword: string;
};

export type UpdateClinicInputDTO = {
  legalName: string;
  tradeName: string;
  timezone: string;
};

export type NoShowOverviewDTO = {
  clinicId: string;
  periodStart: string;
  periodEnd: string;
  totalAppointments: number;
  attendedAppointments: number;
  missedAppointments: number;
  noShowRate: number;
};

export type WhatsAppReminderSettingsDTO = WhatsAppReminderSettings;
export type IntegrationSummaryDTO = IntegrationSummary;
export type WhatsAppConnectionStatusDTO = WhatsAppConnectionStatus;
export type WhatsAppSessionConnectResultDTO = WhatsAppSessionConnectResult;
export type WhatsAppDisconnectResultDTO = WhatsAppDisconnectResult;
export type UserProfileDTO = UserProfile;
export type ClinicDTO = Clinic;
export type MeResponseDTO = MeResponse;
