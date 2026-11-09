import { version } from "../../package.json";
import { AnnouncementModal } from "./AnnouncementModal";

export function BetaAnnouncement() {
    return (
        <AnnouncementModal
            announcementId={`beta-${version}`}
            title="Karta is in beta"
            description="Thanks for trying Karta. We’re testing the platform and refining the assessment workflow. Features may change, and you may run into bugs as we make improvements."
            dismissLabel="Continue to Karta"
            secondaryAction={{ label: "Read the docs", href: "/docs" }}
        >
            <div className="grid gap-[var(--space-12)]">
                <div className="flex flex-wrap items-center justify-between gap-[var(--space-8)]">
                    <h3 className="text-base font-semibold leading-6">Update log</h3>
                    <span className="rounded-[var(--space-4)] bg-[var(--bg-3)] px-[var(--space-8)] py-[var(--space-4)] text-xs tabular-nums t-secondary">v{version}</span>
                </div>
                <ul role="list" className="grid list-disc gap-[var(--space-8)] pl-[var(--space-16)] text-sm leading-6 t-secondary marker:text-[var(--landing-action-text)]">
                    <li>Refreshed the landing page and added an overview of the HP3M framework.</li>
                    <li>Added searchable, role-based documentation with dedicated chapter pages.</li>
                    <li>Unified authentication screens, workspace navigation, and shared UI components.</li>
                    <li>Improved company onboarding with step-by-step setup and save-and-resume support.</li>
                </ul>
            </div>
        </AnnouncementModal>
    );
}
