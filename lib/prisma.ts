import { PrismaClient } from "@prisma/client";

// Cegah instansiasi ganda saat development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query"], // Boleh dihapus kalau tidak butuh log query
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
