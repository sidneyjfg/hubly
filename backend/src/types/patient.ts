export type Patient = {
  id: string;
  clinicId: string;
  fullName: string;
  email?: string | null;
  phone: string;
  isActive: boolean;
};

export type PatientWriteInput = {
  fullName: string;
  email?: string | null;
  phone: string;
};
