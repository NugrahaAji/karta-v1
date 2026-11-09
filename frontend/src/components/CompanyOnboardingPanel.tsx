"use client";

import { useRef, useState } from "react";
import { Building2, Check, ArrowRight } from "lucide-react";
import { isAxiosError } from "axios";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { CompanyProfile } from "@/types";
import { Alert, Button, Modal } from "@/components/ui";
import CompanyProfileForm from "@/components/CompanyProfileForm";
import styles from "./CompanyProfileForm.module.css";

function requestMessage(error: unknown, fallback: string) {
    return isAxiosError(error) && typeof error.response?.data?.error === "string" ? error.response.data.error : fallback;
}

export default function CompanyOnboardingPanel() {
    const { user, token, refreshUser, logout } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);
    const [error, setError] = useState("");
    const [exitRequested, setExitRequested] = useState(false);
    const [saved, setSaved] = useState(false);
    const requestLock = useRef(false);

    async function openWorkspace() {
        setSubmitting(true);
        setError("");
        try {
            if (!token) throw new Error("No session");
            await refreshUser(token);
        } catch {
            setError("Your company profile is saved, but we couldn’t open your workspace. Try again, or sign out and sign back in.");
        } finally { setSubmitting(false); }
    }

    async function saveProfile(companyProfile: CompanyProfile, draft = false) {
        if (requestLock.current) return;
        requestLock.current = true;
        if (draft) setSavingDraft(true);
        else setSubmitting(true);
        setError("");
        try {
            await api.put("/users/profile", { companyProfile, completeOnboarding: !draft });
            if (draft) logout();
            else {
                setSaved(true);
                await openWorkspace();
            }
        } catch (requestError: unknown) {
            setError(requestMessage(requestError, "We couldn’t save your answers. Your entries are still here—check your connection and try again."));
        } finally {
            requestLock.current = false;
            setSubmitting(false);
            setSavingDraft(false);
        }
    }

    return <Modal open title={saved ? "Your company profile is ready" : "Set up your company"}
        description={saved ? "Your answers are saved. You’re ready to start working with your team." : "Give your maturity assessments the right organizational context."}
        icon={saved ? <Check aria-hidden="true" /> : <Building2 aria-hidden="true" />}
        closeLabel={saved ? "Open workspace" : "Pause company setup"}
        closeDisabled={submitting || savingDraft} dismissOnBackdrop={false}
        onClose={() => { if (saved) void openWorkspace(); else { setError(""); setExitRequested(previous => !previous); } }}>
        {saved ? <div className={styles.complete} role="status">
            {error ? <Alert variant="error">{error}</Alert> : <p>Opening your workspace…</p>}
            <div className={styles.completeActions}>
                <Button onClick={() => void openWorkspace()} loading={submitting} trailingIcon={<ArrowRight aria-hidden="true" />}>{submitting ? "Opening workspace…" : "Go to workspace"}</Button>
                {error && <Button variant="secondary" onClick={logout} disabled={submitting}>Sign out</Button>}
            </div>
        </div> : <CompanyProfileForm key={user?._id} initialValue={user?.companyProfile} onboarding submitting={submitting} savingDraft={savingDraft} error={error}
            exitRequested={exitRequested} onRequestExit={() => { setError(""); setExitRequested(true); }} onCancelExit={() => { setError(""); setExitRequested(false); }}
            onSaveDraft={profile => saveProfile(profile, true)} onSubmit={profile => saveProfile(profile)} />}
    </Modal>;
}
