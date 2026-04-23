export type Clinic = {
  id: string;
  legalName: string;
  tradeName: string;
  timezone: string;
};

export type ClinicWriteInput = {
  legalName: string;
  tradeName: string;
  timezone: string;
};
