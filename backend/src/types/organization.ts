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

export type OrganizationWriteInput = {
  legalName: string;
  tradeName: string;
  bookingPageSlug?: string | undefined;
  timezone?: string | undefined;
};

export type OrganizationStorefrontInput = {
  tradeName: string;
  bookingPageSlug?: string | undefined;
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

export type StorefrontImageSlot = "cover" | "logo" | "gallery";

export type StorefrontImageUploadInput = {
  slot: StorefrontImageSlot;
  fileName?: string | undefined;
  contentType?: string | undefined;
  data: string;
};

export type StorefrontImageUploadResult = {
  url: string;
  contentType: string;
  sizeBytes: number;
};

export type StorefrontImageDeleteInput = {
  url: string;
};
