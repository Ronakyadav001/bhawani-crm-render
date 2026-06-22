import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { env } from "./env";

const adapter = new PrismaMariaDb(env.DATABASE_URL);

export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
});
