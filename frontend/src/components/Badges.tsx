import type { Role } from "../types";
import { cn } from "../utils/cn";
import { titleCase } from "../utils/format";

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-sage text-deep border-sage2",
  PAID: "bg-sage text-deep border-sage2",
  PUBLISHED: "bg-sage text-deep border-sage2",
  LIVE: "bg-sage text-deep border-sage2",
  OPEN: "bg-[#fff2d8] text-[#8a5f12] border-[#e8c46c]",
  PENDING: "bg-[#fff2d8] text-[#8a5f12] border-[#e8c46c]",
  FOLLOW_UP: "bg-[#fff2d8] text-[#8a5f12] border-[#e8c46c]",
  IN_PROGRESS: "bg-[#f3e1d8] text-clay border-[#d6a58f]",
  SCHEDULED: "bg-[#eef5e9] text-moss border-sage2",
  COMPLETED: "bg-sage text-deep border-sage2",
  CONVERTED: "bg-sage text-deep border-sage2",
  RESOLVED: "bg-sage text-deep border-sage2",
  CLOSED: "bg-cream2 text-muted border-line",
  EXPIRED: "bg-[#f3e1d8] text-clay border-[#d6a58f]",
  CANCELLED: "bg-[#f3e1d8] text-clay border-[#d6a58f]",
  SUSPENDED: "bg-[#f3e1d8] text-clay border-[#d6a58f]",
  FAILED: "bg-[#f3e1d8] text-clay border-[#d6a58f]",
  MISSED: "bg-[#f3e1d8] text-clay border-[#d6a58f]",
  URGENT: "bg-[#f3e1d8] text-clay border-[#d6a58f]"
};

export function StatusBadge({ value }: { value?: unknown }) {
  const status = String(value || "-").toUpperCase();
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", statusStyles[status] || "border-line bg-soft text-muted")}>
      {titleCase(status)}
    </span>
  );
}

export function RoleBadge({ role }: { role?: Role | string }) {
  return (
    <span className="inline-flex rounded-full border border-sage2 bg-sage px-3 py-1 text-xs font-bold text-deep">
      {titleCase(String(role || "guest"))}
    </span>
  );
}
