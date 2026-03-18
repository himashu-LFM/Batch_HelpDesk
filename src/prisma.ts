import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

declare const global: typeof globalThis & { __prisma?: PrismaClient };

if (!global.__prisma) {
  global.__prisma = new PrismaClient();
}

prisma = global.__prisma;

export { prisma };