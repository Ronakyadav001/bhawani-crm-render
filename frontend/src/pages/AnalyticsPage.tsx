import { useQuery } from "@tanstack/react-query";
import type { PageRoute } from "../types";
import { api, unwrap } from "../api/client";
import { AnalyticsChart, StatCard } from "../components/DashboardWidgets";
import { money } from "../utils/format";

export function AnalyticsPage({ route }: { route: PageRoute }) {
  const { data } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: async () => unwrap<any>(await api.get("/crm/analytics/overview"))
  });
  const stats = data?.stats || {};
  const leadData = (data?.leadStatuses || []).map((row: any) => ({ name: row.leadStatus, value: row._count.leadStatus }));
  const attendanceData = (data?.attendance || []).map((row: any) => ({ name: row.attendanceStatus, value: row._count.attendanceStatus }));

  return (
    <div className="space-y-5">
      <div className="glass-panel rounded-crm p-5">
        <div className="text-sm font-bold uppercase tracking-[0.12em] text-muted">{route.label}</div>
        <h2 className="mt-1 text-3xl font-black text-deep">Business intelligence</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Revenue" value={money(stats.revenue || 0)} />
        <StatCard label="Expiring/expired" value={stats.expiredSubscriptions || 0} tone="clay" />
        <StatCard label="Diet compliance" value={`${stats.dietCompliance || 0}%`} tone="gold" />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <AnalyticsChart data={data?.revenueSeries || []} />
        <AnalyticsChart data={leadData} type="bar" />
        <AnalyticsChart data={attendanceData} type="bar" />
      </div>
    </div>
  );
}
