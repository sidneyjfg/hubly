export const userRoles = ["administrator", "reception", "provider"] as const;

export type UserRole = (typeof userRoles)[number];

export const bookingStatuses = [
  "scheduled",
  "confirmed",
  "pending",
  "cancelled",
  "rescheduled",
  "attended",
  "missed"
] as const;

export type BookingStatus = (typeof bookingStatuses)[number];

export type CustomerStatus = "active" | "pending" | "returning";

export type FakeUser = {
  id: string;
  organizationId: string;
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
  organizationId: string;
  actorId: string;
  role: UserRole;
};

export type Customer = {
  id: string;
  organizationId: string;
  fullName: string;
  email?: string | null;
  phone: string;
  isActive: boolean;
};

export type Organization = {
  id: string;
  legalName: string;
  tradeName: string;
  bookingPageSlug: string;
  timezone: string;
  publicDescription?: string | null;
  publicPhone?: string | null;
  publicEmail?: string | null;
  addressLine?: string | null;
  addressNumber?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  coverImageUrl?: string | null;
  logoImageUrl?: string | null;
  galleryImageUrls: string[];
  isStorefrontPublished: boolean;
};

export type UserProfile = {
  id: string;
  organizationId: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

export type MeResponse = {
  user: UserProfile;
  organization: Organization;
};

export type Provider = {
  id: string;
  organizationId: string;
  fullName: string;
  specialty: string;
  isActive: boolean;
};

export type ProviderAvailability = {
  id: string;
  organizationId: string;
  providerId: string;
  weekday: number;
  workStart: string;
  workEnd: string;
  lunchStart?: string | null;
  lunchEnd?: string | null;
  isActive: boolean;
};

export type ServiceOffering = {
  id: string;
  organizationId: string;
  providerId: string;
  providerName?: string;
  name: string;
  durationMinutes: number;
  priceCents?: number | null;
  isActive: boolean;
};

export type Booking = {
  id: string;
  organizationId: string;
  customerId: string;
  customerName: string;
  providerId: string;
  providerName: string;
  offeringId?: string | null;
  serviceName?: string | null;
  status: BookingStatus;
  startsAt: string;
  endsAt: string;
  notes?: string | null;
  paymentType?: "online" | "presential";
  originalAmountCents?: number;
  discountedAmountCents?: number;
  onlineDiscountCents?: number;
  platformCommissionRateBps?: number;
  platformCommissionCents?: number;
  providerNetAmountCents?: number;
  paymentStatus?: "not_required" | "pending" | "approved" | "rejected" | "cancelled" | "pending_local";
  paymentCheckoutUrl?: string | null;
};

export type ProviderPaymentSettings = {
  providerId: string;
  organizationId: string;
  commissionRateBps: number;
  onlineDiscountBps: number;
  absorbsProcessingFee: boolean;
  mercadoPagoConnected: boolean;
  mercadoPagoUserId?: string | null;
  mercadoPagoAccessToken?: string | null;
  mercadoPagoRefreshToken?: string | null;
  mercadoPagoTokenExpiresAt?: string | null;
};

export type OrganizationPaymentSettings = Omit<ProviderPaymentSettings, "providerId">;

export type MercadoPagoConnectUrl = {
  providerId: string;
  authorizationUrl: string;
};

export type AutomationSettings = {
  autoConfirmation: boolean;
  reminder24h: boolean;
  reminder2h: boolean;
};

export type DashboardMetrics = {
  todaysBookings: number;
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

export type CustomerRow = {
  id: string;
  fullName: string;
  email?: string | null;
  phone: string;
  isActive: boolean;
  status: CustomerStatus;
  lastVisit: string;
};

export type WhatsAppReminderRule = {
  hoursBefore: number;
};

export type WhatsAppReminderSettings = {
  organizationId: string;
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
  organization: string;
  quote: string;
};

export type MonetizationHighlight = {
  title: string;
  description: string;
};

export type MarketplaceComparison = {
  name: string;
  rate: string;
  description: string;
  highlighted?: boolean;
};
