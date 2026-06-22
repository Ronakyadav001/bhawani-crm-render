import { Role, TicketPriority, TicketSource, TicketStatus } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../config/prisma";

const fallbackText = "I have created a support ticket so the Bhawani Fitness team can help you personally.";

export const answerOrEscalateSupportQuery = async (input: {
  clientId: string;
  userId: string;
  message: string;
}) => {
  const userMessage = await prisma.chatMessage.create({
    data: {
      clientId: input.clientId,
      senderId: input.userId,
      senderRole: Role.CLIENT,
      message: input.message
    }
  });
  const canAttemptAi = Boolean(env.OPENAI_API_KEY || env.GROQ_API_KEY);
  const answer = canAttemptAi
    ? "Thanks for sharing this. Please follow your current plan and avoid sudden routine changes until your care team reviews it."
    : null;

  if (answer) {
    const chat = await prisma.chatMessage.create({
      data: {
        clientId: input.clientId,
        senderRole: Role.SUPPORT_ADMIN,
        message: answer,
        aiGenerated: true
      }
    });
    return { answeredByAi: true, message: userMessage, aiMessage: chat };
  }

  const support = await prisma.user.findFirst({ where: { role: Role.SUPPORT_ADMIN, status: "ACTIVE" } });
  const ticket = await prisma.supportTicket.create({
    data: {
      clientId: input.clientId,
      assignedSupportId: support?.id,
      subject: "AI escalated app chat",
      description: input.message,
      priority: TicketPriority.MEDIUM,
      status: TicketStatus.OPEN,
      source: TicketSource.AI_ESCALATION
    }
  });
  await prisma.chatMessage.update({
    where: { id: userMessage.id },
    data: {
      relatedTicketId: ticket.id
    }
  });
  const system = await prisma.chatMessage.create({
    data: {
      clientId: input.clientId,
      senderRole: Role.SUPPORT_ADMIN,
      message: fallbackText,
      relatedTicketId: ticket.id,
      aiGenerated: true
    }
  });

  return { answeredByAi: false, ticket, message: userMessage, systemMessage: system };
};
