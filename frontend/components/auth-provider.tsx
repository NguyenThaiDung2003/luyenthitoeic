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
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ user: User }>("/auth/me")
      .then((data) => setUser(data.user))
      .catch((error: unknown) => {
        if (!(error instanceof ApiError) || error.status !== 401) console.error(error);
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(async () => {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, setUser, logout }), [user, loading, logout]);
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
