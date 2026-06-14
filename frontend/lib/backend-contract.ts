import type {
  Booking,
  BookingEventNotificationSettings,
  Organization,
  IntegrationSummary,
  MeResponse,
  Customer,
  FinancialHistoryItem,
  Provider,
  ProviderAvailability,
  ServiceOffering,
  UserProfile,
  UserRole,
  StripeAccountStatusResponse,
  StripeBalance,
  StripeConnectAccount,
  StripeOnboardingLink,
  OrganizationPaymentSettings,
  OrganizationSubscriptionOverview,
  ProviderPaymentSettings,
  RelationshipAutomationSettings,
  RelationshipCampaign,
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
  systemAdmin: {
    signIn: "/v1/system-admin/auth/sign-in",
    tenants: "/v1/system-admin/tenants",
    audit: "/v1/system-admin/audit/events",
    summary: "/v1/system-admin/summary",
    subscriptionReadiness: "/v1/system-admin/subscription-readiness"
  },
  organizations: {
    update: (id: string) => `/v1/organizations/${id}`,
    storefront: "/v1/organizations/storefront",
    storefrontImages: "/v1/organizations/storefront/images",
    subscription: "/v1/organization/subscription",
    subscriptionCheckout: "/v1/organization/subscription/checkout",
    subscriptionCustomerPortal: "/v1/organization/subscription/customer-portal",
    subscriptionCancel: "/v1/organization/subscription/cancel",
    paymentSettings: "/v1/organization/payment-settings",
    stripeAccount: "/v1/organization/stripe/accounts",
    stripeOnboarding: "/v1/organization/stripe/onboarding-links",
    stripeBalance: "/v1/organization/stripe/balance",
    stripeStatus: "/v1/organization/stripe/account-status",
    stripeTransactions: "/v1/organization/stripe/transactions",
    stripePayouts: "/v1/organization/stripe/payouts"
  },
  providers: {
    list: "/v1/providers",
    create: "/v1/providers",
    update: (id: string) => `/v1/providers/${id}`,
    status: (id: string) => `/v1/providers/${id}/status`,
    availability: (id: string) => `/v1/providers/${id}/availability`,
    paymentSettings: (id: string) => `/v1/providers/${id}/payment-settings`,
    stripeAccount: (id: string) => `/v1/providers/${id}/stripe/accounts`,
    stripeOnboarding: (id: string) => `/v1/providers/${id}/stripe/onboarding-links`,
    stripeBalance: (id: string) => `/v1/providers/${id}/stripe/balance`,
    stripeStatus: (id: string) => `/v1/providers/${id}/stripe/account-status`,
    stripeTransactions: (id: string) => `/v1/providers/${id}/stripe/transactions`,
    stripePayouts: (id: string) => `/v1/providers/${id}/stripe/payouts`
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
    bookingEventSettings: "/v1/notifications/booking-events/settings",
    relationshipSettings: "/v1/notifications/relationship/settings",
    process: "/v1/notifications/whatsapp/process"
  },
  integrations: {
    list: "/v1/integrations",
    whatsappStatus: "/v1/integrations/whatsapp/status",
    whatsappSession: "/v1/integrations/whatsapp/session",
    whatsappRegenerateCode: "/v1/integrations/whatsapp/session/regenerate-code",
    whatsappDisconnect: "/v1/integrations/whatsapp/disconnect",
    whatsappSendText: "/v1/integrations/whatsapp/messages/send"
  },
  publicOrganizations: {
    list: "/v1/public/organizations",
    detail: (slug: string) => `/v1/public/organizations/${slug}`,
    availability: (slug: string) => `/v1/public/organizations/${slug}/availability`,
    bookings: (slug: string) => `/v1/public/organizations/${slug}/bookings`
  },
  publicCustomers: {
    signUp: "/v1/public/customers/sign-up",
    signIn: "/v1/public/customers/sign-in",
    me: "/v1/public/customers/me"
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

export type ProviderAvailabilityDTO = ProviderAvailability;

export type ProviderPaymentSettingsDTO = ProviderPaymentSettings;
export type OrganizationPaymentSettingsDTO = OrganizationPaymentSettings;
export type OrganizationSubscriptionOverviewDTO = OrganizationSubscriptionOverview;

export type ProviderPaymentSettingsUpdateDTO = {
  commissionRateBps?: number;
  onlineDiscountBps?: number;
  absorbsProcessingFee?: boolean;
};

export type RelationshipCampaignDTO = RelationshipCampaign;
export type RelationshipAutomationSettingsDTO = RelationshipAutomationSettings;

export type StripeOnboardingLinkDTO = StripeOnboardingLink;
export type StripeConnectAccountDTO = StripeConnectAccount;
export type StripeBalanceDTO = StripeBalance;
export type StripeAccountStatusDTO = StripeAccountStatusResponse;
export type FinancialHistoryItemDTO = FinancialHistoryItem;

export type ServiceOfferingDTO = ServiceOffering;

export type ServiceOfferingWriteDTO = {
  providerId: string;
  name: string;
  durationMinutes: number;
  priceCents?: number | null;
  isActive?: boolean;
};

export type SubscriptionReadinessDTO = {
  organizationId: string;
  organizationName: string;
  attendedRevenueCents: number;
  upcomingCount: number;
  attendedCount: number;
  missedCount: number;
  pendingStatusCount: number;
  noShowRate: number;
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

export type PublicBookingPageDTO = Omit<Organization, "id"> & {
  organizationId: string;
  providers: Provider[];
  serviceOfferings: ServiceOffering[];
};

export type PublicAvailableSlotDTO = {
  startsAt: string;
  endsAt: string;
  label: string;
};

export type PublicBookingWriteDTO = {
  fullName: string;
  email?: string | null;
  phone: string;
  password?: string;
  customerAccessToken?: string;
  providerId: string;
  offeringId?: string | null;
  startsAt: string;
  endsAt: string;
  notes?: string | null;
};

export type PublicCustomerSessionDTO = {
  accessToken: string;
  customer: {
    id: string;
    fullName: string;
    email?: string | null;
    phone: string;
  };
};

export type PublicCustomerPortalDTO = {
  customer: PublicCustomerSessionDTO["customer"];
  bookings: Array<Booking & {
    organizationName: string;
    organizationSlug: string;
  }>;
  places: Array<{
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
    visits: number;
    spentCents: number;
    lastVisitAt: string;
  }>;
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
    timezone?: string;
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
  timezone?: string;
};

export type UpdateStorefrontInputDTO = {
  tradeName: string;
  bookingPageSlug?: string;
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
  galleryImageUrls?: string[];
  isStorefrontPublished?: boolean;
};

export type StorefrontImageUploadInputDTO = {
  slot: "cover" | "logo" | "gallery";
  fileName?: string;
  contentType?: string;
  data: string;
};

export type StorefrontImageUploadResultDTO = {
  url: string;
  contentType: string;
  sizeBytes: number;
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
export type BookingEventNotificationSettingsDTO = BookingEventNotificationSettings;
export type IntegrationSummaryDTO = IntegrationSummary;
export type WhatsAppConnectionStatusDTO = WhatsAppConnectionStatus;
export type WhatsAppSessionConnectResultDTO = WhatsAppSessionConnectResult;
export type WhatsAppDisconnectResultDTO = WhatsAppDisconnectResult;
export type UserProfileDTO = UserProfile;
export type OrganizationDTO = Organization;
export type MeResponseDTO = MeResponse;
