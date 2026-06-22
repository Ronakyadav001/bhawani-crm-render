import { Role } from "@prisma/client";

export type AuthUser = {
  id: string;
  role: Role;
  email: string;
};

export type TokenPayload = {
  sub: string;
  role: Role;
  email: string;
};
