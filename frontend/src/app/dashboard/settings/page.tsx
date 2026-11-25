"use client";

import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Alert, Button, TextField } from "@/components/ui";
import CompanyProfileForm from "@/components/CompanyProfileForm";
import { WorkspacePage } from "@/components/workspace/WorkspaceUI";
import { requestError } from "@/lib/workspace";
import styles from "@/components/workspace/company-workspace.module.css";
import type { CompanyProfile } from "@/types";

export default function SettingsPage() {
    const { user, token, refreshUser } = useAuth();
    const [name, setName] = useState(user?.name ?? "");
    const [avatar, setAvatar] = useState(user?.avatar ?? "");
    const [savingAccount, setSavingAccount] = useState(false);
    const [savingCompany, setSavingCompany] = useState(false);
    const [accountError, setAccountError] = useState("");
    const [companyError, setCompanyError] = useState("");
    useEffect(() => { setName(user?.name ?? ""); setAvatar(user?.avatar ?? ""); }, [user?.name, user?.avatar]);
    const isCompanyOwner = user?.accountRole === "Company" && !user.createdBy;
    async function saveAccount(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (savingAccount) return;
        if (!name.trim()) { setAccountError("Enter a display name to continue."); return; }
        setSavingAccount(true); setAccountError("");
        try { await api.put("/users/profile", { name: name.trim(), avatar }); if (token) await refreshUser(token); toast.success("Account profile updated"); }
        catch (cause) { setAccountError(requestError(cause, "Couldn't save your profile. Check the details and try again.")); }
        finally { setSavingAccount(false); }
    }
    async function saveCompanyProfile(companyProfile: CompanyProfile) {
        setSavingCompany(true); setCompanyError("");
        try { await api.put("/users/profile", { companyProfile }); if (token) await refreshUser(token); toast.success("Company profile updated"); }
        catch (cause) { setCompanyError(requestError(cause, "Couldn't save the company profile. Your entries are still here; try again.")); }
        finally { setSavingCompany(false); }
    }
    return <WorkspacePage title="Settings" description="Keep your account and company assessment context up to date.">
        <section className={styles.settingsSection}><div><h2>Account profile</h2><p>Manage the name and avatar shown across your workspace.</p></div>
            <form className={styles.settingsForm} onSubmit={saveAccount} aria-busy={savingAccount}>
                <fieldset className={styles.formFieldset} disabled={savingAccount}><TextField label="Display name" hint="Use the name your team recognizes." autoComplete="name" required value={name} onChange={event => setName(event.target.value)} /><TextField label="Avatar URL (optional)" hint="Use a link to your profile image." type="url" value={avatar} onChange={event => setAvatar(event.target.value)} placeholder="https://…" /><TextField label="Email address" hint="Your sign-in email cannot be changed here." value={user?.email ?? ""} disabled /></fieldset>
                {accountError && <Alert variant="error">{accountError}</Alert>}<div className={styles.formActions}><Button type="submit" loading={savingAccount}>Save account</Button></div>
            </form>
        </section>
        {isCompanyOwner && <section className={styles.settingsSection}><div><h2>Company profile</h2><p>This context helps your team assess process maturity and create relevant recommendations.</p></div><CompanyProfileForm initialValue={user?.companyProfile} submitting={savingCompany} onSubmit={saveCompanyProfile} error={companyError} /></section>}
    </WorkspacePage>;
}
