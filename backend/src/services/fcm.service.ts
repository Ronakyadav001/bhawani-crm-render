import { NotificationChannel, NotificationStatus } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../config/prisma";

type PushInput = {
  userId: string;
  title: string;
  message: string;
  type: string;
  token?: string;
  data?: Record<string, string>;
};

export const sendPushNotification = async (input: PushInput) => {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      channel: NotificationChannel.PUSH,
      status: env.FCM_SERVER_KEY ? NotificationStatus.PENDING : NotificationStatus.FAILED
    }
  });

  if (!env.FCM_SERVER_KEY || !input.token) {
    return { notification, delivered: false, reason: "FCM key or device token missing" };
  }

  const response = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      Authorization: `key=${env.FCM_SERVER_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      to: input.token,
      notification: { title: input.title, body: input.message },
      data: input.data
    })
  });

  await prisma.notification.update({
    where: { id: notification.id },
    data: { status: response.ok ? NotificationStatus.SENT : NotificationStatus.FAILED }
  });

  return { notification, delivered: response.ok };
};

export const notifySubscriptionConfirmation = (userId: string) =>
  sendPushNotification({
    userId,
    title: "Premium subscription active",
    message: "Your Bhawani Fitness premium access is ready.",
    type: "subscription_confirmation"
  });

export const notifyOnboardingReminder = (userId: string) =>
  sendPushNotification({
    userId,
    title: "Onboarding call reminder",
    message: "Your wellness onboarding call is coming up.",
    type: "onboarding_reminder"
  });

export const notifyLiveSessionReminder = (userId: string) =>
  sendPushNotification({
    userId,
    title: "Live session reminder",
    message: "Your live wellness session starts soon.",
    type: "live_session_reminder"
  });

export const notifyDietPlanUpdate = (userId: string) =>
  sendPushNotification({
    userId,
    title: "Diet plan updated",
    message: "Your dietician has published an updated plan.",
    type: "diet_plan_update"
  });

export const notifySupportTicketResponse = (userId: string) =>
  sendPushNotification({
    userId,
    title: "Support replied",
    message: "Your support ticket has a new response.",
    type: "support_ticket_response"
  });
