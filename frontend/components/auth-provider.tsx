"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";

export type Role = "STUDENT" | "TEACHER";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  waking: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

// Backend gói miễn phí có thể mất khoảng một phút để thức dậy
const RETRY_DELAYS_MS = [2000, 5000, 10000, 15000, 20000];
const WAKING_AFTER_MS = 4000;

const AuthContext = createContext<AuthState | null>(null);

// Lỗi mạng và 5xx có thể do backend đang thức dậy, không có nghĩa là chưa đăng nhập
const isTransient = (error: unknown) =>
  !(error instanceof ApiError) || error.status === 0 || error.status >= 500;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const wakingTimer = setTimeout(() => setWaking(true), WAKING_AFTER_MS);

    async function loadUser() {
      for (let attempt = 0; !cancelled; attempt += 1) {
        try {
          const data = await api<{ user: User }>("/auth/me");
          if (!cancelled) setUser(data.user);
          return;
        } catch (error) {
          const delay = RETRY_DELAYS_MS[attempt];
          if (!isTransient(error) || delay === undefined) {
            if (!(error instanceof ApiError) || error.status !== 401) console.error(error);
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    void loadUser().finally(() => {
      clearTimeout(wakingTimer);
      if (cancelled) return;
      setWaking(false);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      clearTimeout(wakingTimer);
    };
  }, []);

  const logout = useCallback(async () => {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, waking, setUser, logout }),
    [user, loading, waking, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth phải nằm trong AuthProvider");
  return context;
}

export function homePathFor(role: Role) {
  return role === "TEACHER" ? "/teacher/questions" : "/dashboard";
}

export function LoadingMessage() {
  const { waking } = useAuth();
  return (
    <p className="p-8 text-on-surface-variant" role="status">
      {waking ? "Máy chủ đang khởi động, có thể mất khoảng một phút..." : "Đang tải..."}
    </p>
  );
}
