import type { Role } from "../utils/roles";

export type AccessTokenClaims = {
  sub: string;
  clinicId: string;
  role: Role;
  tokenType: "access";
  sessionId: string;
};

export type RefreshTokenClaims = {
  sub: string;
  clinicId: string;
  role: Role;
  tokenType: "refresh";
  sessionId: string;
};
