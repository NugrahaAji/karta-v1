import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url: string = error.config?.url ?? "";
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "";

      // Don't redirect if:
      // 1. The failing call IS the rehydration check itself (/auth/me)
      //    → let useAuth handle it (it clears the cookie). Redirecting here
      //      causes an infinite loop: redirect → remount → /auth/me → 401 → redirect
      // 2. We're already on an auth page (avoids redirect loop on login page itself)
      const isAuthMe = url.includes("/auth/me");
      const isOnAuthPage = currentPath.startsWith("/auth/");

      if (!isAuthMe && !isOnAuthPage) {
        Cookies.remove("token");
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
