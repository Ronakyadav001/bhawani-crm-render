import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";

export const writeAuditLog = async (input: {
  userId?: string;
  role?: Role;
  action: string;
  module: string;
  targetId?: string;
  ipAddress?: string;
  metadata?: unknown;
}) => {
  await prisma.activityLog.create({
    data: {
      userId: input.userId,
      role: input.role,
      action: input.action,
      module: input.module,
      targetId: input.targetId,
      ipAddress: input.ipAddress,
      metadata: input.metadata === undefined ? undefined : (input.metadata as object)
    }
  });
};
