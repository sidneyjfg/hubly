export type Professional = {
  id: string;
  clinicId: string;
  fullName: string;
  specialty: string;
  isActive: boolean;
};

export type ProfessionalWriteInput = {
  fullName: string;
  specialty: string;
  isActive?: boolean;
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

export type ProfessionalServiceWriteInput = {
  professionalId: string;
  name: string;
  durationMinutes: number;
  priceCents?: number | null;
  isActive?: boolean;
};
