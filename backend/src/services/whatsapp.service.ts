import { NotificationChannel, NotificationStatus } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../config/prisma";

type WhatsAppInput = {
  userId?: string;
  to: string;
  message: string;
  type: string;
};

export const sendWhatsAppMessage = async (input: WhatsAppInput) => {
  const notification = input.userId
    ? await prisma.notification.create({
        data: {
          userId: input.userId,
          title: "WhatsApp update",
          message: input.message,
          type: input.type,
          channel: NotificationChannel.WHATSAPP,
          status: env.WHATSAPP_TOKEN ? NotificationStatus.PENDING : NotificationStatus.FAILED
        }
      })
    : null;

  if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    return { delivered: false, notification, reason: "WhatsApp credentials missing" };
  }

  const response = await fetch(`${env.WHATSAPP_API_URL}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: input.to,
      type: "text",
      text: { body: input.message }
    })
  });

  if (notification) {
    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: response.ok ? NotificationStatus.SENT : NotificationStatus.FAILED }
    });
  }

  return { delivered: response.ok, notification };
};

export const sendSubscriptionConfirmation = (to: string, userId?: string) =>
  sendWhatsAppMessage({ to, userId, type: "subscription_confirmation", message: "Your Bhawani Fitness premium subscription is active." });

export const sendOnboardingCallReminder = (to: string, userId?: string) =>
  sendWhatsAppMessage({ to, userId, type: "onboarding_reminder", message: "Reminder: your Bhawani Fitness onboarding call is scheduled soon." });

export const sendLiveSessionLink = (to: string, link: string, userId?: string) =>
  sendWhatsAppMessage({ to, userId, type: "live_session_link", message: `Your live yoga session link: ${link}` });

export const sendMissedSessionReminder = (to: string, userId?: string) =>
  sendWhatsAppMessage({ to, userId, type: "missed_session", message: "We missed you in today's session. Your trainer can help you catch up." });

export const sendSupportUpdate = (to: string, userId?: string) =>
  sendWhatsAppMessage({ to, userId, type: "support_update", message: "Your Bhawani Fitness support ticket has been updated." });
