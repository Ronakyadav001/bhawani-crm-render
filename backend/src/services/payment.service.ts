import crypto from "crypto";
import Razorpay from "razorpay";
import { PaymentStatus, SubscriptionStatus } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/http";

const razorpay = env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET
  ? new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET })
  : null;

export const createPaymentOrder = async (input: {
  clientId: string;
  subscriptionId?: string;
  amount: number;
  currency?: string;
}) => {
  const payment = await prisma.payment.create({
    data: {
      clientId: input.clientId,
      subscriptionId: input.subscriptionId,
      amount: input.amount,
      currency: input.currency || "INR",
      paymentGateway: "razorpay",
      paymentStatus: PaymentStatus.PENDING
    }
  });

  if (!razorpay) {
    return { payment, order: null, reason: "Razorpay credentials missing" };
  }

  const order = await razorpay.orders.create({
    amount: Math.round(input.amount * 100),
    currency: input.currency || "INR",
    receipt: payment.id
  });

  return { payment, order };
};

export const verifyRazorpayPayment = async (input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  paymentId: string;
}) => {
  if (!env.RAZORPAY_KEY_SECRET) throw new AppError(500, "Razorpay secret is not configured");
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
    .digest("hex");

  if (expected !== input.razorpaySignature) throw new AppError(400, "Invalid payment signature");

  const payment = await prisma.payment.update({
    where: { id: input.paymentId },
    data: {
      transactionId: input.razorpayPaymentId,
      paymentStatus: PaymentStatus.PAID,
      paidAt: new Date()
    }
  });

  if (payment.subscriptionId) {
    await prisma.subscription.update({
      where: { id: payment.subscriptionId },
      data: { status: SubscriptionStatus.ACTIVE, paymentStatus: PaymentStatus.PAID }
    });
  }

  return payment;
};

export const handleRazorpayWebhook = async (payload: unknown) => {
  return { accepted: true, payload };
};
