import crypto from "crypto";
import dayjs from "dayjs";
import { Role, User, UserStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/http";
import {
  hashPassword,
  hashToken,
  roleHome,
  safeUser,
  signAccessToken,
  signRefreshToken,
  verifyPassword,
  verifyRefreshToken
} from "../utils/security";
import { writeAuditLog } from "./audit.service";

const refreshExpiry = () => dayjs().add(30, "day").toDate();

export const hasActivePremium = async (clientId: string) => {
  const subscription = await prisma.subscription.findFirst({
    where: {
      clientId,
      status: "ACTIVE",
      paymentStatus: "PAID",
      endDate: { gte: new Date() }
    },
    include: { plan: true },
    orderBy: { endDate: "desc" }
  });

  return subscription;
};

export const issueTokenPair = async (user: Pick<User, "id" | "role" | "email">) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiry()
    }
  });
  return { accessToken, refreshToken };
};

export const loginWithPassword = async (input: {
  email: string;
  password: string;
  roles?: Role[];
  requirePremiumClient?: boolean;
  ipAddress?: string;
}) => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new AppError(401, "Invalid email or password");
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw new AppError(403, "Account is inactive or suspended");
  }

  if (input.roles && !input.roles.includes(user.role)) {
    throw new AppError(403, "This login endpoint is not available for your role");
  }

  if (input.requirePremiumClient) {
    const client = await prisma.client.findUnique({ where: { userId: user.id } });
    if (!client) throw new AppError(403, "Client profile was not found");
    const subscription = await hasActivePremium(client.id);
    if (!subscription) {
      throw new AppError(402, "Premium subscription is inactive or expired", { code: "PREMIUM_REQUIRED" });
    }
  }

  const tokens = await issueTokenPair(user);
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });
  await writeAuditLog({
    userId: user.id,
    role: user.role,
    action: "LOGIN",
    module: "auth",
    ipAddress: input.ipAddress
  });

  return {
    user: safeUser({ ...user, lastLoginAt: new Date() }),
    home: roleHome(user.role),
    ...tokens
  };
};

export const rotateRefreshToken = async (refreshToken: string) => {
  const payload = verifyRefreshToken(refreshToken);
  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new AppError(401, "Invalid refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.status !== UserStatus.ACTIVE) {
    throw new AppError(401, "Account is inactive or unavailable");
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() }
  });

  return {
    user: safeUser(user),
    home: roleHome(user.role),
    ...(await issueTokenPair(user))
  };
};

export const changePassword = async (input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
  ipAddress?: string;
}) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: input.userId } });
  if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
    throw new AppError(401, "Current password is incorrect");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(input.newPassword),
      forcePasswordChange: false
    }
  });
  await prisma.refreshToken.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() }
  });
  await writeAuditLog({
    userId: user.id,
    role: user.role,
    action: "PASSWORD_CHANGED",
    module: "auth",
    ipAddress: input.ipAddress
  });
};

export const createPasswordReset = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const token = crypto.randomBytes(24).toString("base64url");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: dayjs().add(30, "minute").toDate()
    }
  });
  await writeAuditLog({
    userId: user.id,
    role: user.role,
    action: "PASSWORD_RESET_REQUESTED",
    module: "auth"
  });

  return token;
};

export const resetPassword = async (input: { email: string; resetToken: string; newPassword: string }) => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new AppError(400, "Reset token is invalid or expired");

  const tokenHash = hashToken(input.resetToken);
  const token = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      tokenHash,
      usedAt: null,
      expiresAt: { gte: new Date() }
    }
  });
  if (!token) throw new AppError(400, "Reset token is invalid or expired");

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(input.newPassword),
        forcePasswordChange: false
      }
    }),
    prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() }
    }),
    prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() }
    })
  ]);
};
