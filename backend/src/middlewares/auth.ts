import { NextFunction, Request, Response } from "express";
import { Role, UserStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/http";
import { verifyAccessToken } from "../utils/security";

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError(401, "Missing bearer token"));
  }

  try {
    const payload = verifyAccessToken(header.slice(7));
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== UserStatus.ACTIVE) {
      return next(new AppError(401, "Account is inactive or unavailable"));
    }
    req.auth = { id: user.id, role: user.role, email: user.email };
    return next();
  } catch {
    return next(new AppError(401, "Invalid or expired token"));
  }
};

export const requireRoles = (...roles: Role[]) => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.auth) return next(new AppError(401, "Authentication required"));
  if (!roles.includes(req.auth.role)) return next(new AppError(403, "You do not have access to this action"));
  return next();
};

export const requirePremiumClient = async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.auth) return next(new AppError(401, "Authentication required"));
  if (req.auth.role !== Role.CLIENT) return next(new AppError(403, "Client app access only"));

  const client = await prisma.client.findUnique({ where: { userId: req.auth.id } });
  if (!client) return next(new AppError(403, "Client profile is not available"));

  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      clientId: client.id,
      status: "ACTIVE",
      paymentStatus: "PAID",
      endDate: { gte: new Date() }
    }
  });

  if (!activeSubscription) {
    return next(new AppError(402, "Premium subscription is inactive or expired", { code: "PREMIUM_REQUIRED" }));
  }

  return next();
};
