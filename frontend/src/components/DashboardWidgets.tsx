import { Activity, Bell, TrendingUp } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ReactNode } from "react";
import { dateTime, money, titleCase } from "../utils/format";
import { StatusBadge } from "./Badges";

export function StatCard({ label, value, icon, tone = "green" }: { label: string; value: ReactNode; icon?: ReactNode; tone?: "green" | "clay" | "gold" }) {
  const colors = {
    green: "bg-sage text-deep",
    clay: "bg-[#f3e1d8] text-clay",
    gold: "bg-[#fff2d8] text-[#8a5f12]"
  };
  return (
    <div className="glass-panel rounded-crm p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted">{label}</div>
          <div className="mt-2 text-2xl font-black text-deep">{value}</div>
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-crm ${colors[tone]}`}>{icon || <TrendingUp size={19} />}</div>
      </div>
    </div>
  );
}

export function AnalyticsChart({ data, type = "area" }: { data: Record<string, unknown>[]; type?: "area" | "bar" }) {
  return (
    <div className="glass-panel h-[320px] rounded-crm p-4">
      <div className="mb-3 flex items-center gap-2">
        <Activity size={18} className="text-moss" />
        <h2 className="text-lg font-black text-deep">Revenue Trend</h2>
      </div>
      <ResponsiveContainer width="100%" height="84%">
        {type === "area" ? (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#44643d" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#44643d" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#17181421" vertical={false} />
            <XAxis dataKey="name" stroke="#6e7468" />
            <YAxis stroke="#6e7468" tickFormatter={(value) => `₹${Number(value) / 1000}k`} />
            <Tooltip formatter={(value) => money(value)} contentStyle={{ borderRadius: 8, borderColor: "#17181421", background: "#fffaf2" }} />
            <Area type="monotone" dataKey="revenue" stroke="#44643d" strokeWidth={3} fill="url(#revenueFill)" />
          </AreaChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid stroke="#17181421" vertical={false} />
            <XAxis dataKey="name" stroke="#6e7468" />
            <YAxis stroke="#6e7468" />
            <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#17181421", background: "#fffaf2" }} />
            <Bar dataKey="value" fill="#44643d" radius={[6, 6, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export function ActivityTimeline({ items = [] }: { items?: Record<string, unknown>[] }) {
  return (
    <div className="glass-panel rounded-crm p-4">
      <h2 className="mb-4 text-lg font-black text-deep">Recent Activities</h2>
      <div className="space-y-3">
        {items.length === 0 && <div className="text-sm text-muted">No activity yet</div>}
        {items.map((item) => (
          <div key={String(item.id)} className="rounded-crm border border-line bg-soft p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-bold text-ink">{titleCase(String(item.action || "activity"))}</div>
              <StatusBadge value={item.module} />
            </div>
            <div className="mt-1 text-xs text-muted">{dateTime(item.createdAt)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NotificationCenter({ items = [] }: { items?: Record<string, unknown>[] }) {
  return (
    <div className="glass-panel rounded-crm p-4">
      <div className="mb-4 flex items-center gap-2">
        <Bell size={18} className="text-moss" />
        <h2 className="text-lg font-black text-deep">Notifications</h2>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <div className="text-sm text-muted">No notifications</div>}
        {items.map((item) => (
          <div key={String(item.id)} className="rounded-crm border border-line bg-soft p-3">
            <div className="font-bold text-ink">{String(item.title || "Notification")}</div>
            <div className="text-sm text-muted">{String(item.message || "")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
