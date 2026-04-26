import type {
  Booking,
  Organization,
  IntegrationSummary,
  MeResponse,
  Customer,
  ServiceOffering,
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
  organizations: {
    update: (id: string) => `/v1/organizations/${id}`
  },
  providers: {
    list: "/v1/providers",
    create: "/v1/providers",
    update: (id: string) => `/v1/providers/${id}`,
    status: (id: string) => `/v1/providers/${id}/status`
  },
  serviceOfferings: {
    list: "/v1/service-offerings",
    create: "/v1/service-offerings",
    update: (id: string) => `/v1/service-offerings/${id}`,
    status: (id: string) => `/v1/service-offerings/${id}/status`
  },
  customers: {
    list: "/v1/customers",
    create: "/v1/customers",
    update: (id: string) => `/v1/customers/${id}`,
    status: (id: string) => `/v1/customers/${id}/status`
  },
  bookings: {
    list: "/v1/bookings",
    create: "/v1/bookings",
    cancel: (id: string) => `/v1/bookings/${id}/cancel`,
    reschedule: (id: string) => `/v1/bookings/${id}/reschedule`,
    attendance: (id: string) => `/v1/bookings/${id}/attendance`,
    missed: (id: string) => `/v1/bookings/${id}/missed`,
    dailySchedule: "/v1/bookings/daily-schedule",
    weeklySchedule: "/v1/bookings/weekly-schedule"
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
  organizationId: string;
  actorId: string;
  role: UserRole;
};

export type CustomerDTO = Customer;

export type CustomerWriteDTO = {
  fullName: string;
  email?: string | null;
  phone: string;
};

export type ProviderWriteDTO = {
  fullName: string;
  specialty: string;
  isActive?: boolean;
};

export type ServiceOfferingDTO = ServiceOffering;

export type ServiceOfferingWriteDTO = {
  providerId: string;
  name: string;
  durationMinutes: number;
  priceCents?: number | null;
  isActive?: boolean;
};

export type BookingDTO = Booking;

export type BookingWriteDTO = {
  customerId: string;
  providerId: string;
  offeringId?: string | null;
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
  organization: {
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

export type UpdateOrganizationInputDTO = {
  legalName: string;
  tradeName: string;
  timezone: string;
};

export type NoShowOverviewDTO = {
  organizationId: string;
  periodStart: string;
  periodEnd: string;
  totalBookings: number;
  attendedBookings: number;
  missedBookings: number;
  noShowRate: number;
};

export type WhatsAppReminderSettingsDTO = WhatsAppReminderSettings;
export type IntegrationSummaryDTO = IntegrationSummary;
export type WhatsAppConnectionStatusDTO = WhatsAppConnectionStatus;
export type WhatsAppSessionConnectResultDTO = WhatsAppSessionConnectResult;
export type WhatsAppDisconnectResultDTO = WhatsAppDisconnectResult;
export type UserProfileDTO = UserProfile;
export type OrganizationDTO = Organization;
export type MeResponseDTO = MeResponse;
