// Create a staff/owner account, or reset its PIN.
//
//   npm run user:create -- --username rico --role SYSTEM_ADMIN
//   npm run user:create -- --username anna --role STORE_STAFF --reset
//
// The PIN is typed without echo (or read from MYGD_USER_PIN for automation), so
// it never lands in shell history. It is stored only as a bcrypt hash.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { parseArgs } from "node:util";
import { stdin, stdout } from "node:process";
import { parseNewUser } from "../src/lib/auth/new-user";

const BCRYPT_COST = 12;

function promptHidden(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY) return reject(new Error("No terminal for the PIN prompt; set MYGD_USER_PIN instead."));
    stdout.write(question);
    let value = "";
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const onData = (ch: string) => {
      if (ch === "\r" || ch === "\n") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.off("data", onData);
        stdout.write("\n");
        resolve(value);
      } else if (ch === "\u0003") {
        stdin.setRawMode(false);
        reject(new Error("Cancelled."));
      } else if (ch === "\u007f") {
        value = value.slice(0, -1);
      } else {
        value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const { values } = parseArgs({
    options: { username: { type: "string" }, role: { type: "string" }, reset: { type: "boolean", default: false } },
  });

  const pin = process.env.MYGD_USER_PIN ?? (await promptHidden("PIN (4–8 digits): "));
  if (!process.env.MYGD_USER_PIN && (await promptHidden("Repeat PIN: ")) !== pin) throw new Error("PINs do not match.");

  const parsed = parseNewUser({ username: values.username, role: values.role, pin });
  if (!parsed.ok) throw new Error(parsed.error);
  const { username, role } = parsed.value;

  const prisma = new PrismaClient();
  try {
    const existing = await prisma.adminUser.findUnique({ where: { username } });
    if (existing && !values.reset) throw new Error(`User "${username}" exists. Add --reset to change its PIN and role.`);

    const pinHash = await bcrypt.hash(pin, BCRYPT_COST);
    const user = await prisma.adminUser.upsert({
      where: { username },
      create: { username, role, pinHash },
      update: { role, pinHash, failedAttempts: 0, lockedUntil: null, isActive: true },
    });
    await prisma.auditLog.create({
      data: {
        adminUserId: user.id,
        action: existing ? "USER_PIN_RESET" : "USER_CREATED",
        details: JSON.stringify({ username, role, via: "scripts/create-user.ts" }),
        severity: "INFO",
      },
    });
    console.log(`${existing ? "Updated" : "Created"} ${username} (${role}).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
