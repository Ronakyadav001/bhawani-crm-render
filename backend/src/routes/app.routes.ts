import { Router } from "express";
import { FeedbackRelatedType, NotificationStatus, Role, TicketPriority } from "@prisma/client";
import { prisma } from "../config/prisma";
import { authenticate, requirePremiumClient } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError, created, ok } from "../utils/http";
import { loginWithPassword, rotateRefreshToken, hasActivePremium } from "../services/auth.service";
import { answerOrEscalateSupportQuery } from "../services/aiSupport.service";
import { loginSchema, refreshSchema } from "../validators/auth.validators";
import { z } from "zod";

export const appRoutes = Router();

const routeParam = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : String(value || "");

const getClient = async (userId: string) => {
  const client = await prisma.client.findUnique({
    where: { userId },
    include: { user: true }
  });
  if (!client) throw new AppError(404, "Client profile not found");
  return client;
};

appRoutes.post(
  "/auth/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const data = await loginWithPassword({
      email: req.body.email,
      password: req.body.password,
      roles: [Role.CLIENT],
      requirePremiumClient: true,
      ipAddress: req.ip
    });
    ok(res, data, "App login successful");
  })
);

appRoutes.post(
  "/auth/refresh",
  validateBody(refreshSchema),
  asyncHandler(async (req, res) => {
    const data = await rotateRefreshToken(req.body.refreshToken);
    if (data.user.role !== Role.CLIENT) throw new AppError(403, "Client app refresh only");
    ok(res, data, "App token refreshed");
  })
);

appRoutes.use(authenticate, requirePremiumClient);

appRoutes.get(
  "/me",
  asyncHandler(async (req, res) => {
    const client = await getClient(req.auth!.id);
    ok(res, client, "Client profile");
  })
);

appRoutes.get(
  "/subscription/current",
  asyncHandler(async (req, res) => {
    const client = await getClient(req.auth!.id);
    ok(res, await hasActivePremium(client.id), "Current subscription");
  })
);

appRoutes.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const client = await getClient(req.auth!.id);
    const [subscription, dietPlan, upcomingSessions, unreadNotifications, openTickets, progress] = await Promise.all([
      hasActivePremium(client.id),
      prisma.dietPlan.findFirst({
        where: { clientId: client.id, status: "PUBLISHED" },
        include: { meals: true },
        orderBy: { createdAt: "desc" }
      }),
      prisma.yogaSession.findMany({
        where: {
          status: { in: ["SCHEDULED", "LIVE"] },
          scheduledEnd: { gte: new Date() },
          assignments: { some: { clientId: client.id } }
        },
        orderBy: { scheduledStart: "asc" },
        take: 5
      }),
      prisma.notification.count({ where: { userId: req.auth!.id, status: { not: NotificationStatus.READ } } }),
      prisma.supportTicket.count({ where: { clientId: client.id, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma.dietProgressLog.findMany({ where: { clientId: client.id }, orderBy: { createdAt: "desc" }, take: 8 })
    ]);
    ok(res, { client, subscription, dietPlan, upcomingSessions, unreadNotifications, openTickets, progress }, "App dashboard");
  })
);

appRoutes.get(
  "/diet-plan/current",
  asyncHandler(async (req, res) => {
    const client = await getClient(req.auth!.id);
    const plan = await prisma.dietPlan.findFirst({
      where: { clientId: client.id, status: "PUBLISHED" },
      include: { meals: true },
      orderBy: { createdAt: "desc" }
    });
    ok(res, plan, "Current diet plan");
  })
);

appRoutes.get(
  "/diet-plan/meals",
  asyncHandler(async (req, res) => {
    const client = await getClient(req.auth!.id);
    const plan = await prisma.dietPlan.findFirst({
      where: { clientId: client.id, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" }
    });
    const meals = plan ? await prisma.dietMeal.findMany({ where: { dietPlanId: plan.id }, orderBy: { mealTime: "asc" } }) : [];
    ok(res, meals, "Diet meals");
  })
);

appRoutes.get(
  "/diet-progress",
  asyncHandler(async (req, res) => {
    const client = await getClient(req.auth!.id);
    ok(res, await prisma.dietProgressLog.findMany({ where: { clientId: client.id }, orderBy: { createdAt: "desc" } }), "Diet progress");
  })
);

appRoutes.post(
  "/diet-feedback",
  validateBody(z.object({ rating: z.coerce.number().min(1).max(5), comment: z.string().optional(), relatedId: z.string().optional() })),
  asyncHandler(async (req, res) => {
    const client = await getClient(req.auth!.id);
    created(
      res,
      await prisma.feedback.create({
        data: {
          clientId: client.id,
          relatedType: FeedbackRelatedType.DIET,
          relatedId: req.body.relatedId,
          rating: req.body.rating,
          comment: req.body.comment
        }
      }),
      "Diet feedback saved"
    );
  })
);

appRoutes.get(
  "/yoga-sessions/upcoming",
  asyncHandler(async (req, res) => {
    const client = await getClient(req.auth!.id);
    ok(
      res,
      await prisma.yogaSession.findMany({
        where: {
          scheduledEnd: { gte: new Date() },
          status: { in: ["SCHEDULED", "LIVE"] },
          assignments: { some: { clientId: client.id } }
        },
        orderBy: { scheduledStart: "asc" }
      }),
      "Upcoming sessions"
    );
  })
);

appRoutes.get(
  "/yoga-sessions/today",
  asyncHandler(async (req, res) => {
    const client = await getClient(req.auth!.id);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    ok(
      res,
      await prisma.yogaSession.findMany({
        where: {
          scheduledStart: { gte: start, lt: end },
          assignments: { some: { clientId: client.id } }
        },
        orderBy: { scheduledStart: "asc" }
      }),
      "Today's sessions"
    );
  })
);

appRoutes.post(
  "/yoga-sessions/:id/join",
  asyncHandler(async (req, res) => {
    const client = await getClient(req.auth!.id);
    const sessionId = routeParam(req.params.id);
    const assignment = await prisma.sessionAssignment.findUnique({
      where: { sessionId_clientId: { sessionId, clientId: client.id } }
    });
    if (!assignment) throw new AppError(403, "This session is not assigned to you");
    const attendance = await prisma.sessionAttendance.upsert({
      where: { sessionId_clientId: { sessionId, clientId: client.id } },
      update: { joinedAt: new Date(), attendanceStatus: "JOINED" },
      create: { sessionId, clientId: client.id, joinedAt: new Date(), attendanceStatus: "JOINED" }
    });
    ok(res, attendance, "Session joined");
  })
);

appRoutes.post(
  "/yoga-sessions/:id/leave",
  asyncHandler(async (req, res) => {
    const client = await getClient(req.auth!.id);
    const sessionId = routeParam(req.params.id);
    const attendance = await prisma.sessionAttendance.findUnique({
      where: { sessionId_clientId: { sessionId, clientId: client.id } }
    });
    if (!attendance?.joinedAt) throw new AppError(400, "Join the session before leaving");
    const leftAt = new Date();
    const durationMinutes = Math.max(Math.round((leftAt.getTime() - attendance.joinedAt.getTime()) / 60000), 1);
    ok(
      res,
      await prisma.sessionAttendance.update({
        where: { id: attendance.id },
        data: {
          leftAt,
          durationMinutes,
          attendanceStatus: durationMinutes < 30 ? "PARTIAL" : "JOINED"
        }
      }),
      "Session attendance updated"
    );
  })
);

appRoutes.get(
  "/yoga-sessions/recordings",
  asyncHandler(async (req, res) => {
    const client = await getClient(req.auth!.id);
    ok(
      res,
      await prisma.sessionRecording.findMany({
        where: {
          isPremiumOnly: true,
          session: { assignments: { some: { clientId: client.id } } }
        },
        orderBy: { createdAt: "desc" }
      }),
      "Premium recordings"
    );
  })
);

appRoutes.get(
  "/notifications",
  asyncHandler(async (req, res) => {
    ok(res, await prisma.notification.findMany({ where: { userId: req.auth!.id }, orderBy: { createdAt: "desc" } }), "Notifications");
  })
);

appRoutes.patch(
  "/notifications/:id/read",
  asyncHandler(async (req, res) => {
    const notificationId = routeParam(req.params.id);
    ok(
      res,
      await prisma.notification.updateMany({
        where: { id: notificationId, userId: req.auth!.id },
        data: { status: NotificationStatus.READ }
      }),
      "Notification marked read"
    );
  })
);

appRoutes.get(
  "/chat/messages",
  asyncHandler(async (req, res) => {
    const client = await getClient(req.auth!.id);
    ok(res, await prisma.chatMessage.findMany({ where: { clientId: client.id }, orderBy: { createdAt: "asc" } }), "Chat messages");
  })
);

appRoutes.post(
  "/chat/message",
  validateBody(z.object({ message: z.string().min(1), relatedTicketId: z.string().optional() })),
  asyncHandler(async (req, res) => {
    const client = await getClient(req.auth!.id);
    if (req.body.relatedTicketId) {
      created(
        res,
        await prisma.chatMessage.create({
          data: {
            clientId: client.id,
            senderId: req.auth!.id,
            senderRole: Role.CLIENT,
            message: req.body.message,
            relatedTicketId: req.body.relatedTicketId
          }
        }),
        "Message sent"
      );
      return;
    }
    created(res, await answerOrEscalateSupportQuery({ clientId: client.id, userId: req.auth!.id, message: req.body.message }), "Message processed");
  })
);

appRoutes.post(
  "/support/ticket",
  validateBody(z.object({ subject: z.string().min(3), description: z.string().min(3), priority: z.nativeEnum(TicketPriority).default(TicketPriority.MEDIUM) })),
  asyncHandler(async (req, res) => {
    const client = await getClient(req.auth!.id);
    const support = await prisma.user.findFirst({ where: { role: Role.SUPPORT_ADMIN, status: "ACTIVE" } });
    created(
      res,
      await prisma.supportTicket.create({
        data: {
          clientId: client.id,
          assignedSupportId: support?.id,
          subject: req.body.subject,
          description: req.body.description,
          priority: req.body.priority,
          source: "APP_CHAT"
        }
      }),
      "Support ticket created"
    );
  })
);

appRoutes.get(
  "/support/tickets",
  asyncHandler(async (req, res) => {
    const client = await getClient(req.auth!.id);
    ok(res, await prisma.supportTicket.findMany({ where: { clientId: client.id }, orderBy: { createdAt: "desc" } }), "Support tickets");
  })
);

appRoutes.post(
  "/feedback",
  validateBody(z.object({
    relatedType: z.nativeEnum(FeedbackRelatedType),
    relatedId: z.string().optional(),
    rating: z.coerce.number().min(1).max(5),
    comment: z.string().optional()
  })),
  asyncHandler(async (req, res) => {
    const client = await getClient(req.auth!.id);
    created(res, await prisma.feedback.create({ data: { clientId: client.id, ...req.body } }), "Feedback saved");
  })
);
