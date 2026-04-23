export type User = {
  id: string;
  clinicId: string;
  fullName: string;
  email: string;
  phone: string;
  role: "administrator" | "reception" | "professional";
  isActive: boolean;
  createdAt: string;
};

export type UserAccountWriteInput = {
  fullName: string;
  email: string;
  phone: string;
};
