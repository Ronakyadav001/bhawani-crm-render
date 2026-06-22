import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { app } from "./app";

const server = app.listen(env.PORT, () => {
  console.log(`Bhawani Fitness CRM API running on http://localhost:${env.PORT}`);
});

const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
