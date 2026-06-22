import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { env } from "./config/env";
import { appRoutes } from "./routes/app.routes";
import { authRoutes } from "./routes/auth.routes";
import { crmRoutes } from "./routes/crm.routes";
import { uploadRoutes } from "./routes/upload.routes";
import { errorHandler, notFound } from "./middlewares/errorHandler";

export const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(compression());
app.use(cors({ origin: env.FRONTEND_URL.split(",").map((origin) => origin.trim()), credentials: true }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(`/${env.UPLOAD_DIR}`, express.static(path.resolve(env.UPLOAD_DIR)));

app.use(
  "/api/auth",
  rateLimit({ windowMs: env.RATE_LIMIT_WINDOW_MS, limit: env.RATE_LIMIT_MAX }),
  authRoutes
);
app.use("/api/app", appRoutes);
app.use("/api/crm/files", uploadRoutes);
app.use("/api/crm", crmRoutes);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "bhawani-fitness-crm", timestamp: new Date().toISOString() });
});

app.use(notFound);
app.use(errorHandler);
