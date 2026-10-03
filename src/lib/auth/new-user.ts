// Validation for creating staff/owner accounts (scripts/create-user.ts).
import { PIN_PATTERN } from "./login";
import { ROLES, isRole, type Role } from "./roles";

export interface NewUser {
  username: string;
  role: Role;
  pin: string;
}

const USERNAME_PATTERN = /^[a-z0-9._-]{2,64}$/;

function isTrivialPin(pin: string): boolean {
  if (/^(\d)\1+$/.test(pin)) return true; // 0000, 1111, 999999
  const asc = "0123456789012345";
  const desc = "9876543210987654";
  return asc.includes(pin) || desc.includes(pin); // 1234, 4321, 123456
}

export function parseNewUser(input: { username?: unknown; role?: unknown; pin?: unknown }):
  | { ok: true; value: NewUser }
  | { ok: false; error: string } {
  const username = typeof input.username === "string" ? input.username.trim() : "";
  if (!USERNAME_PATTERN.test(username)) {
    return { ok: false, error: "Username: 2–64 characters, lowercase letters, digits, dot, dash or underscore." };
  }
  if (!isRole(input.role)) return { ok: false, error: `Role must be one of: ${ROLES.join(", ")}.` };
  const pin = typeof input.pin === "string" ? input.pin : "";
  if (!PIN_PATTERN.test(pin)) return { ok: false, error: "PIN must be 4–8 digits." };
  if (isTrivialPin(pin)) return { ok: false, error: "PIN is too easy to guess (repeated or sequential digits)." };
  return { ok: true, value: { username, role: input.role, pin } };
}
