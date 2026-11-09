"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, LogOut, Plus } from "lucide-react";
import type { CompanyProfile } from "@/types";
import { Alert, Button, CheckboxChoice, ChoiceGroup, SelectField, TextAreaField, TextField } from "@/components/ui";
import { PRESET_RESPONSIBLE_TEAMS, PRESET_SECTORS, PROFILE_STEPS, TEXT_QUESTIONS, firstIncompleteStep, formatIndustry, normalizeCompanyProfile, parseIndustry, validateCompanyProfile, type ProfileErrors, type ProfileField } from "@/lib/company-profile";
import styles from "./CompanyProfileForm.module.css";

export { EMPTY_COMPANY_PROFILE, PRESET_SECTORS, PRESET_RESPONSIBLE_TEAMS } from "@/lib/company-profile";

interface Props {
    initialValue?: Partial<CompanyProfile>;
    submitting?: boolean;
    savingDraft?: boolean;
    submitLabel?: string;
    onSubmit: (profile: CompanyProfile) => Promise<void> | void;
    onboarding?: boolean;
    exitRequested?: boolean;
    onRequestExit?: () => void;
    onCancelExit?: () => void;
    onSaveDraft?: (profile: CompanyProfile) => Promise<void> | void;
    error?: string;
}

export default function CompanyProfileForm({ initialValue, submitting = false, savingDraft = false, submitLabel = "Save company profile", onSubmit, onboarding = false, exitRequested = false, onRequestExit, onCancelExit, onSaveDraft, error }: Props) {
    const [profile, setProfile] = useState(() => normalizeCompanyProfile(initialValue));
    const [industry, setIndustry] = useState(() => parseIndustry(initialValue?.businessIndustry || ""));
    const [detailsOpen, setDetailsOpen] = useState(() => Boolean(parseIndustry(initialValue?.businessIndustry || "").detail));
    const [customTeam, setCustomTeam] = useState("");
    const [step, setStep] = useState(() => onboarding ? firstIncompleteStep(normalizeCompanyProfile(initialValue)) : 0);
    const [reviewing, setReviewing] = useState(false);
    const [errors, setErrors] = useState<ProfileErrors>({});
    const [validationAttempt, setValidationAttempt] = useState(0);
    const [actionPending, setActionPending] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const headingRef = useRef<HTMLHeadingElement>(null);
    const errorRef = useRef<HTMLDivElement>(null);
    const requestLock = useRef(false);
    const prefix = useId();
    const busy = submitting || savingDraft || actionPending;
    const fields = PROFILE_STEPS[step].fields;

    useEffect(() => {
        if (onboarding) headingRef.current?.focus();
    }, [step, exitRequested, onboarding]);

    useEffect(() => {
        if (error) errorRef.current?.focus();
    }, [error]);

    useEffect(() => {
        if (!validationAttempt) return;
        const invalid = formRef.current?.querySelector<HTMLElement>('[data-invalid="true"]');
        const control = invalid?.querySelector<HTMLElement>('input[aria-invalid="true"], select[aria-invalid="true"], textarea[aria-invalid="true"]') || invalid?.querySelector<HTMLElement>("select, input, textarea");
        control?.focus();
        invalid?.scrollIntoView({ block: "nearest" });
    }, [validationAttempt]);

    function clearError(key: ProfileField) { setErrors(previous => ({ ...previous, [key]: undefined })); }
    function updateIndustry(changes: Partial<typeof industry>) {
        const next = { ...industry, ...changes };
        setIndustry(next);
        setProfile(previous => ({ ...previous, businessIndustry: formatIndustry(next.sector, next.custom, next.detail) }));
        clearError("businessIndustry");
    }
    function changeText(key: ProfileField, value: string) {
        setProfile(previous => ({ ...previous, [key]: value }));
        clearError(key);
    }
    function toggleTeam(team: string, checked: boolean) {
        setProfile(previous => ({ ...previous, processMiningTeam: checked ? [...previous.processMiningTeam, team] : previous.processMiningTeam.filter(item => item.toLowerCase() !== team.toLowerCase()) }));
        clearError("processMiningTeam");
    }
    function withPendingTeam() {
        return normalizeCompanyProfile({ ...profile, processMiningTeam: [...profile.processMiningTeam, ...(customTeam.trim() ? [customTeam.trim()] : [])] });
    }
    function addTeam() {
        if (!customTeam.trim()) return;
        setProfile(withPendingTeam());
        setCustomTeam("");
        clearError("processMiningTeam");
    }
    function goToStep(index: number) {
        if (busy) return;
        setErrors({});
        setStep(index);
    }
    function showErrors(nextErrors: ProfileErrors) {
        setErrors(nextErrors);
        if (onboarding) {
            const invalidStep = PROFILE_STEPS.findIndex(item => item.fields.some(key => nextErrors[key]));
            if (invalidStep >= 0) setStep(invalidStep);
        }
        setValidationAttempt(value => value + 1);
    }
    async function save(draft = false) {
        if (requestLock.current || busy) return;
        const next = withPendingTeam();
        const nextErrors = validateCompanyProfile(next, undefined, !draft);
        if (draft && industry.detail.trim() && !next.businessIndustry) {
            nextErrors.businessIndustry = "Choose an industry so we can save your company context with it.";
        }
        if (Object.keys(nextErrors).length) {
            onCancelExit?.();
            showErrors(nextErrors);
            return;
        }
        setProfile(next);
        setCustomTeam("");
        requestLock.current = true;
        setActionPending(true);
        try {
            if (draft) await onSaveDraft?.(next);
            else await onSubmit(next);
        } finally {
            requestLock.current = false;
            setActionPending(false);
        }
    }
    function handleSubmit(event: FormEvent) {
        event.preventDefault();
        if (busy || exitRequested) return;
        const next = withPendingTeam();
        if (onboarding && step < 3) {
            const nextErrors = validateCompanyProfile(next, fields);
            if (Object.keys(nextErrors).length) { showErrors(nextErrors); return; }
            setProfile(next);
            setCustomTeam("");
            setErrors({});
            setStep(reviewing ? 3 : step + 1);
            setReviewing(false);
        } else void save();
    }

    const allTeams = [...PRESET_RESPONSIBLE_TEAMS, ...profile.processMiningTeam.filter(team => !PRESET_RESPONSIBLE_TEAMS.some(preset => preset.toLowerCase() === team.toLowerCase()))];
    const selected = new Set(profile.processMiningTeam.map(team => team.toLowerCase()));
    const hasErrors = Object.values(errors).some(Boolean);
    const id = (name: string) => `${prefix}-${name}`;

    function companyFields() {
        return <>
            <div data-invalid={Boolean(errors.businessIndustry)}>
                <SelectField id={id("industry")} name="businessIndustry" label="Primary industry" hint="Choose the closest match, or select Other to add your own." required value={industry.sector} error={industry.sector === "Other" ? undefined : errors.businessIndustry} onChange={event => updateIndustry({ sector: event.target.value })}>
                    <option value="" disabled>Select an industry</option>
                    {PRESET_SECTORS.map(sector => <option key={sector}>{sector}</option>)}
                    <option value="Other">Other industry</option>
                </SelectField>
                {industry.sector === "Other" && <div className={styles.followUp}><TextField id={id("custom-industry")} label="Your industry" hint="Use a specific sector name." maxLength={3000} placeholder="e.g. Aerospace" required value={industry.custom} error={errors.businessIndustry} onChange={event => updateIndustry({ custom: event.target.value })} /></div>}
            </div>
            <details className={styles.optionalDetails} open={detailsOpen} onToggle={event => setDetailsOpen(event.currentTarget.open)}>
                <summary>Add company context (optional)</summary>
                <TextAreaField id={id("industry-detail")} label="What does your company do?" hint="A brief description of your products, services, or customers." rows={2} maxLength={2500} value={industry.detail} onChange={event => updateIndustry({ detail: event.target.value })} placeholder="We manufacture components for the automotive industry…" />
            </details>
            <div data-invalid={Boolean(errors.processMiningTeam)}>
                <ChoiceGroup label="Responsible teams" hint="Select all that apply. These become role choices when you add team members later." error={errors.processMiningTeam}>
                    {allTeams.map(team => <CheckboxChoice key={team} name="responsible-teams" value={team} label={team} checked={selected.has(team.toLowerCase())} onChange={event => toggleTeam(team, event.target.checked)} />)}
                </ChoiceGroup>
                <div className={styles.customTeam}>
                    <TextField id={id("custom-team")} label="Another team (optional)" hint="Enter a department name and select Add team." value={customTeam} maxLength={120} placeholder="e.g. Process improvement office" onChange={event => setCustomTeam(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); addTeam(); } }} />
                    <Button variant="secondary" disabled={busy || !customTeam.trim()} onClick={addTeam} leadingIcon={<Plus aria-hidden="true" />}>Add team</Button>
                </div>
                <p className={styles.selectionCount} role="status">{profile.processMiningTeam.length ? `${profile.processMiningTeam.length} ${profile.processMiningTeam.length === 1 ? "team" : "teams"} selected` : "No teams selected yet"}</p>
            </div>
        </>;
    }
    function textFields(stepIndex: number) {
        return TEXT_QUESTIONS.filter(question => PROFILE_STEPS[stepIndex].fields.includes(question.key)).map(question => <div key={question.key} data-invalid={Boolean(errors[question.key])}>
            <TextAreaField id={id(question.key)} name={question.key} label={question.label} hint={question.hint} placeholder={question.placeholder} maxLength={question.maxLength} required={!question.optional} value={profile[question.key]} error={errors[question.key]} onChange={event => changeText(question.key, event.target.value)} />
        </div>);
    }

    return <form ref={formRef} onSubmit={handleSubmit} noValidate aria-busy={busy} className={`${styles.form} ${onboarding ? styles.wizard : ""}`}>
        {onboarding && !exitRequested && <nav className={styles.progress} aria-label="Company setup progress">
            <ol>{PROFILE_STEPS.map((item, index) => <li key={item.label}>
                <button type="button" onClick={() => { if (step === 3) setReviewing(true); goToStep(index); }} disabled={busy || index > step} aria-current={step === index ? "step" : undefined} className={styles.step}>
                    <span className={styles.stepNumber}>{index < step ? <Check aria-hidden="true" /> : index + 1}</span><span>{item.label}</span>
                </button>
            </li>)}</ol>
        </nav>}
        <div className={styles.body} data-lenis-prevent>
            {error && <div ref={errorRef} tabIndex={-1} className={styles.requestError}><Alert variant="error">{error}</Alert></div>}
            {exitRequested ? <section className={styles.exitPrompt}>
                <LogOut aria-hidden="true" />
                <h2 tabIndex={-1} ref={headingRef}>Finish setup later?</h2>
                <p>Save your answers to your account and sign out. Next time you sign in, you’ll return to the first unfinished step.</p>
                <p className={styles.supporting}>Your workspace will be available once you finish setup.</p>
            </section> : <>
                {onboarding && <header className={styles.stepHeading}>
                    <p className={styles.eyebrow}>Step {step + 1} of {PROFILE_STEPS.length}</p>
                    <h2 ref={headingRef} tabIndex={-1}>{PROFILE_STEPS[step].title}</h2>
                    <p>{PROFILE_STEPS[step].description}</p>
                </header>}
                {hasErrors && <p className={styles.validationSummary} role="alert">Check the highlighted answers to continue.</p>}
                {onboarding && step === 3 ? <div className={styles.review}>
                    {PROFILE_STEPS.slice(0, 3).map((group, index) => <section key={group.label}>
                        <div className={styles.reviewHeading}><h3>{group.label}</h3><button type="button" className={styles.textLink} disabled={busy} aria-label={`Edit ${group.label.toLowerCase()} answers`} onClick={() => { setReviewing(true); goToStep(index); }}>Edit</button></div>
                        <dl>{group.fields.map(key => <div key={key}><dt>{key === "businessIndustry" ? "Industry" : key === "processMiningTeam" ? "Responsible teams" : TEXT_QUESTIONS.find(item => item.key === key)?.label}</dt><dd>{key === "processMiningTeam" ? profile.processMiningTeam.join(", ") : profile[key] || "Not provided"}</dd></div>)}</dl>
                    </section>)}
                </div> : <fieldset className={styles.fields} disabled={busy}>
                    {(onboarding ? [step] : [0, 1, 2]).map(index => <section className={styles.section} key={index}>
                        {!onboarding && <h3>{PROFILE_STEPS[index].label}</h3>}
                        {index === 0 ? companyFields() : textFields(index)}
                    </section>)}
                </fieldset>}
            </>}
        </div>
        <footer className={styles.footer}>
            {exitRequested ? <>
                <Button variant="secondary" disabled={busy} onClick={onCancelExit}>Continue setup</Button>
                <Button disabled={busy} loading={savingDraft} onClick={() => void save(true)} trailingIcon={<LogOut aria-hidden="true" />}>{savingDraft ? "Saving progress…" : "Save & sign out"}</Button>
            </> : <>
                {onboarding && <button type="button" className={styles.saveLater} disabled={busy} onClick={onRequestExit}>Save & sign out</button>}
                <div className={styles.navigation}>
                    {onboarding && step > 0 && <Button variant="secondary" disabled={busy} onClick={() => { setReviewing(false); goToStep(step - 1); }} leadingIcon={<ArrowLeft aria-hidden="true" />}>Back</Button>}
                    <Button type="submit" disabled={busy} loading={submitting} trailingIcon={<ArrowRight aria-hidden="true" />}>{submitting ? "Saving company profile…" : onboarding ? step === 3 ? "Finish setup" : reviewing ? "Return to review" : "Continue" : submitLabel}</Button>
                </div>
                {onboarding && <p className={styles.footerHint}>Answers are saved when you finish setup or choose Save & sign out.</p>}
            </>}
        </footer>
    </form>;
}
