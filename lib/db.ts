import { PrismaClient } from "@prisma/client";

// Singleton pattern for Prisma Client to prevent connection exhaustion
// This is the 2025 best practice for Next.js applications
const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    errorFormat: "pretty",
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const db = globalThis.prismaGlobal ?? prismaClientSingleton();

export { db };

// Prevent multiple instances in development
if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = db;
}

// Graceful shutdown handler
if (process.env.NODE_ENV === "production") {
  process.on("beforeExit", async () => {
    await db.$disconnect();
  });
}
