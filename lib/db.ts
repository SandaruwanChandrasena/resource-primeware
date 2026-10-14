import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Keep one client in dev, so hot reload doesn't open new connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  // UTC session (D80): the pg adapter sends and reads times as UTC wall-clock
  // text, so the DB session must be UTC too, or times shift by +05:30.
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    options: "-c timezone=UTC",
  });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
