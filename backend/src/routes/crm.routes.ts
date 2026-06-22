import { Router } from "express";
import { Prisma, Role } from "@prisma/client";
import dayjs from "dayjs";
import { prisma } from "../config/prisma";
import { authenticate, requireRoles } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError, created, normalizeEmpty, ok, pagination, stripSensitive } from "../utils/http";
import { generateTemporaryPassword, hashPassword } from "../utils/security";
import { writeAuditLog } from "../services/audit.service";
import { toCsv } from "../utils/csv";
import { createPaymentOrder, handleRazorpayWebhook, verifyRazorpayPayment } from "../services/payment.service";
import { notifyDietPlanUpdate, notifyLiveSessionReminder } from "../services/fcm.service";
import { sendLiveSessionLink, sendOnboardingCallReminder, sendSubscriptionConfirmation } from "../services/whatsapp.service";

export const crmRoutes = Router();

const routeParam = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : String(value || "");

type ResourceConfig = {
  model: string;
  module: string;
  searchFields: string[];
  statusField?: string;
  read: Role[];
  create: Role[];
  update: Role[];
  remove: Role[];
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
};

const allStaff = [Role.SUPER_ADMIN, Role.SALES_ADMIN, Role.YOGA_TRAINER, Role.DIETICIAN, Role.SUPPORT_ADMIN];
const adminOnly = [Role.SUPER_ADMIN];

const userSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  forcePasswordChange: true,
  profileImage: true,
  createdById: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true
};

const userMini = { select: { id: true, fullName: true, email: true, phone: true, role: true, status: true } };

const resources: Record<string, ResourceConfig> = {
  users: {
    model: "user",
    module: "users",
    searchFields: ["fullName", "email", "phone"],
    statusField: "status",
    read: adminOnly,
    create: adminOnly,
    update: adminOnly,
    remove: adminOnly,
    select: userSelect
  },
  clients: {
    model: "client",
    module: "clients",
    searchFields: ["clientCode", "city", "state", "healthGoal"],
    statusField: "onboardingStatus",
    read: allStaff,
    create: [Role.SUPER_ADMIN, Role.SALES_ADMIN],
    update: [Role.SUPER_ADMIN, Role.SALES_ADMIN, Role.YOGA_TRAINER, Role.DIETICIAN, Role.SUPPORT_ADMIN],
    remove: adminOnly,
    include: { user: userMini, assignedSales: userMini, assignedTrainer: userMini, assignedDietician: userMini, assignedSupport: userMini }
  },
  leads: {
    model: "lead",
    module: "leads",
    searchFields: ["fullName", "phone", "email", "healthGoal", "notes"],
    statusField: "leadStatus",
    read: [Role.SUPER_ADMIN, Role.SALES_ADMIN],
    create: [Role.SUPER_ADMIN, Role.SALES_ADMIN],
    update: [Role.SUPER_ADMIN, Role.SALES_ADMIN],
    remove: adminOnly,
    include: { assignedSales: userMini }
  },
  "subscription-plans": {
    model: "subscriptionPlan",
    module: "subscription_plans",
    searchFields: ["name", "description"],
    statusField: "isActive",
    read: allStaff,
    create: adminOnly,
    update: adminOnly,
    remove: adminOnly
  },
  subscriptions: {
    model: "subscription",
    module: "subscriptions",
    searchFields: [],
    statusField: "status",
    read: allStaff,
    create: adminOnly,
    update: adminOnly,
    remove: adminOnly,
    include: { client: { include: { user: userMini } }, plan: true }
  },
  payments: {
    model: "payment",
    module: "payments",
    searchFields: ["transactionId", "currency", "paymentGateway"],
    statusField: "paymentStatus",
    read: [Role.SUPER_ADMIN, Role.SALES_ADMIN],
    create: adminOnly,
    update: adminOnly,
    remove: adminOnly,
    include: { client: { include: { user: userMini } }, subscription: { include: { plan: true } } }
  },
  "onboarding-calls": {
    model: "onboardingCall",
    module: "onboarding_calls",
    searchFields: ["callType", "callLink", "notes"],
    statusField: "status",
    read: [Role.SUPER_ADMIN, Role.SALES_ADMIN],
    create: [Role.SUPER_ADMIN, Role.SALES_ADMIN],
    update: [Role.SUPER_ADMIN, Role.SALES_ADMIN],
    remove: adminOnly,
    include: { client: { include: { user: userMini } }, salesAdmin: userMini }
  },
  "diet-plans": {
    model: "dietPlan",
    module: "diet_plans",
    searchFields: ["title", "goal", "notes"],
    statusField: "status",
    read: [Role.SUPER_ADMIN, Role.DIETICIAN],
    create: [Role.SUPER_ADMIN, Role.DIETICIAN],
    update: [Role.SUPER_ADMIN, Role.DIETICIAN],
    remove: adminOnly,
    include: { client: { include: { user: userMini } }, dietician: userMini, meals: true }
  },
  "diet-meals": {
    model: "dietMeal",
    module: "diet_meals",
    searchFields: ["foodItems", "instructions"],
    statusField: "mealType",
    read: [Role.SUPER_ADMIN, Role.DIETICIAN],
    create: [Role.SUPER_ADMIN, Role.DIETICIAN],
    update: [Role.SUPER_ADMIN, Role.DIETICIAN],
    remove: [Role.SUPER_ADMIN, Role.DIETICIAN],
    include: { dietPlan: { include: { client: { include: { user: userMini } } } } }
  },
  "diet-progress": {
    model: "dietProgressLog",
    module: "diet_progress_logs",
    searchFields: ["notes"],
    read: [Role.SUPER_ADMIN, Role.DIETICIAN],
    create: [Role.SUPER_ADMIN, Role.DIETICIAN],
    update: [Role.SUPER_ADMIN, Role.DIETICIAN],
    remove: adminOnly,
    include: { client: { include: { user: userMini } }, dietician: userMini }
  },
  "yoga-sessions": {
    model: "yogaSession",
    module: "yoga_sessions",
    searchFields: ["title", "description", "sessionType", "category", "liveLink"],
    statusField: "status",
    read: [Role.SUPER_ADMIN, Role.YOGA_TRAINER],
    create: [Role.SUPER_ADMIN, Role.YOGA_TRAINER],
    update: [Role.SUPER_ADMIN, Role.YOGA_TRAINER],
    remove: adminOnly,
    include: { trainer: userMini, assignments: { include: { client: { include: { user: userMini } } } }, recordings: true }
  },
  attendance: {
    model: "sessionAttendance",
    module: "session_attendance",
    searchFields: [],
    statusField: "attendanceStatus",
    read: [Role.SUPER_ADMIN, Role.YOGA_TRAINER],
    create: [Role.SUPER_ADMIN, Role.YOGA_TRAINER],
    update: [Role.SUPER_ADMIN, Role.YOGA_TRAINER],
    remove: adminOnly,
    include: { session: true, client: { include: { user: userMini } } }
  },
  recordings: {
    model: "sessionRecording",
    module: "session_recordings",
    searchFields: ["title", "recordingUrl", "category"],
    statusField: "isPremiumOnly",
    read: [Role.SUPER_ADMIN, Role.YOGA_TRAINER],
    create: [Role.SUPER_ADMIN, Role.YOGA_TRAINER],
    update: [Role.SUPER_ADMIN, Role.YOGA_TRAINER],
    remove: adminOnly,
    include: { session: true, trainer: userMini }
  },
  "support-tickets": {
    model: "supportTicket",
    module: "support_tickets",
    searchFields: ["subject", "description"],
    statusField: "status",
    read: [Role.SUPER_ADMIN, Role.SUPPORT_ADMIN],
    create: [Role.SUPER_ADMIN, Role.SUPPORT_ADMIN],
    update: [Role.SUPER_ADMIN, Role.SUPPORT_ADMIN],
    remove: adminOnly,
    include: { client: { include: { user: userMini } }, assignedSupport: userMini }
  },
  "chat-messages": {
    model: "chatMessage",
    module: "chat_messages",
    searchFields: ["message"],
    statusField: "messageType",
    read: [Role.SUPER_ADMIN, Role.SUPPORT_ADMIN, Role.DIETICIAN],
    create: [Role.SUPER_ADMIN, Role.SUPPORT_ADMIN, Role.DIETICIAN],
    update: adminOnly,
    remove: adminOnly,
    include: { client: { include: { user: userMini } }, sender: userMini, relatedTicket: true }
  },
  notifications: {
    model: "notification",
    module: "notifications",
    searchFields: ["title", "message", "type"],
    statusField: "status",
    read: adminOnly,
    create: adminOnly,
    update: adminOnly,
    remove: adminOnly,
    include: { user: userMini }
  },
  feedback: {
    model: "feedback",
    module: "feedback",
    searchFields: ["comment"],
    statusField: "relatedType",
    read: adminOnly,
    create: adminOnly,
    update: adminOnly,
    remove: adminOnly,
    include: { client: { include: { user: userMini } } }
  },
  "activity-logs": {
    model: "activityLog",
    module: "activity_logs",
    searchFields: ["action", "module", "targetId", "ipAddress"],
    read: adminOnly,
    create: adminOnly,
    update: adminOnly,
    remove: adminOnly,
    include: { user: userMini }
  },
  files: {
    model: "fileAsset",
    module: "files",
    searchFields: ["fileName", "mimeType", "relatedType"],
    read: allStaff,
    create: allStaff,
    update: adminOnly,
    remove: adminOnly,
    include: { uploader: userMini }
  }
};

const enumFields = new Set([
  "role",
  "status",
  "source",
  "paymentStatus",
  "leadStatus",
  "onboardingStatus",
  "mealType",
  "attendanceStatus",
  "priority",
  "channel",
  "relatedType",
  "messageType",
  "subscriptionSource"
]);

const dateFields = new Set([
  "dateOfBirth",
  "lastLoginAt",
  "startDate",
  "endDate",
  "paidAt",
  "nextFollowUpAt",
  "scheduledAt",
  "completedAt",
  "planStartDate",
  "planEndDate",
  "scheduledStart",
  "scheduledEnd",
  "joinedAt",
  "leftAt",
  "resolvedAt"
]);

const normalizeEnum = (value: unknown) =>
  typeof value === "string" ? value.trim().replaceAll("-", "_").replaceAll(" ", "_").toUpperCase() : value;

const normalizeData = (input: Record<string, unknown>) => {
  const data = normalizeEmpty(input) as Record<string, unknown>;
  for (const key of Object.keys(data)) {
    if (enumFields.has(key) && data[key] !== null) data[key] = normalizeEnum(data[key]);
    if (dateFields.has(key) && data[key]) data[key] = new Date(String(data[key]));
  }
  if ("price" in data && data.price !== null) data.price = Number(data.price);
  if ("amount" in data && data.amount !== null) data.amount = Number(data.amount);
  if ("weight" in data && data.weight !== null) data.weight = Number(data.weight);
  return data;
};

const delegateFor = (resource: string) => {
  const config = resources[resource];
  if (!config) throw new AppError(404, `Unknown CRM resource: ${resource}`);
  return { config, delegate: (prisma as unknown as Record<string, any>)[config.model] };
};

const assertRole = (allowed: Role[], role: Role) => {
  if (!allowed.includes(role)) throw new AppError(403, "You do not have access to this resource");
};

const scopeWhere = (resource: string, auth: { id: string; role: Role }) => {
  if (auth.role === Role.SUPER_ADMIN) return {};
  const roleField = {
    [Role.SALES_ADMIN]: "assignedSalesId",
    [Role.YOGA_TRAINER]: "assignedTrainerId",
    [Role.DIETICIAN]: "assignedDieticianId",
    [Role.SUPPORT_ADMIN]: "assignedSupportId"
  } as Partial<Record<Role, string>>;

  switch (resource) {
    case "clients":
      return { [roleField[auth.role] || "id"]: auth.id };
    case "leads":
      return { assignedSalesId: auth.id };
    case "onboarding-calls":
      return { salesAdminId: auth.id };
    case "subscriptions":
    case "payments":
      return { client: { [roleField[auth.role] || "id"]: auth.id } };
    case "diet-plans":
      return { dieticianId: auth.id };
    case "diet-meals":
      return { dietPlan: { dieticianId: auth.id } };
    case "diet-progress":
      return { dieticianId: auth.id };
    case "yoga-sessions":
      return { trainerId: auth.id };
    case "attendance":
      return { session: { trainerId: auth.id } };
    case "recordings":
      return { trainerId: auth.id };
    case "support-tickets":
      return { assignedSupportId: auth.id };
    case "chat-messages":
      return { OR: [{ senderId: auth.id }, { relatedTicket: { assignedSupportId: auth.id } }, { client: { assignedDieticianId: auth.id } }] };
    case "files":
      return { uploadedBy: auth.id };
    default:
      return { id: "__forbidden__" };
  }
};

const buildWhere = (resource: string, config: ResourceConfig, auth: { id: string; role: Role }, query: Record<string, unknown>) => {
  const and: Record<string, unknown>[] = [scopeWhere(resource, auth)];
  const search = String(query.search || "").trim();
  if (search && config.searchFields.length) {
    and.push({
      OR: config.searchFields.map((field) => ({ [field]: { contains: search } }))
    });
  }
  if (config.statusField && query.status && query.status !== "all") {
    const rawStatus = query.status;
    and.push({ [config.statusField]: typeof rawStatus === "string" && rawStatus !== "true" && rawStatus !== "false" ? normalizeEnum(rawStatus) : rawStatus === "true" });
  }
  const directFilters = ["clientId", "userId", "planId", "sessionId", "trainerId", "dieticianId", "assignedSupportId", "assignedSalesId"];
  for (const key of directFilters) {
    if (key === "clientId" && ["yoga-sessions", "recordings"].includes(resource)) continue;
    if (query[key]) and.push({ [key]: query[key] });
  }
  if (query.clientId && resource === "yoga-sessions") {
    and.push({ assignments: { some: { clientId: query.clientId } } });
  }
  if (query.clientId && resource === "recordings") {
    and.push({ session: { assignments: { some: { clientId: query.clientId } } } });
  }
  return and.length ? { AND: and } : {};
};

const queryArgs = (config: ResourceConfig) => (config.select ? { select: config.select } : config.include ? { include: config.include } : {});

const listResource = async (resource: string, auth: { id: string; role: Role }, query: Record<string, unknown>) => {
  const { config, delegate } = delegateFor(resource);
  assertRole(config.read, auth.role);
  const { page, limit, skip } = pagination(String(query.page || "1"), String(query.limit || "10"));
  const where = buildWhere(resource, config, auth, query);
  const [items, total] = await Promise.all([
    delegate.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      ...queryArgs(config)
    }),
    delegate.count({ where })
  ]);
  return { items: stripSensitive(items), meta: { page, limit, total, pages: Math.ceil(total / limit) } };
};

const createUser = async (body: Record<string, unknown>, creatorId: string) => {
  const data = normalizeData(body);
  const generatedTemporaryPassword = String(data.password || generateTemporaryPassword());
  delete data.password;
  const user = await prisma.user.create({
    data: {
      fullName: String(data.fullName),
      email: String(data.email),
      phone: data.phone as string | undefined,
      role: data.role as Role,
      status: (data.status as any) || "ACTIVE",
      profileImage: data.profileImage as string | undefined,
      forcePasswordChange: true,
      createdById: creatorId,
      passwordHash: await hashPassword(generatedTemporaryPassword)
    },
    select: userSelect
  });
  return { user, generatedTemporaryPassword };
};

const createClient = async (body: Record<string, unknown>, creator: { id: string; role: Role }) => {
  const data = normalizeData(body);
  const userInput = (data.user || {}) as Record<string, unknown>;
  delete data.user;
  const generatedTemporaryPassword = String(userInput.password || data.password || generateTemporaryPassword());
  delete data.password;
  delete userInput.password;

  return prisma.$transaction(async (tx) => {
    let userId = data.userId as string | undefined;
    let user = null;
    if (!userId) {
      user = await tx.user.create({
        data: {
          fullName: String(userInput.fullName || data.fullName),
          email: String(userInput.email || data.email),
          phone: (userInput.phone || data.phone) as string | undefined,
          role: Role.CLIENT,
          status: "ACTIVE",
          forcePasswordChange: true,
          createdById: creator.id,
          passwordHash: await hashPassword(generatedTemporaryPassword)
        },
        select: userSelect
      });
      userId = user.id;
    }

    ["fullName", "email", "phone"].forEach((key) => delete data[key]);
    const clientCode = String(data.clientCode || `BF-CL-${Date.now().toString().slice(-7)}`);
    const client = await tx.client.create({
      data: {
        ...data,
        userId,
        clientCode,
        assignedSalesId: (data.assignedSalesId as string | undefined) || (creator.role === Role.SALES_ADMIN ? creator.id : undefined)
      } as Prisma.ClientUncheckedCreateInput,
      include: resources.clients.include
    });

    return { client: stripSensitive(client), user, generatedTemporaryPassword };
  });
};

const createDietPlan = async (body: Record<string, unknown>, auth: { id: string; role: Role }) => {
  const data = normalizeData(body);
  const meals = (data.meals as Record<string, unknown>[] | undefined)?.map(normalizeData) || [];
  delete data.meals;
  if (auth.role === Role.DIETICIAN && !data.dieticianId) data.dieticianId = auth.id;
  const plan = await prisma.dietPlan.create({
    data: {
      ...(data as Prisma.DietPlanUncheckedCreateInput),
      meals: meals.length ? { create: meals as Prisma.DietMealUncheckedCreateWithoutDietPlanInput[] } : undefined
    },
    include: resources["diet-plans"].include
  });

  if (plan.status === "PUBLISHED") {
    const client = await prisma.client.findUnique({ where: { id: plan.clientId }, include: { user: true } });
    if (client) await notifyDietPlanUpdate(client.userId);
  }
  return stripSensitive(plan);
};

const updateDietPlan = async (id: string, body: Record<string, unknown>) => {
  const data = normalizeData(body);
  const meals = (data.meals as Record<string, unknown>[] | undefined)?.map(normalizeData);
  delete data.meals;
  return prisma.$transaction(async (tx) => {
    if (meals) {
      await tx.dietMeal.deleteMany({ where: { dietPlanId: id } });
    }
    const plan = await tx.dietPlan.update({
      where: { id },
      data: {
        ...(data as Prisma.DietPlanUncheckedUpdateInput),
        meals: meals ? { create: meals as Prisma.DietMealUncheckedCreateWithoutDietPlanInput[] } : undefined
      },
      include: resources["diet-plans"].include
    });
    return stripSensitive(plan);
  });
};

const createYogaSession = async (body: Record<string, unknown>, auth: { id: string; role: Role }) => {
  const data = normalizeData(body);
  const assignedClientIds = (data.assignedClientIds as string[] | undefined) || [];
  const assignAllActive = Boolean(data.assignAllActive);
  delete data.assignedClientIds;
  delete data.assignAllActive;
  if (auth.role === Role.YOGA_TRAINER && !data.trainerId) data.trainerId = auth.id;

  return prisma.$transaction(async (tx) => {
    const clients = assignAllActive
      ? await tx.client.findMany({
          where: { subscriptions: { some: { status: "ACTIVE", paymentStatus: "PAID", endDate: { gte: new Date() } } } },
          select: { id: true, user: { select: { phone: true, id: true } } }
        })
      : assignedClientIds.length
        ? await tx.client.findMany({ where: { id: { in: assignedClientIds } }, select: { id: true, user: { select: { phone: true, id: true } } } })
        : [];

    const session = await tx.yogaSession.create({
      data: {
        ...(data as Prisma.YogaSessionUncheckedCreateInput),
        assignments: clients.length
          ? { create: clients.map((client) => ({ clientId: client.id, assignedBy: auth.id })) }
          : undefined
      },
      include: resources["yoga-sessions"].include
    });

    for (const client of clients) {
      await notifyLiveSessionReminder(client.user.id);
      if (client.user.phone && session.liveLink) await sendLiveSessionLink(client.user.phone, session.liveLink, client.user.id);
    }

    return stripSensitive(session);
  });
};

crmRoutes.use(authenticate);

crmRoutes.get(
  "/analytics/overview",
  asyncHandler(async (req, res) => {
    assertRole(allStaff, req.auth!.role);
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const [premiumClients, activeSubscriptions, expiredSubscriptions, onboardingToday, activeTrainers, activeDieticians, openTickets, revenue, recentActivities, leadStatuses, attendance, dietCompliance] = await Promise.all([
      prisma.client.count({ where: { subscriptions: { some: { status: "ACTIVE", paymentStatus: "PAID", endDate: { gte: now } } } } }),
      prisma.subscription.count({ where: { status: "ACTIVE", endDate: { gte: now } } }),
      prisma.subscription.count({ where: { OR: [{ status: "EXPIRED" }, { endDate: { lt: now } }] } }),
      prisma.onboardingCall.count({ where: { scheduledAt: { gte: todayStart, lt: todayEnd } } }),
      prisma.user.count({ where: { role: Role.YOGA_TRAINER, status: "ACTIVE" } }),
      prisma.user.count({ where: { role: Role.DIETICIAN, status: "ACTIVE" } }),
      prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma.payment.aggregate({ where: { paymentStatus: "PAID" }, _sum: { amount: true } }),
      prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: userMini } }),
      prisma.lead.groupBy({ by: ["leadStatus"], _count: { leadStatus: true } }),
      prisma.sessionAttendance.groupBy({ by: ["attendanceStatus"], _count: { attendanceStatus: true } }),
      prisma.dietProgressLog.aggregate({ _avg: { complianceScore: true } })
    ]);

    const revenueSeries = await Promise.all(
      Array.from({ length: 6 }).map(async (_, index) => {
        const month = dayjs().subtract(5 - index, "month");
        const start = month.startOf("month").toDate();
        const end = month.endOf("month").toDate();
        const sum = await prisma.payment.aggregate({ where: { paymentStatus: "PAID", paidAt: { gte: start, lte: end } }, _sum: { amount: true } });
        return { name: month.format("MMM"), revenue: Number(sum._sum.amount || 0) };
      })
    );

    ok(
      res,
      stripSensitive({
        stats: {
          premiumClients,
          activeSubscriptions,
          expiredSubscriptions,
          onboardingToday,
          activeTrainers,
          activeDieticians,
          openTickets,
          revenue: Number(revenue._sum.amount || 0),
          dietCompliance: Math.round(dietCompliance._avg.complianceScore || 0)
        },
        revenueSeries,
        leadStatuses,
        attendance,
        recentActivities
      }),
      "Analytics overview"
    );
  })
);

crmRoutes.post(
  "/payments/order",
  requireRoles(Role.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    created(res, await createPaymentOrder(req.body), "Payment order created");
  })
);

crmRoutes.post(
  "/payments/verify",
  requireRoles(Role.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    ok(res, await verifyRazorpayPayment(req.body), "Payment verified");
  })
);

crmRoutes.post(
  "/payments/webhook",
  asyncHandler(async (req, res) => {
    ok(res, await handleRazorpayWebhook(req.body), "Webhook accepted");
  })
);

crmRoutes.post(
  "/leads/:id/convert",
  requireRoles(Role.SUPER_ADMIN, Role.SALES_ADMIN),
  asyncHandler(async (req, res) => {
    const leadId = routeParam(req.params.id);
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, ...(scopeWhere("leads", req.auth!) as Record<string, unknown>) } as Prisma.LeadWhereInput
    });
    if (!lead) throw new AppError(404, "Lead not found");

    const plan = req.body.planId
      ? await prisma.subscriptionPlan.findUnique({ where: { id: req.body.planId } })
      : await prisma.subscriptionPlan.findFirst({ where: { isActive: true }, orderBy: { createdAt: "desc" } });
    if (!plan) throw new AppError(400, "Create an active subscription plan before converting a lead");

    const temporaryPassword = generateTemporaryPassword();
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: lead.fullName,
          email: lead.email || `${lead.phone}@bhawanifitness.local`,
          phone: lead.phone,
          role: Role.CLIENT,
          status: "ACTIVE",
          forcePasswordChange: true,
          createdById: req.auth!.id,
          passwordHash: await hashPassword(temporaryPassword)
        },
        select: userSelect
      });
      const client = await tx.client.create({
        data: {
          userId: user.id,
          clientCode: `BF-CL-${Date.now().toString().slice(-7)}`,
          healthGoal: lead.healthGoal,
          assignedSalesId: lead.assignedSalesId || req.auth!.id,
          onboardingStatus: "PENDING"
        }
      });
      const subscription = await tx.subscription.create({
        data: {
          clientId: client.id,
          planId: plan.id,
          startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(),
          endDate: req.body.endDate ? new Date(req.body.endDate) : dayjs().add(plan.durationDays, "day").toDate(),
          status: "ACTIVE",
          paymentStatus: "PAID",
          source: "SUPER_ADMIN_MANUAL"
        }
      });
      await tx.lead.update({ where: { id: lead.id }, data: { leadStatus: "CONVERTED" } });
      return { user, client, subscription, temporaryPassword };
    });

    if (lead.phone) await sendSubscriptionConfirmation(lead.phone, result.user.id);
    await writeAuditLog({ userId: req.auth!.id, role: req.auth!.role, action: "LEAD_CONVERTED", module: "leads", targetId: lead.id, ipAddress: req.ip });
    created(res, result, "Lead converted into premium client");
  })
);

crmRoutes.post(
  "/onboarding-calls/:id/remind",
  requireRoles(Role.SUPER_ADMIN, Role.SALES_ADMIN),
  asyncHandler(async (req, res) => {
    const call = await prisma.onboardingCall.findUnique({ where: { id: routeParam(req.params.id) }, include: { client: { include: { user: true } } } }) as any;
    if (!call) throw new AppError(404, "Onboarding call not found");
    const result = call.client.user.phone ? await sendOnboardingCallReminder(call.client.user.phone, call.client.userId) : { delivered: false };
    ok(res, result, "Onboarding reminder processed");
  })
);

crmRoutes.get(
  "/reports/:resource.csv",
  asyncHandler(async (req, res) => {
    const resource = routeParam(req.params.resource);
    const { config, delegate } = delegateFor(resource);
    assertRole(config.read, req.auth!.role);
    const rows = await delegate.findMany({
      where: buildWhere(resource, config, req.auth!, req.query),
      take: 5000,
      orderBy: { createdAt: "desc" },
      ...queryArgs(config)
    });
    res.header("Content-Type", "text/csv");
    res.attachment(`${resource}.csv`);
    res.send(toCsv(stripSensitive(rows) as Record<string, unknown>[]));
  })
);

crmRoutes.get(
  "/:resource",
  asyncHandler(async (req, res) => {
    ok(res, await listResource(routeParam(req.params.resource), req.auth!, req.query), "Resource list");
  })
);

crmRoutes.get(
  "/:resource/:id",
  asyncHandler(async (req, res) => {
    const resource = routeParam(req.params.resource);
    const id = routeParam(req.params.id);
    const { config, delegate } = delegateFor(resource);
    assertRole(config.read, req.auth!.role);
    const item = await delegate.findFirst({
      where: { AND: [{ id }, scopeWhere(resource, req.auth!) ] },
      ...queryArgs(config)
    });
    if (!item) throw new AppError(404, "Resource not found");
    ok(res, stripSensitive(item), "Resource detail");
  })
);

crmRoutes.post(
  "/:resource",
  asyncHandler(async (req, res) => {
    const resource = routeParam(req.params.resource);
    const { config, delegate } = delegateFor(resource);
    assertRole(config.create, req.auth!.role);
    let payload: unknown;
    if (resource === "users") {
      payload = await createUser(req.body, req.auth!.id);
    } else if (resource === "clients") {
      payload = await createClient(req.body, req.auth!);
    } else if (resource === "diet-plans") {
      payload = await createDietPlan(req.body, req.auth!);
    } else if (resource === "yoga-sessions") {
      payload = await createYogaSession(req.body, req.auth!);
    } else {
      const data = normalizeData(req.body);
      if (resource === "leads" && req.auth!.role === Role.SALES_ADMIN && !data.assignedSalesId) data.assignedSalesId = req.auth!.id;
      if (resource === "support-tickets" && req.auth!.role === Role.SUPPORT_ADMIN && !data.assignedSupportId) data.assignedSupportId = req.auth!.id;
      payload = await delegate.create({ data, ...queryArgs(config) });
    }
    await writeAuditLog({ userId: req.auth!.id, role: req.auth!.role, action: "CREATE", module: config.module, ipAddress: req.ip });
    created(res, stripSensitive(payload), "Resource created");
  })
);

crmRoutes.patch(
  "/:resource/:id",
  asyncHandler(async (req, res) => {
    const resource = routeParam(req.params.resource);
    const id = routeParam(req.params.id);
    const { config, delegate } = delegateFor(resource);
    assertRole(config.update, req.auth!.role);
    const existing = await delegate.findFirst({ where: { AND: [{ id }, scopeWhere(resource, req.auth!)] } });
    if (!existing) throw new AppError(404, "Resource not found");
    const data = normalizeData(req.body);
    if (resource === "users" && data.password) {
      data.passwordHash = await hashPassword(String(data.password));
      delete data.password;
      data.forcePasswordChange = true;
    }
    const payload = resource === "diet-plans"
      ? await updateDietPlan(id, req.body)
      : await delegate.update({ where: { id }, data, ...queryArgs(config) });
    await writeAuditLog({ userId: req.auth!.id, role: req.auth!.role, action: "UPDATE", module: config.module, targetId: id, ipAddress: req.ip, metadata: req.body });
    ok(res, stripSensitive(payload), "Resource updated");
  })
);

crmRoutes.delete(
  "/:resource/:id",
  asyncHandler(async (req, res) => {
    const resource = routeParam(req.params.resource);
    const id = routeParam(req.params.id);
    const { config, delegate } = delegateFor(resource);
    assertRole(config.remove, req.auth!.role);
    const existing = await delegate.findFirst({ where: { AND: [{ id }, scopeWhere(resource, req.auth!)] } });
    if (!existing) throw new AppError(404, "Resource not found");
    await delegate.delete({ where: { id } });
    await writeAuditLog({ userId: req.auth!.id, role: req.auth!.role, action: "DELETE", module: config.module, targetId: id, ipAddress: req.ip });
    ok(res, { deleted: true }, "Resource deleted");
  })
);
