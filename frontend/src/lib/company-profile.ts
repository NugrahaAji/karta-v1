import type { CompanyProfile } from "../types";

export const EMPTY_COMPANY_PROFILE: CompanyProfile = {
    businessIndustry: "", processMiningTeam: [], processMiningStart: "", processMiningProcesses: "",
    processMiningTechnology: "", managementReadiness: "", measurementScope: "", additionalInfo: "",
};
export const PRESET_SECTORS = [
    "Banking & Financial Services", "Telecommunications", "Healthcare & Pharmaceuticals",
    "Manufacturing & Automotive", "Retail, Wholesale & E-commerce", "Logistics & Supply Chain",
    "Energy & Utilities", "Technology, IT & Software", "Public Sector & Government",
    "Media & Entertainment", "Professional Services & Consulting", "Education & Research",
];
export const PRESET_RESPONSIBLE_TEAMS = [
    "Finance", "Operations (OPS)", "Information Technology (IT)", "Process Excellence / CoE",
    "Internal Audit & Compliance", "Supply Chain & Procurement", "Human Resources (HR)",
    "Customer Experience (CX)", "Risk Management", "Data & Analytics", "Digital Transformation Office",
];
export type ProfileField = keyof CompanyProfile;
export type ProfileErrors = Partial<Record<ProfileField, string>>;
export const PROFILE_STEPS: { label: string; title: string; description: string; fields: ProfileField[] }[] = [
    { label: "Company", title: "Start with your company", description: "Choose your industry and the teams involved in process mining.", fields: ["businessIndustry", "processMiningTeam"] },
    { label: "Process mining", title: "Where are you on your journey?", description: "Short, specific answers are enough. If you haven’t started yet, tell us what you’re planning.", fields: ["processMiningStart", "processMiningProcesses", "processMiningTechnology"] },
    { label: "Assessment", title: "Set the context for your assessment", description: "Tell us what you want to assess and how your organization supports change.", fields: ["managementReadiness", "measurementScope", "additionalInfo"] },
    { label: "Review", title: "Ready to open your workspace?", description: "Check your answers before finishing. You can update them later in Settings → Company profile.", fields: [] },
];
export const TEXT_QUESTIONS: { key: Exclude<ProfileField, "businessIndustry" | "processMiningTeam">; label: string; hint: string; placeholder: string; maxLength: number; optional?: boolean }[] = [
    { key: "processMiningStart", label: "When did you start using process mining?", hint: "Include when you started and your progress so far. “Not started yet” is a valid answer.", placeholder: "We started a pilot in 2024 to understand purchasing delays…", maxLength: 3000 },
    { key: "processMiningProcesses", label: "Which processes are involved?", hint: "Name the processes you use or plan to explore, and the problem you want to solve.", placeholder: "Purchase-to-pay, focusing on invoice approvals and rework…", maxLength: 5000 },
    { key: "processMiningTechnology", label: "What tools or technology do you use?", hint: "Mention platforms, data sources, or integrations. If undecided, describe what you’re considering.", placeholder: "A process mining platform connected to our ERP data…", maxLength: 5000 },
    { key: "managementReadiness", label: "How does your organization support change?", hint: "Consider leadership support, process ownership, documentation, or governance. It’s okay to still be developing these.", placeholder: "Operations sponsors the initiative; each process has a named owner…", maxLength: 5000 },
    { key: "measurementScope", label: "What will this assessment cover?", hint: "Define the processes, departments, or business units you want to assess.", placeholder: "The purchasing process across our finance and procurement teams…", maxLength: 5000 },
    { key: "additionalInfo", label: "Anything else we should know? (optional)", hint: "Add relevant goals, constraints, or background. You can leave this blank.", placeholder: "We’re preparing to expand the pilot to another business unit…", maxLength: 5000, optional: true },
];

/** Accept older comma-separated teams without losing custom department names. */
export function normalizeCompanyProfile(value?: Partial<Omit<CompanyProfile, "processMiningTeam">> & { processMiningTeam?: string[] | string }): CompanyProfile {
    const rawTeams = value?.processMiningTeam;
    const teams = Array.isArray(rawTeams) ? rawTeams : typeof rawTeams === "string" ? rawTeams.split(/[,;\n]+/) : [];
    const seen = new Set<string>();
    const profile = { ...EMPTY_COMPANY_PROFILE, processMiningTeam: teams.filter(team => typeof team === "string").map(team => team.trim()).filter(team => {
        const key = team.toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    }) };
    for (const key of Object.keys(EMPTY_COMPANY_PROFILE) as ProfileField[]) {
        if (key !== "processMiningTeam") profile[key] = typeof value?.[key] === "string" ? value[key].trim() : "";
    }
    return profile;
}
export function parseIndustry(raw: string) {
    const value = raw.trim();
    for (const sector of PRESET_SECTORS) {
        if (value === sector) return { sector, custom: "", detail: "" };
        for (const separator of [" — ", ": "]) {
            if (value.startsWith(sector + separator)) return { sector, custom: "", detail: value.slice(sector.length + separator.length).trim() };
        }
    }
    if (!value) return { sector: "", custom: "", detail: "" };
    const divider = value.indexOf(" — ");
    return { sector: "Other", custom: divider < 0 ? value : value.slice(0, divider), detail: divider < 0 ? "" : value.slice(divider + 3) };
}
export function formatIndustry(sector: string, custom: string, detail: string) {
    const name = (sector === "Other" ? custom : sector).trim();
    return name ? [name, detail.trim()].filter(Boolean).join(" — ") : "";
}
export function validateCompanyProfile(profile: CompanyProfile, fields: ProfileField[] = Object.keys(EMPTY_COMPANY_PROFILE) as ProfileField[], requireComplete = true): ProfileErrors {
    const errors: ProfileErrors = {};
    for (const key of fields) {
        if (key === "processMiningTeam") {
            if (requireComplete && !profile.processMiningTeam.some(team => team.trim())) errors[key] = "Select at least one team, or add your own.";
            continue;
        }
        const value = profile[key].trim();
        if (requireComplete && key !== "additionalInfo" && !value) errors[key] = key === "businessIndustry" ? "Choose your industry, or select Other and enter its name." : "Add a short answer before continuing. If undecided, tell us what you’re planning.";
        const max = key === "businessIndustry" || key === "processMiningStart" ? 3000 : 5000;
        if (value.length > max) errors[key] = `Keep this answer under ${max.toLocaleString("en-US")} characters.`;
    }
    return errors;
}
export function firstIncompleteStep(profile: CompanyProfile) {
    const index = PROFILE_STEPS.slice(0, 3).findIndex(step => Object.keys(validateCompanyProfile(profile, step.fields)).length > 0);
    return index < 0 ? 3 : index;
}
