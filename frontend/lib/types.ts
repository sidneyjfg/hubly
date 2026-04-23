export const userRoles = ["administrator", "reception", "professional"] as const;

export type UserRole = (typeof userRoles)[number];

export const appointmentStatuses = [
  "scheduled",
  "confirmed",
  "pending",
  "cancelled",
  "rescheduled",
  "attended",
  "missed"
] as const;

export type AppointmentStatus = (typeof appointmentStatuses)[number];

export type PatientStatus = "active" | "pending" | "returning";

export type PlanName = "Starter" | "Growth" | "Scale";

export type FakeUser = {
  id: string;
  clinicId: string;
  email: string;
  fullName: string;
  phone?: string;
  displayName: string;
  actorId: string;
  role: UserRole;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  clinicId: string;
  actorId: string;
  role: UserRole;
};

export type Patient = {
  id: string;
  clinicId: string;
  fullName: string;
  email?: string | null;
  phone: string;
  isActive: boolean;
};

export type Clinic = {
  id: string;
  legalName: string;
  tradeName: string;
  timezone: string;
};

export type UserProfile = {
  id: string;
  clinicId: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

export type MeResponse = {
  user: UserProfile;
  clinic: Clinic;
};

export type Professional = {
  id: string;
  clinicId: string;
  fullName: string;
  specialty: string;
  isActive: boolean;
};

export type ProfessionalService = {
  id: string;
  clinicId: string;
  professionalId: string;
  professionalName?: string;
  name: string;
  durationMinutes: number;
  priceCents?: number | null;
  isActive: boolean;
};

export type Appointment = {
  id: string;
  clinicId: string;
  patientId: string;
  patientName: string;
  professionalId: string;
  professionalName: string;
  serviceId?: string | null;
  serviceName?: string | null;
  status: AppointmentStatus;
  startsAt: string;
  endsAt: string;
  notes?: string | null;
};

export type AutomationSettings = {
  autoConfirmation: boolean;
  reminder24h: boolean;
  reminder2h: boolean;
};

export type DashboardMetrics = {
  todaysAppointments: number;
  noShowRate: number;
  estimatedRevenue: number;
  occupancyRate: number;
};

export type RevenuePoint = {
  label: string;
  revenue: number;
  noShowRate: number;
};

export type DashboardInsight = {
  label: string;
  value: number;
};

export type PatientRow = {
  id: string;
  fullName: string;
  email?: string | null;
  phone: string;
  isActive: boolean;
  status: PatientStatus;
  lastVisit: string;
};

export type WhatsAppReminderRule = {
  hoursBefore: number;
};

export type WhatsAppReminderSettings = {
  clinicId: string;
  channel: "whatsapp";
  isEnabled: boolean;
  reminders: WhatsAppReminderRule[];
};

export type IntegrationSummary = {
  id: "whatsapp";
  provider: "evolution";
  enabled: boolean;
  phoneNumber?: string | null;
  status?: string | null;
};

export type WhatsAppConnectionStatus = {
  phoneNumber?: string | null;
  state: string;
};

export type WhatsAppSessionConnectResult = {
  state: string;
  phoneNumber: string;
  pairingCode?: string;
  code?: string;
  count?: number;
};

export type WhatsAppDisconnectResult = {
  state: string;
};

export type Testimonial = {
  name: string;
  role: string;
  clinic: string;
  quote: string;
};

export type PricingPlan = {
  name: PlanName | "Custom";
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
};
