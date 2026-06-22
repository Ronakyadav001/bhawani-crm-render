import { Response } from "express";

export class AppError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const ok = (res: Response, data: unknown, message = "OK") => {
  res.json({ success: true, message, data });
};

export const created = (res: Response, data: unknown, message = "Created") => {
  res.status(201).json({ success: true, message, data });
};

export const pagination = (pageRaw?: string, limitRaw?: string) => {
  const page = Math.max(Number(pageRaw || 1), 1);
  const limit = Math.min(Math.max(Number(limitRaw || 10), 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

export const normalizeEmpty = (value: unknown): unknown => {
  if (value === "") return null;
  if (Array.isArray(value)) return value.map(normalizeEmpty);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, normalizeEmpty(item)]));
  }
  return value;
};

export const stripSensitive = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stripSensitive);
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === "object") {
    const serializable = value as { toJSON?: () => unknown; constructor?: { name?: string } };
    if (typeof serializable.toJSON === "function" && serializable.constructor?.name !== "Object") {
      return serializable.toJSON();
    }
    const clean: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (["passwordHash", "tokenHash"].includes(key)) continue;
      clean[key] = stripSensitive(item);
    }
    return clean;
  }
  return value;
};
