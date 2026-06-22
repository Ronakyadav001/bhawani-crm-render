import { NavLink, Outlet, useLocation, useSearchParams } from "react-router-dom";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Bell, LogOut, Menu, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { RoleBadge } from "../components/Badges";
import { visibleRoutesFor } from "../routes/routeConfig";
import { useAuth } from "../store/auth";
import { cn } from "../utils/cn";

const iconFor = (name: string): LucideIcon => {
  const Icon = (Icons as unknown as Record<string, LucideIcon>)[name];
  return Icon || Icons.Circle;
};

export function AppLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const routes = visibleRoutesFor(user?.role);
  const active = routes.find((route) => location.pathname === route.path) || routes.find((route) => location.pathname.startsWith(route.path));
  const searchValue = searchParams.get("search") || "";
  const canSearch = active?.kind === "resource";

  const updateSearch = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value.trim()) next.set("search", value);
    else next.delete("search");
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="min-h-screen text-ink">
      <div className="fixed inset-x-0 top-0 z-30 border-b border-line bg-soft/80 backdrop-blur-xl lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <button className="icon-button" type="button" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">
            <Menu size={18} />
          </button>
          <div className="text-sm font-black uppercase tracking-[0.16em] text-deep">Bhawani CRM</div>
          <button className="icon-button" type="button" aria-label="Notifications">
            <Bell size={18} />
          </button>
        </div>
      </div>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 grid w-[280px] grid-rows-[auto_1fr_auto] border-r border-line bg-soft/90 shadow-glass backdrop-blur-xl transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="border-b border-line p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-crm bg-deep text-lg font-black text-soft shadow-soft">BF</div>
            <div>
              <div className="text-base font-black text-deep">Bhawani Fitness</div>
              <div className="text-xs font-semibold text-muted">Wellness CRM</div>
            </div>
          </div>
        </div>

        <nav className="overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {routes.map((route) => {
              const Icon = iconFor(route.icon);
              return (
                <NavLink
                  key={route.path}
                  to={route.path}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "group flex min-h-11 items-center gap-3 rounded-crm px-3 py-2 text-sm font-semibold text-muted transition",
                      isActive ? "bg-deep text-soft shadow-soft" : "hover:bg-sage hover:text-deep"
                    )
                  }
                >
                  <Icon size={18} />
                  <span className="truncate">{route.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-line p-4">
          <div className="rounded-crm border border-line bg-cream p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="truncate text-sm font-bold text-deep">{user?.fullName || user?.email}</div>
              <button type="button" className="icon-button h-8 w-8" onClick={logout} aria-label="Logout">
                <LogOut size={16} />
              </button>
            </div>
            <RoleBadge role={user?.role} />
          </div>
        </div>
      </aside>

      <main className="min-h-screen pt-16 lg:pl-[280px] lg:pt-0">
        <header className="sticky top-0 z-20 hidden h-20 items-center justify-between border-b border-line bg-cream/75 px-7 backdrop-blur-xl lg:flex">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{active?.label || "CRM"}</div>
            <h1 className="text-2xl font-black text-deep">{active?.label || "Dashboard"}</h1>
          </div>
          <div className="flex items-center gap-3">
            <label className={cn("flex h-10 w-[280px] items-center gap-2 rounded-crm border border-line bg-soft px-3 text-muted", !canSearch && "opacity-60")}>
              <Search size={17} />
              <input
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
                value={canSearch ? searchValue : ""}
                onChange={(event) => updateSearch(event.target.value)}
                disabled={!canSearch}
                placeholder="Search records"
              />
            </label>
            <button className="icon-button" type="button" aria-label="Notifications">
              <Bell size={18} />
            </button>
          </div>
        </header>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-7"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
