import { useQuery } from "@tanstack/react-query";
import { CalendarClock, HeartPulse, IndianRupee, MessagesSquare, Salad, Users } from "lucide-react";
import type { PageRoute } from "../types";
import { api, unwrap } from "../api/client";
import { AnalyticsChart, ActivityTimeline, StatCard } from "../components/DashboardWidgets";
import { money } from "../utils/format";

type Analytics = {
  stats: Record<string, number>;
  revenueSeries: Record<string, unknown>[];
  recentActivities: Record<string, unknown>[];
};

export function DashboardPage({ route }: { route: PageRoute }) {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: async () => unwrap<Analytics>(await api.get("/crm/analytics/overview"))
  });
  const stats = data?.stats || {};

  return (
    <div className="space-y-5">
      <div className="glass-panel rounded-crm p-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.12em] text-muted">{route.label}</div>
            <h2 className="mt-1 text-3xl font-black text-deep">Premium care operations</h2>
          </div>
          <div className="text-sm font-semibold text-muted">{isLoading ? "Syncing" : "Live CRM snapshot"}</div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Premium clients" value={stats.premiumClients || 0} icon={<HeartPulse size={20} />} />
        <StatCard label="Active subscriptions" value={stats.activeSubscriptions || 0} icon={<Users size={20} />} />
        <StatCard label="Today onboarding" value={stats.onboardingToday || 0} icon={<CalendarClock size={20} />} tone="gold" />
        <StatCard label="Open tickets" value={stats.openTickets || 0} icon={<MessagesSquare size={20} />} tone="clay" />
        <StatCard label="Revenue" value={money(stats.revenue || 0)} icon={<IndianRupee size={20} />} />
        <StatCard label="Active trainers" value={stats.activeTrainers || 0} icon={<Users size={20} />} />
        <StatCard label="Active dieticians" value={stats.activeDieticians || 0} icon={<Salad size={20} />} />
        <StatCard label="Diet compliance" value={`${stats.dietCompliance || 0}%`} icon={<Salad size={20} />} tone="gold" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
        <AnalyticsChart data={data?.revenueSeries || []} />
        <ActivityTimeline items={data?.recentActivities || []} />
      </div>
    </div>
  );
}
