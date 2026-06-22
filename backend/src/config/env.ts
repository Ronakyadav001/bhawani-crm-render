import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 chars"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 chars"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(150),
  UPLOAD_DIR: z.string().default("uploads"),
  PUBLIC_API_BASE_URL: z.string().default("http://localhost:5000"),
  FCM_SERVER_KEY: z.string().optional().default(""),
  WHATSAPP_API_URL: z.string().optional().default("https://graph.facebook.com/v20.0"),
  WHATSAPP_TOKEN: z.string().optional().default(""),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional().default(""),
  RAZORPAY_KEY_ID: z.string().optional().default(""),
  RAZORPAY_KEY_SECRET: z.string().optional().default(""),
  OPENAI_API_KEY: z.string().optional().default(""),
  GROQ_API_KEY: z.string().optional().default(""),
  AI_PROVIDER: z.enum(["openai", "groq"]).default("openai")
});

export const env = envSchema.parse(process.env);
