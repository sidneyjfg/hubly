import { scryptSync, timingSafeEqual } from "node:crypto";

const PASSWORD_SALT = "hubly-local-salt";

export const hashPassword = (password: string): string => {
  return scryptSync(password, PASSWORD_SALT, 64).toString("hex");
};

export const verifyPassword = (password: string, passwordHash: string): boolean => {
  const inputHash = Buffer.from(hashPassword(password), "hex");
  const storedHash = Buffer.from(passwordHash, "hex");

  if (inputHash.length !== storedHash.length) {
    return false;
  }

  return timingSafeEqual(inputHash, storedHash);
};

export const hashTokenValue = (value: string): string => {
  return hashPassword(value);
};

export const verifyTokenValue = (value: string, hash: string): boolean => {
  return verifyPassword(value, hash);
};
