import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { crmDetail, crmList } from "../api/client";
import { DataTable } from "../components/DataTools";
import { StatusBadge } from "../components/Badges";
import { dateTime } from "../utils/format";

const panels = [
  ["subscriptions", "Subscription Status"],
  ["payments", "Payment History"],
  ["onboarding-calls", "Onboarding Calls"],
  ["diet-plans", "Diet Plan History"],
  ["diet-progress", "Progress Logs"],
  ["attendance", "Attendance"],
  ["support-tickets", "Support Tickets"],
  ["chat-messages", "Chat History"],
  ["feedback", "Feedback"]
] as const;

export function ClientProfilePage() {
  const { id } = useParams();
  const client = useQuery({
    queryKey: ["client-profile", id],
    queryFn: () => crmDetail<Record<string, any>>("clients", id!)
  });
  const histories = useQuery({
    queryKey: ["client-profile-histories", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const entries = await Promise.all(
        panels.map(async ([resource, label]) => {
          const result = await crmList<Record<string, unknown>>(resource, { clientId: id, limit: 5, page: 1 });
          return [label, result.items] as const;
        })
      );
      return entries;
    }
  });

  const data = client.data;

  return (
    <div className="space-y-5">
      <div className="glass-panel rounded-crm p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.12em] text-muted">Client 360 Profile</div>
            <h2 className="mt-1 text-3xl font-black text-deep">{data?.user?.fullName || "Client"}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge value={data?.onboardingStatus} />
              <StatusBadge value={data?.user?.status} />
            </div>
          </div>
          <div className="grid gap-2 text-sm text-muted sm:grid-cols-2 lg:min-w-[520px]">
            <div className="rounded-crm border border-line bg-soft p-3"><b className="text-ink">Email:</b> {data?.user?.email || "-"}</div>
            <div className="rounded-crm border border-line bg-soft p-3"><b className="text-ink">Phone:</b> {data?.user?.phone || "-"}</div>
            <div className="rounded-crm border border-line bg-soft p-3"><b className="text-ink">Client code:</b> {data?.clientCode || "-"}</div>
            <div className="rounded-crm border border-line bg-soft p-3"><b className="text-ink">Created:</b> {dateTime(data?.createdAt)}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard title="Health Goal" value={data?.healthGoal} />
        <InfoCard title="Fertility Status" value={data?.fertilityStatus} />
        <InfoCard title="City" value={[data?.city, data?.state].filter(Boolean).join(", ")} />
        <InfoCard title="Assigned Team" value={[data?.assignedSales?.fullName, data?.assignedTrainer?.fullName, data?.assignedDietician?.fullName, data?.assignedSupport?.fullName].filter(Boolean).join(", ")} />
      </div>

      <div className="grid gap-5">
        {histories.data?.map(([label, rows]) => (
          <section key={label} className="space-y-3">
            <h3 className="text-xl font-black text-deep">{label}</h3>
            <DataTable rows={rows} />
          </section>
        ))}
      </div>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value?: unknown }) {
  return (
    <div className="glass-panel rounded-crm p-4">
      <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted">{title}</div>
      <div className="mt-2 min-h-10 text-lg font-black text-deep">{String(value || "-")}</div>
    </div>
  );
}
