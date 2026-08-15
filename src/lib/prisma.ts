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

// Enable SQLite WAL mode if running local SQLite (skips on Supabase / PostgreSQL)
export async function initializeDatabasePragmas() {
  const dbUrl = process.env.DATABASE_URL || "";
  if (dbUrl.startsWith("file:") || dbUrl.includes(".db")) {
    try {
      await prisma.$queryRawUnsafe(`PRAGMA journal_mode = WAL;`);
      await prisma.$executeRawUnsafe(`PRAGMA synchronous = NORMAL;`);
      await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = ON;`);
      await prisma.$executeRawUnsafe(`PRAGMA busy_timeout = 5000;`);
    } catch (error) {
      console.error("Failed to set SQLite PRAGMAs:", error);
    }
  }
}
