// Username + PIN login with per-user lockout. Storage and hashing are injected
// so the rules are unit-tested without a database.
import { z } from "zod";
import { isRole, type Role } from "./roles";

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_MS = 5 * 60 * 1000;
export const PIN_PATTERN = /^\d{4,8}$/;

// bcrypt hash of a random string; compared against when the user does not exist
// so unknown usernames take as long to reject as wrong PINs (no user enumeration).
const DUMMY_HASH = "$2a$10$.uAzp0oij7SlqsD4nlu88e88xJSqBfS7JtGoN1I6vpIrM2/AuanOy";

export interface LoginUserRecord {
  id: string;
  username: string;
  role: string;
  pinHash: string;
  isActive: boolean;
  failedAttempts: number;
  lockedUntil: Date | null;
}

export interface LoginRepository {
  findUserByUsername(username: string): Promise<LoginUserRecord | null>;
  /** Atomically counts one attempt (restart = begin a new count after an expired lock); returns the new count. */
  registerAttempt(id: string, restart: boolean): Promise<number>;
  lock(id: string, lockedUntil: Date): Promise<void>;
  recordSuccess(id: string): Promise<void>;
}

export interface LoginDeps {
  repo: LoginRepository;
  comparePin(pin: string, hash: string): Promise<boolean>;
  now(): Date;
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  role: Role;
}

export type LoginResult =
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; reason: "INVALID_INPUT" | "INVALID_CREDENTIALS" }
  | { ok: false; reason: "LOCKED"; retryAfterSec: number };

const inputSchema = z.object({
  username: z.string().trim().min(1).max(64),
  pin: z.string().regex(PIN_PATTERN),
});

export async function authenticate(input: unknown, deps: LoginDeps): Promise<LoginResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "INVALID_INPUT" };
  const { username, pin } = parsed.data;

  const user = await deps.repo.findUserByUsername(username);
  if (!user || !user.isActive || !isRole(user.role)) {
    await deps.comparePin(pin, DUMMY_HASH).catch(() => false);
    return { ok: false, reason: "INVALID_CREDENTIALS" };
  }

  const now = deps.now();
  if (user.lockedUntil && user.lockedUntil.getTime() > now.getTime()) {
    return { ok: false, reason: "LOCKED", retryAfterSec: Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 1000) };
  }

  // [ADR] Context: counting after the PIN check let parallel guesses all read the same count.
  // Decision: reserve the attempt atomically BEFORE comparing; success clears the count.
  // Consequence: a burst of guesses gets at most MAX_FAILED_ATTEMPTS comparisons.
  // A lock that has expired starts a fresh count instead of re-locking on the next mistake.
  const attempt = await deps.repo.registerAttempt(user.id, Boolean(user.lockedUntil));
  if (attempt >= MAX_FAILED_ATTEMPTS) await deps.repo.lock(user.id, new Date(now.getTime() + LOCKOUT_MS));
  if (attempt > MAX_FAILED_ATTEMPTS) return { ok: false, reason: "LOCKED", retryAfterSec: Math.ceil(LOCKOUT_MS / 1000) };

  if (!(await deps.comparePin(pin, user.pinHash))) {
    return { ok: false, reason: "INVALID_CREDENTIALS" };
  }

  await deps.repo.recordSuccess(user.id);
  return { ok: true, user: { id: user.id, username: user.username, role: user.role } };
}
