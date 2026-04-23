export const roles = ["administrator", "reception", "professional"] as const;

export type Role = (typeof roles)[number];
