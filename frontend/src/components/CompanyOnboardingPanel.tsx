"use client";

import { useState } from "react";
import { Building2, Sparkles } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { CompanyProfile } from "@/types";
import CompanyProfileForm from "@/components/CompanyProfileForm";

export default function CompanyOnboardingPanel() {
  const { user, token, refreshUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (companyProfile: CompanyProfile) => {
    setSubmitting(true);
    setError("");
    try {
      await api.put("/users/profile", {
        companyProfile,
        completeOnboarding: true,
      });
      if (token) await refreshUser(token);
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { error?: string } } })
        .response?.data?.error ?? "Unable to save your company profile. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
      <div className="mx-auto my-6 w-full max-w-3xl overflow-hidden rounded-2xl shadow-2xl" style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border)" }}>
        <div className="p-6 sm:p-8" style={{ borderBottom: "1px solid var(--border-2)", backgroundColor: "var(--bg-3)" }}>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold t-primary">Welcome to Karta, {user?.name}</h1>
                <Sparkles className="h-4 w-4 text-amber-400" />
              </div>
              <p className="mt-1 text-sm t-muted">Complete your company profile before starting the maturity assessment.</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed t-secondary">
            Your answers provide organizational context for Process Mining maturity measurement and AI reasoning. You can update them later from <strong className="t-primary">Settings → Company Profile</strong>.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {error && <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</div>}
          <CompanyProfileForm
            initialValue={user?.companyProfile}
            submitting={submitting}
            submitLabel="Complete Company Profile"
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
