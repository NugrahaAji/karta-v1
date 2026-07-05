"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import Cookies from "js-cookie";
import api from "@/lib/api";
import { User } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, accountRole?: string, plan?: string) => Promise<void>;
  logout: () => void;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendOtp: (email: string, type?: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUser: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  // Single state object → one setState call = one re-render
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
  });

  // Guard against double-invoke (React StrictMode) and multiple mounts
  const initialized = useRef(false);

  // ─── Rehydrate on mount — runs exactly once ──────────────────────────────
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const savedToken = Cookies.get("token");
    if (!savedToken) {
      setAuth({ user: null, token: null, loading: false });
      return;
    }

    // Token found — verify with backend
    api
      .get("/auth/me")
      .then((res) => {
        const user = res.data?.user ?? null;
        if (user) {
          setAuth({ user, token: savedToken, loading: false });
        } else {
          // Unexpected empty body
          Cookies.remove("token");
          setAuth({ user: null, token: null, loading: false });
        }
      })
      .catch(() => {
        // Token invalid/expired — clear cookie.
        // DO NOT use window.location.href here: hard reload destroys and
        // remounts AuthProvider, re-runs this effect → infinite loop.
        Cookies.remove("token");
        setAuth({ user: null, token: null, loading: false });
      });
  }, []);

  // ─── Actions ─────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    Cookies.set("token", res.data.token, { expires: 7 });
    // Single setState → single re-render
    setAuth({ user: res.data.user, token: res.data.token, loading: false });
  }, []);

  const register = useCallback(async (
    name: string, email: string, password: string,
    accountRole?: string, plan?: string
  ) => {
    const res = await api.post("/auth/register", { name, email, password, accountRole, plan });
    Cookies.set("token", res.data.token, { expires: 7 });
    setAuth({ user: res.data.user, token: res.data.token, loading: false });
  }, []);

  const logout = useCallback(() => {
    Cookies.remove("token");
    setAuth({ user: null, token: null, loading: false });
    // Soft redirect via Next.js router is handled by the layout guard.
    // We don't call window.location.href here to avoid hard reload.
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
  }, []);

  const verifyEmail = useCallback(async (email: string, code: string) => {
    await api.post("/auth/verify-email", { email, code });
    setAuth(prev =>
      prev.user && prev.user.email === email
        ? { ...prev, user: { ...prev.user, isVerified: true } }
        : prev
    );
  }, []);

  const resendOtp = useCallback(async (email: string, type?: string) => {
    await api.post("/auth/resend-otp", { email, type });
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<string> => {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data.message;
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    await api.post("/auth/reset-password", { email, code, newPassword });
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await api.post("/auth/change-password", { currentPassword, newPassword });
  }, []);

  const refreshUser = useCallback(async (newToken: string) => {
    const res = await api.get("/auth/me", {
      headers: { Authorization: `Bearer ${newToken}` },
    });
    setAuth({ user: res.data.user, token: newToken, loading: false });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        login,
        register,
        logout,
        verifyEmail,
        resendOtp,
        forgotPassword,
        resetPassword,
        changePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
