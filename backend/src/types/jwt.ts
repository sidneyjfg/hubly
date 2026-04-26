import type { Role } from "../utils/roles";

export type AccessTokenClaims = {
  sub: string;
  organizationId: string;
  role: Role;
  tokenType: "access";
  sessionId: string;
};

export type RefreshTokenClaims = {
  sub: string;
  organizationId: string;
  role: Role;
  tokenType: "refresh";
  sessionId: string;
};
