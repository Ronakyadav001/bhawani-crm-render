import { Navigate, Outlet } from "react-router-dom";
import type { ReactNode } from "react";
import type { Role } from "../types";
import { useAuth } from "../store/auth";

export function ProtectedRoute() {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function RoleBasedRoute({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={user.home || "/login"} replace />;
  return <>{children}</>;
}
