// Prisma client singleton. In serverless, reuse one client across warm invocations
// to avoid exhausting Neon connections (use the POOLED connection string in DATABASE_URL).
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["warn", "error"] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
