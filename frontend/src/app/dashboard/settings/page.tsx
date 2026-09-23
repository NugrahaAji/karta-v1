"use client";

import { FormEvent, useEffect, useState } from "react";
import { Building2, Loader2, Save, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import CompanyProfileForm from "@/components/CompanyProfileForm";
import type { CompanyProfile } from "@/types";

export default function SettingsPage() {
  const { user, token, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
    setAvatar(user?.avatar ?? "");
  }, [user?.name, user?.avatar]);

  const isCompanyOwner = user?.accountRole === "Company" && !user.createdBy;

  const refresh = async () => {
    if (token) await refreshUser(token);
  };

  const saveAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingAccount(true);
    try {
      await api.put("/users/profile", { name, avatar });
      await refresh();
      toast.success("Account profile updated");
    } catch {
      toast.error("Failed to update account profile");
    } finally {
      setSavingAccount(false);
    }
  };

  const saveCompanyProfile = async (companyProfile: CompanyProfile) => {
    setSavingCompany(true);
    try {
      await api.put("/users/profile", { companyProfile });
      await refresh();
      toast.success("Company profile updated");
    } catch {
      toast.error("Failed to update company profile");
    } finally {
      setSavingCompany(false);
    }
  };

  return (
    <div className="page-container max-w-4xl">
      <div className="mb-7">
        <h1 className="text-2xl font-bold t-primary">Profile Settings</h1>
        <p className="mt-1 text-sm t-muted">Manage your account and company assessment context.</p>
      </div>

      <section className="card mb-7 p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
            <UserRound className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-bold t-primary">Account Profile</h2>
            <p className="text-xs t-muted">Update your display name and avatar URL.</p>
          </div>
        </div>

        <form onSubmit={saveAccount} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="profile-name" className="mb-1.5 block text-xs font-semibold t-secondary">Display Name</label>
            <input id="profile-name" required value={name} onChange={event => setName(event.target.value)} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ backgroundColor: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <label htmlFor="profile-avatar" className="mb-1.5 block text-xs font-semibold t-secondary">Avatar URL</label>
            <input id="profile-avatar" type="url" value={avatar} onChange={event => setAvatar(event.target.value)} placeholder="https://..." className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ backgroundColor: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button type="submit" disabled={savingAccount} className="btn-primary gap-2">
              {savingAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Account
            </button>
          </div>
        </form>
      </section>

      {isCompanyOwner && (
        <section className="card p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-bold t-primary">Company Profile</h2>
              <p className="text-xs t-muted">Keep the organizational context used by maturity assessments and AI reasoning up to date.</p>
            </div>
          </div>
          <CompanyProfileForm
            initialValue={user?.companyProfile}
            submitting={savingCompany}
            onSubmit={saveCompanyProfile}
          />
        </section>
      )}
    </div>
  );
}
