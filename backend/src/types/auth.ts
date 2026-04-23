import type { Role } from "../utils/roles";
import type { Clinic } from "./clinic";
import type { User } from "./user";

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  clinicId: string;
  actorId: string;
  role: Role;
};

export type AuthenticatedUser = {
  id: string;
  clinicId: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  passwordHash: string;
  isActive: boolean;
};

export type AuthenticatedRequestUser = {
  id: string;
  clinicId: string;
  role: Role;
  sessionId: string;
};

export type SignUpInput = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  clinic: {
    legalName: string;
    tradeName: string;
    timezone: string;
  };
};

export type MeResponse = {
  user: User;
  clinic: Clinic;
};
