import { Router } from "express";
import { Role } from "@prisma/client";
import { env } from "../config/env";
import { authenticate } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/http";
import {
  changePassword,
  createPasswordReset,
  loginWithPassword,
  resetPassword,
  rotateRefreshToken
} from "../services/auth.service";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  resetPasswordSchema
} from "../validators/auth.validators";

export const authRoutes = Router();

authRoutes.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const data = await loginWithPassword({
      email: req.body.email,
      password: req.body.password,
      roles: [Role.SUPER_ADMIN, Role.SALES_ADMIN, Role.YOGA_TRAINER, Role.DIETICIAN, Role.SUPPORT_ADMIN],
      ipAddress: req.ip
    });
    ok(res, data, "Login successful");
  })
);

authRoutes.post(
  "/refresh",
  validateBody(refreshSchema),
  asyncHandler(async (req, res) => {
    ok(res, await rotateRefreshToken(req.body.refreshToken), "Token refreshed");
  })
);

authRoutes.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    ok(res, req.auth, "Current user");
  })
);

authRoutes.post(
  "/change-password",
  authenticate,
  validateBody(changePasswordSchema),
  asyncHandler(async (req, res) => {
    await changePassword({
      userId: req.auth!.id,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
      ipAddress: req.ip
    });
    ok(res, { passwordChanged: true }, "Password changed");
  })
);

authRoutes.post(
  "/forgot-password",
  validateBody(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const resetToken = await createPasswordReset(req.body.email);
    ok(
      res,
      {
        delivered: true,
        resetToken: env.NODE_ENV === "production" ? undefined : resetToken
      },
      "If the account exists, a reset token has been issued"
    );
  })
);

authRoutes.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    await resetPassword(req.body);
    ok(res, { passwordReset: true }, "Password reset complete");
  })
);
