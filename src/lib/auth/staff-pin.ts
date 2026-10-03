// Timeclock: identify a staff member by PIN alone (shared wall tablet), against
// bcrypt hashes stored on AdminUser. Every active user is checked so duplicate
// PINs are detected instead of silently picking the first match.
import { PIN_PATTERN } from "./login";
import { isRole, type Role } from "./roles";

export interface StaffPinUser {
  id: string;
  username: string;
  role: string;
  pinHash: string;
  isActive: boolean;
}

export type StaffPinResult =
  | { ok: true; user: { id: string; username: string; role: Role } }
  | { ok: false; reason: "INVALID_INPUT" | "NO_MATCH" | "AMBIGUOUS" };

export async function verifyStaffPin(
  pin: unknown,
  users: StaffPinUser[],
  comparePin: (pin: string, hash: string) => Promise<boolean>
): Promise<StaffPinResult> {
  if (typeof pin !== "string" || !PIN_PATTERN.test(pin)) return { ok: false, reason: "INVALID_INPUT" };

  const candidates = users.filter((u) => u.isActive && isRole(u.role));
  const results = await Promise.all(candidates.map((u) => comparePin(pin, u.pinHash).catch(() => false)));
  const matches = candidates.filter((_, i) => results[i]);

  if (matches.length === 0) return { ok: false, reason: "NO_MATCH" };
  if (matches.length > 1) return { ok: false, reason: "AMBIGUOUS" };
  const [match] = matches;
  return { ok: true, user: { id: match.id, username: match.username, role: match.role as Role } };
}
