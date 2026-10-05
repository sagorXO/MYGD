// Signed session tokens (HMAC-SHA256 via Web Crypto, so this module runs in
// Node route handlers and in middleware alike).
//
// [ADR] Context: Phase 0.5 must add sessions without a schema change.
// Decision: stateless signed cookie `v1.<payload>.<signature>` carrying
// {sub, usr, role, iat, exp}; no server-side session table.
// Consequence: a session cannot be revoked before it expires (12 h) except by
// rotating SESSION_SECRET; route handlers for money/price changes re-check the
// role. A DB-backed session table can come with the Phase 2 schema.
import { z } from "zod";
import { ROLES, isRole, type Role } from "./roles";

export const SESSION_COOKIE = "mygd_session";
// TODO(Q-SEC-3): session length per device type is an open question; 12 h covers one trading day.
export const SESSION_TTL_SECONDS = 12 * 60 * 60;

const TOKEN_VERSION = "v1";
const MIN_SECRET_LENGTH = 32;
const TEMPLATE_PLACEHOLDERS = new Set(["change_me_to_a_secure_random_string_in_production"]);

export interface SessionIdentity {
  sub: string; // AdminUser.id
  usr: string; // AdminUser.username
  role: Role;
}

export interface SessionPayload extends SessionIdentity {
  iat: number; // issued at, unix seconds
  exp: number; // expires at, unix seconds
}

const payloadSchema = z.object({
  sub: z.string().min(1),
  usr: z.string().min(1),
  role: z.enum(ROLES),
  iat: z.number().int(),
  exp: z.number().int(),
});

export class AuthConfigError extends Error {}

/** Validates SESSION_SECRET. Throws so callers fail closed when auth is misconfigured. */
export function readSessionSecret(value: string | undefined): string {
  if (!value || value.length < MIN_SECRET_LENGTH || TEMPLATE_PLACEHOLDERS.has(value)) {
    throw new AuthConfigError(
      `SESSION_SECRET must be set to a random value of at least ${MIN_SECRET_LENGTH} characters (openssl rand -hex 32).`
    );
  }
  return value;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) throw new Error("invalid base64url");
  const padded = text.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (text.length % 4)) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function createSessionToken(identity: SessionIdentity, secret: string, now: Date = new Date()): Promise<string> {
  if (!isRole(identity.role)) throw new Error(`Unknown role: ${String(identity.role)}`);
  const iat = Math.floor(now.getTime() / 1000);
  const payload: SessionPayload = { sub: identity.sub, usr: identity.usr, role: identity.role, iat, exp: iat + SESSION_TTL_SECONDS };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signed = `${TOKEN_VERSION}.${body}`;
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(signed)));
  return `${signed}.${toBase64Url(signature)}`;
}

/** Returns the session payload, or null for anything missing, malformed, forged or expired. Never throws. */
export async function verifySessionToken(token: unknown, secret: string, now: Date = new Date()): Promise<SessionPayload | null> {
  try {
    if (typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3 || parts[0] !== TOKEN_VERSION) return null;
    const [version, body, signature] = parts;
    const valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      fromBase64Url(signature),
      encoder.encode(`${version}.${body}`)
    );
    if (!valid) return null;
    const parsed = payloadSchema.safeParse(JSON.parse(decoder.decode(fromBase64Url(body))));
    if (!parsed.success) return null;
    if (parsed.data.exp <= Math.floor(now.getTime() / 1000)) return null;
    return parsed.data;
  } catch {
    return null;
  }
}
