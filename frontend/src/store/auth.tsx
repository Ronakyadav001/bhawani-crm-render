import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { api, unwrap } from "../api/client";
import type { ApiResponse, User } from "../types";

type LoginPayload = {
  email: string;
  password: string;
};

type AuthContextValue = {
  user: (User & { home?: string }) | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const storedUser = () => {
  const raw = localStorage.getItem("bf_user");
  return raw ? JSON.parse(raw) as User & { home?: string } : null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<(User & { home?: string }) | null>(storedUser);
  const navigate = useNavigate();

  const value = useMemo<AuthContextValue>(() => ({
    user,
    login: async (payload) => {
      const response = await api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string; home: string }>>("/auth/login", payload);
      const data = unwrap(response);
      localStorage.setItem("bf_access_token", data.accessToken);
      localStorage.setItem("bf_refresh_token", data.refreshToken);
      localStorage.setItem("bf_user", JSON.stringify({ ...data.user, home: data.home }));
      setUser({ ...data.user, home: data.home });
      navigate(data.home, { replace: true });
    },
    logout: () => {
      localStorage.removeItem("bf_access_token");
      localStorage.removeItem("bf_refresh_token");
      localStorage.removeItem("bf_user");
      setUser(null);
      navigate("/login", { replace: true });
    }
  }), [navigate, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
