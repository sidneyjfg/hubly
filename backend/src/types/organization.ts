export type Organization = {
  id: string;
  legalName: string;
  tradeName: string;
  bookingPageSlug: string;
  timezone: string;
};

export type OrganizationWriteInput = {
  legalName: string;
  tradeName: string;
  bookingPageSlug?: string | undefined;
  timezone: string;
};
