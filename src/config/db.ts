import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
prisma.$connect()
  .then(() => console.log("✅ Connected to Prisma DB"))
  .catch((err) => console.error("❌ Prisma Connection Error:", err));

export default prisma;