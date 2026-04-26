export type Customer = {
  id: string;
  organizationId: string;
  fullName: string;
  email?: string | null;
  phone: string;
  isActive: boolean;
};

export type CustomerWriteInput = {
  fullName: string;
  email?: string | null;
  phone: string;
  passwordHash?: string | null;
};
