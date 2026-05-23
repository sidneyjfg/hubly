export const userRoles = ["administrator", "reception", "provider"] as const;

export type UserRole = (typeof userRoles)[number];

export const bookingStatuses = [
  "scheduled",
  "confirmed",
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
  stripeAccountId?: string | null;
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

export type BillingPlan = {
  id: string;
  code: "free" | "pro" | "premium";
  name: string;
  description: string | null;
  amountCents: number;
  currency: string;
  interval: string;
  stripeMode: "test" | "live";
  stripeProductId: string | null;
  stripePriceId: string | null;
  isActive: boolean;
  isDefault: boolean;
};

export type OrganizationSubscription = {
  id: string;
  organizationId: string;
  billingPlanId: string;
  status: "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "paused" | "incomplete" | "incomplete_expired";
  stripeMode: "test" | "live";
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeCheckoutSessionId: string | null;
  stripePriceId: string | null;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  updatedAt: string;
  plan: BillingPlan;
};

export type OrganizationSubscriptionOverview = {
  stripeBillingMode: "test" | "live";
  current: OrganizationSubscription;
  plans: BillingPlan[];
};

export type SystemAdminSubscriptionReadiness = {
  organizationId: string;
  organizationName: string;
  attendedRevenueCents: number;
  upcomingCount: number;
  attendedCount: number;
  missedCount: number;
  pendingStatusCount: number;
  noShowRate: number;
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
  originalAmountCents?: number;
  discountedAmountCents?: number;
};

export type StripeAccountStatus = "pending" | "verified" | "restricted";

export type ProviderPaymentSettings = {
  providerId: string;
  organizationId: string;
  commissionRateBps: number;
  onlineDiscountBps: number;
  absorbsProcessingFee: boolean;
  stripeAccountId?: string | null;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;
  stripeDetailsSubmitted: boolean;
  stripeCurrentlyDue: string[];
  stripeEventuallyDue: string[];
  stripePastDue: string[];
  stripeDisabledReason?: string | null;
  stripeAccountStatus: StripeAccountStatus;
};

export type OrganizationPaymentSettings = Omit<ProviderPaymentSettings, "providerId">;

export type StripeConnectAccount = {
  providerId?: string;
  organizationId?: string;
  stripeAccountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
};

export type StripeOnboardingLink = {
  providerId?: string;
  organizationId?: string;
  onboardingUrl: string;
};

export type StripeAccountStatusResponse = {
  providerId?: string;
  organizationId?: string;
  status: StripeAccountStatus;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  currentlyDue: string[];
  eventuallyDue: string[];
  pastDue: string[];
  disabledReason?: string | null;
  canReceivePayments: boolean;
  canRequestPayouts: boolean;
  blockedReasons: string[];
};

export type StripeBalance = {
  providerId?: string;
  organizationId?: string;
  available: Array<{ amount: number; currency: string }>;
  pending: Array<{ amount: number; currency: string }>;
};

export type FinancialHistoryItem = {
  amountCents: number;
  currency: string;
  type: string;
  status: string;
  createdAt: string;
  failureReason?: string | null;
  metadata?: unknown | null;
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
  lastBookingLabel: string;
  nextBookingLabel: string;
  rescheduleCount: number;
  totalBookings: number;
  history: CustomerHistoryItem[];
};

export type CustomerHistoryItem = {
  id: string;
  date: string;
  time: string;
  providerName: string;
  serviceName: string;
  status: BookingStatus;
  notes?: string | null;
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

export type RelationshipCampaignType = "promotion" | "loyalty";
export type RelationshipCampaignChannel = "whatsapp";

export type RelationshipCampaign = {
  id: string;
  title: string;
  type: RelationshipCampaignType;
  audience: string;
  triggerDaysAfterLastBooking: number;
  message: string;
  channels: RelationshipCampaignChannel[];
  isEnabled: boolean;
};

export type RelationshipAutomationSettings = {
  organizationId: string;
  channel: "relationship";
  isEnabled: boolean;
  campaigns: RelationshipCampaign[];
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

export type PricingComparison = {
  name: string;
  rate: string;
  description: string;
  highlighted?: boolean;
};
