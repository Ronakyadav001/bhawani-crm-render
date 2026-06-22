import { PrismaClient, Role, UserStatus, SubscriptionStatus, PaymentStatus, LeadStatus, LeadSource, DietPlanStatus, MealType, YogaSessionStatus, TicketPriority, TicketStatus } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";
import dayjs from "dayjs";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed Bhawani Fitness CRM");
}

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL)
});

const hash = (password: string) => bcrypt.hash(password, 12);

async function upsertUser(input: {
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  password: string;
}) {
  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      fullName: input.fullName,
      phone: input.phone,
      role: input.role,
      status: UserStatus.ACTIVE,
      forcePasswordChange: false,
      passwordHash: await hash(input.password)
    },
    create: {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      role: input.role,
      status: UserStatus.ACTIVE,
      forcePasswordChange: false,
      passwordHash: await hash(input.password)
    }
  });
}

async function main() {
  const admin = await upsertUser({
    fullName: "Bhawani Fitness Super Admin",
    email: "admin@bhawanifitness.com",
    phone: "9000000001",
    role: Role.SUPER_ADMIN,
    password: "Admin@12345"
  });

  const sales = await upsertUser({
    fullName: "Aarohi Sales",
    email: "sales@bhawanifitness.com",
    phone: "9000000002",
    role: Role.SALES_ADMIN,
    password: "Sales@12345"
  });

  const trainer = await upsertUser({
    fullName: "Meera Yoga Trainer",
    email: "trainer@bhawanifitness.com",
    phone: "9000000003",
    role: Role.YOGA_TRAINER,
    password: "Trainer@12345"
  });

  const dietician = await upsertUser({
    fullName: "Dr Kavya Dietician",
    email: "dietician@bhawanifitness.com",
    phone: "9000000004",
    role: Role.DIETICIAN,
    password: "Diet@12345"
  });

  const support = await upsertUser({
    fullName: "Nisha Support",
    email: "support@bhawanifitness.com",
    phone: "9000000005",
    role: Role.SUPPORT_ADMIN,
    password: "Support@12345"
  });

  const clientUser = await upsertUser({
    fullName: "Priya Sharma",
    email: "client@bhawanifitness.com",
    phone: "9000000006",
    role: Role.CLIENT,
    password: "Client@12345"
  });

  const client = await prisma.client.upsert({
    where: { userId: clientUser.id },
    update: {
      assignedSalesId: sales.id,
      assignedTrainerId: trainer.id,
      assignedDieticianId: dietician.id,
      assignedSupportId: support.id,
      onboardingStatus: "COMPLETED"
    },
    create: {
      userId: clientUser.id,
      clientCode: "BF-CL-1001",
      gender: "Female",
      age: 32,
      city: "Raipur",
      state: "Chhattisgarh",
      country: "India",
      maritalStatus: "Married",
      healthGoal: "Fertility wellness and hormonal balance",
      fertilityStatus: "Planning",
      medicalConditions: ["thyroid watch"],
      notes: "Premium client seeking guided yoga and diet support.",
      assignedSalesId: sales.id,
      assignedTrainerId: trainer.id,
      assignedDieticianId: dietician.id,
      assignedSupportId: support.id,
      onboardingStatus: "COMPLETED"
    }
  });

  const plan = await prisma.subscriptionPlan.upsert({
    where: { id: "seed-premium-plan" },
    update: {},
    create: {
      id: "seed-premium-plan",
      name: "Premium Wellness 90",
      durationDays: 90,
      price: 24999,
      description: "Yoga, dietician support, live sessions, recordings, and holistic tracking.",
      yogaSessionsIncluded: 36,
      dieticianSupportIncluded: true,
      liveClassesIncluded: true,
      recordingAccess: true
    }
  });

  const subscription = await prisma.subscription.upsert({
    where: { id: "seed-subscription" },
    update: {
      status: SubscriptionStatus.ACTIVE,
      paymentStatus: PaymentStatus.PAID
    },
    create: {
      id: "seed-subscription",
      clientId: client.id,
      planId: plan.id,
      startDate: dayjs().subtract(7, "day").toDate(),
      endDate: dayjs().add(83, "day").toDate(),
      status: SubscriptionStatus.ACTIVE,
      paymentStatus: PaymentStatus.PAID,
      source: "SUPER_ADMIN_MANUAL"
    }
  });

  await prisma.payment.upsert({
    where: { id: "seed-payment" },
    update: {},
    create: {
      id: "seed-payment",
      clientId: client.id,
      subscriptionId: subscription.id,
      amount: 24999,
      currency: "INR",
      paymentGateway: "razorpay",
      transactionId: "rzp_seed_001",
      paymentStatus: PaymentStatus.PAID,
      paidAt: new Date()
    }
  });

  await prisma.lead.upsert({
    where: { id: "seed-lead" },
    update: {},
    create: {
      id: "seed-lead",
      fullName: "Ananya Verma",
      phone: "9000000007",
      email: "ananya@example.com",
      source: LeadSource.INSTAGRAM,
      healthGoal: "Pregnancy yoga",
      leadStatus: LeadStatus.FOLLOW_UP,
      assignedSalesId: sales.id,
      notes: "Interested in trimester-safe sessions.",
      nextFollowUpAt: dayjs().add(1, "day").toDate()
    }
  });

  await prisma.onboardingCall.upsert({
    where: { id: "seed-onboarding" },
    update: {},
    create: {
      id: "seed-onboarding",
      clientId: client.id,
      salesAdminId: sales.id,
      scheduledAt: dayjs().add(2, "hour").toDate(),
      callType: "Video consultation",
      callLink: "https://meet.google.com/bhawani-seed",
      status: "SCHEDULED",
      notes: "Confirm goals and program cadence."
    }
  });

  const dietPlan = await prisma.dietPlan.upsert({
    where: { id: "seed-diet-plan" },
    update: {},
    create: {
      id: "seed-diet-plan",
      clientId: client.id,
      dieticianId: dietician.id,
      title: "Hormone Balance Starter Plan",
      goal: "Stable energy and fertility support",
      planStartDate: dayjs().toDate(),
      planEndDate: dayjs().add(14, "day").toDate(),
      status: DietPlanStatus.PUBLISHED,
      notes: "Anti-inflammatory vegetarian routine."
    }
  });

  await prisma.dietMeal.deleteMany({ where: { dietPlanId: dietPlan.id } });
  await prisma.dietMeal.createMany({
    data: [
      {
        dietPlanId: dietPlan.id,
        mealType: MealType.MORNING,
        mealTime: "06:30",
        foodItems: "Warm lemon water, soaked almonds",
        calories: 120,
        protein: 4,
        carbs: 8,
        fats: 8,
        instructions: "Drink before pranayama."
      },
      {
        dietPlanId: dietPlan.id,
        mealType: MealType.LUNCH,
        mealTime: "13:00",
        foodItems: "Millet roti, dal, sauteed greens, curd",
        calories: 520,
        protein: 24,
        carbs: 68,
        fats: 14,
        instructions: "Keep spices mild."
      }
    ]
  });

  await prisma.dietProgressLog.upsert({
    where: { id: "seed-progress" },
    update: {},
    create: {
      id: "seed-progress",
      clientId: client.id,
      dieticianId: dietician.id,
      weight: 61.4,
      measurements: { waist: 31, hip: 38 },
      energyLevel: 8,
      sleepQuality: 7,
      complianceScore: 86,
      notes: "Energy improved after meal timing change."
    }
  });

  const session = await prisma.yogaSession.upsert({
    where: { id: "seed-session" },
    update: {},
    create: {
      id: "seed-session",
      trainerId: trainer.id,
      title: "Fertility Flow and Breathwork",
      description: "Gentle sequence with breathwork and restorative cooldown.",
      sessionType: "Live class",
      category: "Fertility Yoga",
      scheduledStart: dayjs().add(1, "day").hour(7).minute(0).second(0).toDate(),
      scheduledEnd: dayjs().add(1, "day").hour(8).minute(0).second(0).toDate(),
      liveLink: "https://zoom.us/j/bhawani-seed",
      status: YogaSessionStatus.SCHEDULED
    }
  });

  await prisma.sessionAssignment.upsert({
    where: { sessionId_clientId: { sessionId: session.id, clientId: client.id } },
    update: {},
    create: { sessionId: session.id, clientId: client.id, assignedBy: admin.id }
  });

  await prisma.sessionRecording.upsert({
    where: { id: "seed-recording" },
    update: {},
    create: {
      id: "seed-recording",
      sessionId: session.id,
      trainerId: trainer.id,
      title: "Breathwork Basics",
      recordingUrl: "https://cdn.example.com/bhawani/breathwork-basics.mp4",
      thumbnailUrl: "https://cdn.example.com/bhawani/breathwork-basics.jpg",
      category: "Breathwork",
      isPremiumOnly: true
    }
  });

  const ticket = await prisma.supportTicket.upsert({
    where: { id: "seed-ticket" },
    update: {},
    create: {
      id: "seed-ticket",
      clientId: client.id,
      assignedSupportId: support.id,
      subject: "Need help with live session reminder",
      description: "Client wants reminders on WhatsApp and push.",
      priority: TicketPriority.MEDIUM,
      status: TicketStatus.OPEN,
      source: "APP_CHAT"
    }
  });

  await prisma.chatMessage.create({
    data: {
      clientId: client.id,
      senderId: clientUser.id,
      senderRole: Role.CLIENT,
      message: "Can I receive both app and WhatsApp reminders?",
      relatedTicketId: ticket.id
    }
  });

  await prisma.notification.create({
    data: {
      userId: clientUser.id,
      title: "Welcome to Bhawani Premium",
      message: "Your premium plan is active and your care team is assigned.",
      type: "subscription_confirmation",
      channel: "IN_APP",
      status: "SENT"
    }
  });

  await prisma.activityLog.create({
    data: {
      userId: admin.id,
      role: Role.SUPER_ADMIN,
      action: "SEED_DATA_CREATED",
      module: "system",
      metadata: { seed: true }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
