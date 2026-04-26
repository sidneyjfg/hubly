export const roles = ["administrator", "reception", "provider"] as const;

export type Role = (typeof roles)[number];
