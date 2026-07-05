"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useCallback } from "react";

interface ThemeToggleProps {
  variant?: "icon" | "full";   // icon = just icon button, full = icon + label
  className?: string;
}

export function ThemeToggle({ variant = "icon", className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  /**
   * Temporarily add .theme-switching to <html> so the CSS rule
   * provides a smooth color transition, then remove it after the
   * animation completes. This avoids the old globally-applied
   * transition that broke hover effects and animations.
   */
  const handleToggle = useCallback(() => {
    const root = document.documentElement;
    root.classList.add("theme-switching");
    toggleTheme();
    // Remove after transition completes
    setTimeout(() => root.classList.remove("theme-switching"), 350);
  }, [toggleTheme]);

  if (variant === "full") {
    return (
      <button
        onClick={handleToggle}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group ${className}`}
        style={{
          border: "1px solid var(--border)",
          backgroundColor: "var(--bg-3)",
          color: "var(--text-secondary)",
        }}
      >
        <div className="flex items-center gap-2.5">
          {isDark ? (
            <Moon className="w-4 h-4 text-indigo-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
          <span style={{ color: "var(--text-primary)" }}>
            {isDark ? "Dark Mode" : "Light Mode"}
          </span>
        </div>
        {/* Toggle pill */}
        <div
          className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
            isDark ? "bg-indigo-500" : "bg-amber-400"
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
              isDark ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </div>
      </button>
    );
  }

  // Icon-only variant (for navbar)
  return (
    <button
      onClick={handleToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative p-2 rounded-lg transition-all group ${className}`}
      style={{
        border: "1px solid var(--border)",
        backgroundColor: "var(--bg-2)",
        color: "var(--text-secondary)",
      }}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {/* Animated icon swap */}
      <div className="relative w-4 h-4">
        <Sun
          className={`absolute inset-0 w-4 h-4 text-amber-400 transition-all duration-200 ${
            isDark ? "opacity-0 scale-75 rotate-90" : "opacity-100 scale-100 rotate-0"
          }`}
        />
        <Moon
          className={`absolute inset-0 w-4 h-4 text-indigo-400 transition-all duration-200 ${
            isDark ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-75 -rotate-90"
          }`}
        />
      </div>
    </button>
  );
}
