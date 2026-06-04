import { PrismaClient } from "@prisma/client";
export const prisma = global.prisma ??
    new PrismaClient({
        log: ["warn", "error"]
    });
if (process.env.NODE_ENV !== "production") {
    global.prisma = prisma;
}
export * from "@prisma/client";
