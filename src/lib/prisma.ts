import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// Enable SQLite WAL mode on start
export async function initializeDatabasePragmas() {
  try {
    await prisma.$queryRawUnsafe(`PRAGMA journal_mode = WAL;`);
    await prisma.$executeRawUnsafe(`PRAGMA synchronous = NORMAL;`);
    await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = ON;`);
    await prisma.$executeRawUnsafe(`PRAGMA busy_timeout = 5000;`);
  } catch (error) {
    console.error("Failed to set SQLite PRAGMAs:", error);
  }
}
