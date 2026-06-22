import type { PageRoute, Role } from "../types";

export const roles = {
  super: ["SUPER_ADMIN"] as Role[],
  sales: ["SALES_ADMIN"] as Role[],
  trainer: ["YOGA_TRAINER"] as Role[],
  dietician: ["DIETICIAN"] as Role[],
  support: ["SUPPORT_ADMIN"] as Role[]
};

export const pageRoutes: PageRoute[] = [
  { path: "/super-admin/dashboard", label: "Dashboard", icon: "LayoutDashboard", roles: roles.super, kind: "dashboard" },
  { path: "/super-admin/users", label: "Users", icon: "Users", roles: roles.super, kind: "resource", resource: "users", statusOptions: ["ACTIVE", "INACTIVE", "SUSPENDED"] },
  { path: "/super-admin/clients", label: "Clients", icon: "HeartPulse", roles: roles.super, kind: "resource", resource: "clients", statusOptions: ["PENDING", "SCHEDULED", "COMPLETED", "MISSED"] },
  { path: "/super-admin/clients/:id", label: "Client Profile", icon: "UserRound", roles: roles.super, kind: "client-profile", resource: "clients" },
  { path: "/super-admin/leads", label: "Leads", icon: "Megaphone", roles: roles.super, kind: "resource", resource: "leads", statusOptions: ["NEW", "CONTACTED", "FOLLOW_UP", "CONVERTED", "LOST"] },
  { path: "/super-admin/subscriptions", label: "Subscriptions", icon: "BadgeIndianRupee", roles: roles.super, kind: "resource", resource: "subscriptions", statusOptions: ["ACTIVE", "EXPIRED", "CANCELLED", "PENDING"] },
  { path: "/super-admin/payments", label: "Payments", icon: "ReceiptIndianRupee", roles: roles.super, kind: "resource", resource: "payments", statusOptions: ["PENDING", "PAID", "FAILED", "REFUNDED"] },
  { path: "/super-admin/onboarding", label: "Onboarding", icon: "CalendarClock", roles: roles.super, kind: "resource", resource: "onboarding-calls", statusOptions: ["SCHEDULED", "COMPLETED", "MISSED", "RESCHEDULED", "CANCELLED"] },
  { path: "/super-admin/diet-plans", label: "Diet Plans", icon: "Salad", roles: roles.super, kind: "resource", resource: "diet-plans", statusOptions: ["DRAFT", "PUBLISHED", "ARCHIVED"] },
  { path: "/super-admin/yoga-sessions", label: "Yoga Sessions", icon: "Flower2", roles: roles.super, kind: "resource", resource: "yoga-sessions", statusOptions: ["SCHEDULED", "LIVE", "COMPLETED", "CANCELLED"] },
  { path: "/super-admin/recordings", label: "Recordings", icon: "Video", roles: roles.super, kind: "resource", resource: "recordings" },
  { path: "/super-admin/support", label: "Support", icon: "MessagesSquare", roles: roles.super, kind: "resource", resource: "support-tickets", statusOptions: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] },
  { path: "/super-admin/analytics", label: "Analytics", icon: "ChartSpline", roles: roles.super, kind: "analytics" },
  { path: "/super-admin/activity-logs", label: "Activity Logs", icon: "History", roles: roles.super, kind: "resource", resource: "activity-logs" },
  { path: "/sales/dashboard", label: "Dashboard", icon: "LayoutDashboard", roles: roles.sales, kind: "dashboard" },
  { path: "/sales/leads", label: "Leads", icon: "Megaphone", roles: roles.sales, kind: "resource", resource: "leads", statusOptions: ["NEW", "CONTACTED", "FOLLOW_UP", "CONVERTED", "LOST"] },
  { path: "/sales/onboarding", label: "Onboarding", icon: "CalendarClock", roles: roles.sales, kind: "resource", resource: "onboarding-calls", statusOptions: ["SCHEDULED", "COMPLETED", "MISSED", "RESCHEDULED", "CANCELLED"] },
  { path: "/sales/clients", label: "Clients", icon: "HeartPulse", roles: roles.sales, kind: "resource", resource: "clients", statusOptions: ["PENDING", "SCHEDULED", "COMPLETED", "MISSED"] },
  { path: "/trainer/dashboard", label: "Dashboard", icon: "LayoutDashboard", roles: roles.trainer, kind: "dashboard" },
  { path: "/trainer/sessions", label: "Sessions", icon: "Flower2", roles: roles.trainer, kind: "resource", resource: "yoga-sessions", statusOptions: ["SCHEDULED", "LIVE", "COMPLETED", "CANCELLED"] },
  { path: "/trainer/clients", label: "Clients", icon: "HeartPulse", roles: roles.trainer, kind: "resource", resource: "clients" },
  { path: "/trainer/attendance", label: "Attendance", icon: "ClipboardCheck", roles: roles.trainer, kind: "resource", resource: "attendance", statusOptions: ["JOINED", "MISSED", "PARTIAL"] },
  { path: "/trainer/recordings", label: "Recordings", icon: "Video", roles: roles.trainer, kind: "resource", resource: "recordings" },
  { path: "/dietician/dashboard", label: "Dashboard", icon: "LayoutDashboard", roles: roles.dietician, kind: "dashboard" },
  { path: "/dietician/clients", label: "Clients", icon: "HeartPulse", roles: roles.dietician, kind: "resource", resource: "clients" },
  { path: "/dietician/diet-plans", label: "Diet Plans", icon: "Salad", roles: roles.dietician, kind: "resource", resource: "diet-plans", statusOptions: ["DRAFT", "PUBLISHED", "ARCHIVED"] },
  { path: "/dietician/progress", label: "Progress", icon: "LineChart", roles: roles.dietician, kind: "resource", resource: "diet-progress" },
  { path: "/dietician/chat", label: "Chat", icon: "MessagesSquare", roles: roles.dietician, kind: "resource", resource: "chat-messages" },
  { path: "/support/dashboard", label: "Dashboard", icon: "LayoutDashboard", roles: roles.support, kind: "dashboard" },
  { path: "/support/tickets", label: "Tickets", icon: "TicketCheck", roles: roles.support, kind: "resource", resource: "support-tickets", statusOptions: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] },
  { path: "/support/chats", label: "Chats", icon: "MessagesSquare", roles: roles.support, kind: "resource", resource: "chat-messages" },
  { path: "/support/history", label: "History", icon: "History", roles: roles.support, kind: "resource", resource: "support-tickets", statusOptions: ["RESOLVED", "CLOSED"] }
];

export const visibleRoutesFor = (role?: Role | null) =>
  pageRoutes.filter((route) => role && route.roles.includes(role) && !route.path.includes(":"));
