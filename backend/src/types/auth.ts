import type { Role } from "../utils/roles";
import type { Organization } from "./organization";
import type { User } from "./user";

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  organizationId: string;
  actorId: string;
  role: Role;
};

export type AuthenticatedUser = {
  id: string;
  organizationId: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  passwordHash: string;
  isActive: boolean;
};

export type AuthenticatedRequestUser = {
  id: string;
  organizationId: string;
  role: Role;
  sessionId: string;
};

export type SignUpInput = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  organization: {
    legalName: string;
    tradeName: string;
    bookingPageSlug?: string;
    timezone: string;
  };
};

export type MeResponse = {
  user: User;
  organization: Organization;
};
