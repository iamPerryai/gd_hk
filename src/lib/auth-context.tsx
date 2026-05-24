"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

type AuthUser = { id: string; username: string };

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string, turnstileToken?: string) => Promise<{ error?: string }>;
  register: (username: string, password: string, turnstileToken?: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user on mount with cancellation (M11 fix)
  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/auth/me", { signal: ac.signal })
      .then((res) => res.json())
      .then((data) => {
        if (!ac.signal.aborted && data.user) setUser(data.user);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, []);

  const login = useCallback(async (username: string, password: string, turnstileToken?: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, turnstileToken }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "登录失败" };
    setUser(data.user);
    return {};
  }, []);

  const register = useCallback(async (username: string, password: string, turnstileToken?: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, turnstileToken }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "注册失败" };
    setUser(data.user);
    return {};
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
