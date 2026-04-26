import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

import type { AccessTokenClaims, RefreshTokenClaims } from "../types/jwt";
import { env } from "./env";

type BaseClaims = {
  sub: string;
  organizationId: string;
  role: AccessTokenClaims["role"];
  sessionId: string;
};

const buildSignOptions = (
  subject: string,
  expiresIn: string,
): SignOptions => ({
  subject,
  expiresIn: expiresIn as NonNullable<SignOptions["expiresIn"]>,
  issuer: "hubly-api",
});

export const createAccessToken = (claims: BaseClaims): string => {
  return jwt.sign(
    {
      organizationId: claims.organizationId,
      role: claims.role,
      tokenType: "access",
      sessionId: claims.sessionId,
    },
    env.JWT_ACCESS_SECRET,
    buildSignOptions(claims.sub, env.JWT_ACCESS_EXPIRES_IN),
  );
};

export const createRefreshToken = (claims: BaseClaims): string => {
  return jwt.sign(
    {
      organizationId: claims.organizationId,
      role: claims.role,
      tokenType: "refresh",
      sessionId: claims.sessionId,
    },
    env.JWT_REFRESH_SECRET,
    buildSignOptions(claims.sub, env.JWT_REFRESH_EXPIRES_IN),
  );
};

export const verifyAccessToken = (token: string): AccessTokenClaims => {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: "hubly-api",
  }) as jwt.JwtPayload;

  return {
    sub: String(payload.sub),
    organizationId: String(payload.organizationId),
    role: payload.role as AccessTokenClaims["role"],
    tokenType: "access",
    sessionId: String(payload.sessionId),
  };
};

export const verifyRefreshToken = (token: string): RefreshTokenClaims => {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: "hubly-api",
  }) as jwt.JwtPayload;

  return {
    sub: String(payload.sub),
    organizationId: String(payload.organizationId),
    role: payload.role as RefreshTokenClaims["role"],
    tokenType: "refresh",
    sessionId: String(payload.sessionId),
  };
};
