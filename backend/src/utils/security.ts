import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Role, User } from "@prisma/client";
import { env } from "../config/env";
import { TokenPayload } from "../types/auth";

export const hashPassword = (password: string) => bcrypt.hash(password, 12);

export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export const generateTemporaryPassword = () => {
  const token = crypto.randomBytes(9).toString("base64url");
  return `Bf@${token}`;
};

export const signAccessToken = (user: Pick<User, "id" | "role" | "email">) => {
  const payload: TokenPayload = { sub: user.id, role: user.role, email: user.email };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
};

export const signRefreshToken = (user: Pick<User, "id" | "role" | "email">) => {
  const payload: TokenPayload = { sub: user.id, role: user.role, email: user.email };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
};

export const verifyAccessToken = (token: string) => jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;

export const verifyRefreshToken = (token: string) => jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;

export const safeUser = (user: User) => {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
};

export const roleHome = (role: Role) => {
  const homes: Record<Role, string> = {
    SUPER_ADMIN: "/super-admin/dashboard",
    SALES_ADMIN: "/sales/dashboard",
    YOGA_TRAINER: "/trainer/dashboard",
    DIETICIAN: "/dietician/dashboard",
    SUPPORT_ADMIN: "/support/dashboard",
    CLIENT: "/app"
  };
  return homes[role];
};
