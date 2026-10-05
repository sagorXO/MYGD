// Staff roles, lowest to highest. Values match the Prisma `AdminRole` enum.
export const ROLES = ["STORE_STAFF", "STORE_MANAGER", "SYSTEM_ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** True when `actual` is at least `required` (owner > manager > staff). Unknown roles never pass. */
export function hasRole(actual: unknown, required: Role): boolean {
  if (!isRole(actual)) return false;
  return ROLES.indexOf(actual) >= ROLES.indexOf(required);
}
