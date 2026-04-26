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

export type ProviderWriteInput = {
  fullName: string;
  specialty: string;
  isActive?: boolean;
};

export type ProviderAvailabilityWriteInput = {
  weekday: number;
  workStart: string;
  workEnd: string;
  lunchStart?: string | null | undefined;
  lunchEnd?: string | null | undefined;
  isActive?: boolean | undefined;
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

export type ServiceOfferingWriteInput = {
  providerId: string;
  name: string;
  durationMinutes: number;
  priceCents?: number | null;
  isActive?: boolean;
};

export type PublicBookingPage = {
  organizationId: string;
  bookingPageSlug: string;
  tradeName: string;
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
  providers: Provider[];
  serviceOfferings: ServiceOffering[];
};

export type PublicAvailableSlot = {
  startsAt: string;
  endsAt: string;
  label: string;
};

export type PublicBookingRequestInput = {
  fullName: string;
  email?: string | null;
  phone: string;
  password: string;
  providerId: string;
  offeringId?: string | null;
  startsAt: string;
  endsAt: string;
  notes?: string | null;
  paymentType?: "online" | "presential";
};
