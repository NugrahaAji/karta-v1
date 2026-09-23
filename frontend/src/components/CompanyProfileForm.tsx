"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, Save, Check, Plus, X, Building2, Users2 } from "lucide-react";
import type { CompanyProfile } from "@/types";

export const EMPTY_COMPANY_PROFILE: CompanyProfile = {
  businessIndustry: "",
  processMiningStart: "",
  processMiningTeam: [],
  processMiningProcesses: "",
  processMiningTechnology: "",
  managementReadiness: "",
  measurementScope: "",
  additionalInfo: "",
};

export const PRESET_SECTORS: string[] = [
  "Banking & Financial Services",
  "Telecommunications",
  "Healthcare & Pharmaceuticals",
  "Manufacturing & Automotive",
  "Retail, Wholesale & E-commerce",
  "Logistics & Supply Chain",
  "Energy & Utilities",
  "Technology, IT & Software",
  "Public Sector & Government",
  "Media & Entertainment",
  "Professional Services & Consulting",
  "Education & Research",
];

export const PRESET_RESPONSIBLE_TEAMS: string[] = [
  "Finance",
  "Operations (OPS)",
  "Information Technology (IT)",
  "Process Excellence / CoE",
  "Internal Audit & Compliance",
  "Supply Chain & Procurement",
  "Human Resources (HR)",
  "Customer Experience (CX)",
  "Risk Management",
  "Data & Analytics",
  "Digital Transformation Office",
];

const STANDARD_TEXT_QUESTIONS: Array<{
  key: keyof CompanyProfile;
  label: string;
  question: string;
  placeholder: string;
}> = [
  {
    key: "processMiningStart",
    label: "Process Mining Journey",
    question: "When did the company start using Process Mining?",
    placeholder: "Describe when the initiative started, its initial objectives, and the progress achieved so far...",
  },
  {
    key: "processMiningProcesses",
    label: "Business Processes",
    question: "Which business processes already use Process Mining?",
    placeholder: "List the processes, departments involved, use cases, challenges, and problems being addressed...",
  },
  {
    key: "processMiningTechnology",
    label: "Technology",
    question: "What technology is used or will be used for the Process Mining implementation?",
    placeholder: "Describe in-house applications, commercial Process Mining packages, integrations, dashboards, or action engines...",
  },
  {
    key: "managementReadiness",
    label: "Management and Change Readiness",
    question: "What is the company's awareness and readiness regarding management systems and change management?",
    placeholder: "Describe certifications, governance, documentation, audits, security practices, and cross-department coordination...",
  },
  {
    key: "measurementScope",
    label: "Maturity Measurement Scope",
    question: "What scope has been selected for this Process Mining maturity measurement?",
    placeholder: "Describe the processes, departments, business units, and boundaries included in the measurement...",
  },
  {
    key: "additionalInfo",
    label: "Additional Information",
    question: "Any information do you want to share about your company?",
    placeholder: "Share any other relevant context, background, challenges, goals, or details that may help with the assessment...",
  },
];

interface Props {
  initialValue?: Partial<CompanyProfile>;
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (profile: CompanyProfile) => Promise<void> | void;
}

export default function CompanyProfileForm({
  initialValue,
  submitting = false,
  submitLabel = "Save Company Profile",
  onSubmit,
}: Props) {
  const [profile, setProfile] = useState<CompanyProfile>({
    ...EMPTY_COMPANY_PROFILE,
    ...initialValue,
  });

  // State for Sector ("What sector")
  const [selectedSector, setSelectedSector] = useState<string>("");
  const [customSector, setCustomSector] = useState<string>("");
  const [isCustomSectorMode, setIsCustomSectorMode] = useState<boolean>(false);
  const [sectorDetail, setSectorDetail] = useState<string>("");

  // State for Responsible Team ("Who is responsible")
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [customTeamInput, setCustomTeamInput] = useState<string>("");

  // Initialize and parse fields from initialValue
  useEffect(() => {
    const nextProfile = { ...EMPTY_COMPANY_PROFILE, ...initialValue };
    setProfile(nextProfile);

    // Initialize Sector
    const rawIndustry = nextProfile.businessIndustry || "";
    if (rawIndustry) {
      // Check if it matches a preset or preset with detail
      const matchedPreset = PRESET_SECTORS.find(
        preset => rawIndustry === preset || rawIndustry.startsWith(`${preset} — `) || rawIndustry.startsWith(`${preset}: `)
      );

      if (matchedPreset) {
        setSelectedSector(matchedPreset);
        setIsCustomSectorMode(false);
        const remainder = rawIndustry.replace(new RegExp(`^${matchedPreset}[\\s:—-]+`), "").trim();
        setSectorDetail(remainder);
      } else {
        setSelectedSector("Other");
        setIsCustomSectorMode(true);
        setCustomSector(rawIndustry);
      }
    } else {
      setSelectedSector("");
      setIsCustomSectorMode(false);
      setCustomSector("");
      setSectorDetail("");
    }

    // Initialize Responsible Teams
    const rawTeams = nextProfile.processMiningTeam;
    if (Array.isArray(rawTeams) && rawTeams.length > 0) {
      setSelectedTeams([...new Set(rawTeams.map(t => t.trim()).filter(Boolean))]);
    } else if (typeof rawTeams === "string" && rawTeams) {
      // legacy: handle old comma-separated string from DB
      setSelectedTeams([...new Set((rawTeams as string).split(/[,;\n]+/).map(t => t.trim()).filter(Boolean))]);
    } else {
      setSelectedTeams([]);
    }
  }, [initialValue]);

  // Combine and update sector in profile
  const updateSectorValue = (sector: string, isCustom: boolean, customVal: string, detailVal: string) => {
    let finalSector = "";
    if (isCustom || sector === "Other") {
      finalSector = customVal.trim();
    } else {
      finalSector = sector.trim();
    }

    let finalIndustry = finalSector;
    if (detailVal.trim() && finalSector) {
      finalIndustry = `${finalSector} — ${detailVal.trim()}`;
    } else if (detailVal.trim() && !finalSector) {
      finalIndustry = detailVal.trim();
    }

    setProfile(prev => ({ ...prev, businessIndustry: finalIndustry }));
  };

  const handleSelectSector = (sector: string) => {
    if (sector === "Other") {
      setSelectedSector("Other");
      setIsCustomSectorMode(true);
      updateSectorValue("Other", true, customSector, sectorDetail);
    } else {
      setSelectedSector(sector);
      setIsCustomSectorMode(false);
      updateSectorValue(sector, false, "", sectorDetail);
    }
  };

  const handleCustomSectorChange = (val: string) => {
    setCustomSector(val);
    updateSectorValue("Other", true, val, sectorDetail);
  };

  const handleSectorDetailChange = (val: string) => {
    setSectorDetail(val);
    updateSectorValue(selectedSector, isCustomSectorMode, customSector, val);
  };

  // Toggle or add responsible teams
  const toggleTeam = (team: string) => {
    let updated: string[];
    if (selectedTeams.includes(team)) {
      updated = selectedTeams.filter(t => t !== team);
    } else {
      updated = [...selectedTeams, team];
    }
    setSelectedTeams(updated);
    setProfile(prev => ({ ...prev, processMiningTeam: updated }));
  };

  const handleAddCustomTeam = () => {
    const trimmed = customTeamInput.trim();
    if (!trimmed) return;
    if (!selectedTeams.includes(trimmed)) {
      const updated = [...selectedTeams, trimmed];
      setSelectedTeams(updated);
      setProfile(prev => ({ ...prev, processMiningTeam: updated }));
    }
    setCustomTeamInput("");
  };

  const handleRemoveTeam = (team: string) => {
    const updated = selectedTeams.filter(t => t !== team);
    setSelectedTeams(updated);
    setProfile(prev => ({ ...prev, processMiningTeam: updated }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(profile);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ─── QUESTION 1: WHAT SECTOR (Choice-able) ─── */}
      <div
        className="rounded-xl p-5 sm:p-6 transition-all"
        style={{ backgroundColor: "var(--bg-3)", border: "1px solid var(--border-2)" }}
      >
        <div className="mb-3 flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-xs font-black text-purple-400">
            A
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-400" />
              <p className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Industry Sector
              </p>
            </div>
            <label className="mt-1 block text-base font-semibold t-primary">
              What sector or industry does your company operate in?
            </label>
            <p className="mt-0.5 text-xs t-muted">
              Select your primary industry or specify a custom sector.
            </p>
          </div>
        </div>

        {/* Sector Choice Pills */}
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESET_SECTORS.map(sector => {
            const isSelected = selectedSector === sector && !isCustomSectorMode;
            return (
              <button
                key={sector}
                type="button"
                onClick={() => handleSelectSector(sector)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/25 ring-2 ring-purple-400"
                    : "border hover:border-purple-500/50 hover:bg-purple-500/5 t-secondary"
                }`}
                style={
                  !isSelected
                    ? { backgroundColor: "var(--bg)", borderColor: "var(--border)" }
                    : undefined
                }
              >
                {isSelected && <Check className="h-3.5 w-3.5" />}
                {sector}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => handleSelectSector("Other")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
              isCustomSectorMode
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/25 ring-2 ring-purple-400"
                : "border hover:border-purple-500/50 hover:bg-purple-500/5 t-secondary"
            }`}
            style={
              !isCustomSectorMode
                ? { backgroundColor: "var(--bg)", borderColor: "var(--border)" }
                : undefined
            }
          >
            {isCustomSectorMode && <Check className="h-3.5 w-3.5" />}
            Other / Custom
          </button>
        </div>

        {/* Custom Sector Input if "Other" is selected */}
        {isCustomSectorMode && (
          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium t-muted">Specify Sector Name</label>
            <input
              type="text"
              required
              value={customSector}
              onChange={e => handleCustomSectorChange(e.target.value)}
              placeholder="e.g. Aerospace, Renewable Energy, FinTech..."
              className="w-full rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              style={{
                backgroundColor: "var(--bg)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        )}

        {/* Optional details on what company does */}
        <div className="mt-3 pt-3" style={{ borderTop: "1px dashed var(--border-2)" }}>
          <label className="mb-1 block text-xs font-medium t-muted">
            Company Activities & Overview (Optional detail)
          </label>
          <textarea
            rows={2}
            value={sectorDetail}
            onChange={e => handleSectorDetailChange(e.target.value)}
            placeholder="Briefly describe what your company does, core products, or market position..."
            className="w-full resize-y rounded-lg px-3 py-2 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-purple-500/50"
            style={{
              backgroundColor: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* Hidden validator input if required */}
        <input
          type="text"
          className="sr-only"
          tabIndex={-1}
          required
          value={profile.businessIndustry}
          onChange={() => {}}
        />
      </div>

      {/* ─── QUESTION 2: WHO IS RESPONSIBLE (Choice-able & Multi-Select) ─── */}
      <div
        className="rounded-xl p-5 sm:p-6 transition-all"
        style={{ backgroundColor: "var(--bg-3)", border: "1px solid var(--border-2)" }}
      >
        <div className="mb-3 flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-xs font-black text-purple-400">
            B
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Users2 className="h-4 w-4 text-purple-400" />
              <p className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Responsible Team & Roles
              </p>
            </div>
            <label className="mt-1 block text-base font-semibold t-primary">
              Who is responsible for Process Mining in your company?
            </label>
            <p className="mt-0.5 text-xs t-muted">
              Select one or more departments/units. These teams will directly populate the available roles when you create team member accounts.
            </p>
          </div>
        </div>

        {/* Active Selected Badges */}
        {selectedTeams.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg p-2.5" style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border)" }}>
            <span className="text-xs font-semibold t-muted mr-1">Selected roles:</span>
            {selectedTeams.map(team => (
              <span
                key={team}
                className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-purple-500/15 px-2.5 py-1 text-xs font-semibold text-purple-300 shadow-sm"
              >
                <Check className="h-3 w-3 text-purple-400" />
                {team}
                <button
                  type="button"
                  onClick={() => handleRemoveTeam(team)}
                  className="rounded-full p-0.5 hover:bg-purple-500/30 text-purple-300 transition-colors"
                  title={`Remove ${team}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Choice Chips for Popular Responsible Teams */}
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESET_RESPONSIBLE_TEAMS.map(team => {
            const isSelected = selectedTeams.includes(team);
            return (
              <button
                key={team}
                type="button"
                onClick={() => toggleTeam(team)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/25 ring-2 ring-purple-400"
                    : "border hover:border-purple-500/50 hover:bg-purple-500/5 t-secondary"
                }`}
                style={
                  !isSelected
                    ? { backgroundColor: "var(--bg)", borderColor: "var(--border)" }
                    : undefined
                }
              >
                {isSelected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5 opacity-60" />}
                {team}
              </button>
            );
          })}
        </div>

        {/* Add Custom Responsible Team / Department */}
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={customTeamInput}
            onChange={e => setCustomTeamInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomTeam();
              }
            }}
            placeholder="Add another department/unit (e.g., PMO, Logistics, Risk)..."
            className="flex-1 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500/50"
            style={{
              backgroundColor: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
          <button
            type="button"
            onClick={handleAddCustomTeam}
            disabled={!customTeamInput.trim()}
            className="btn-secondary !px-3 !py-2 text-xs gap-1.5 disabled:opacity-40 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Team
          </button>
        </div>

        {/* Hidden validator input if required */}
        <input
          type="text"
          className="sr-only"
          tabIndex={-1}
          required
          value={profile.processMiningTeam.join(", ")}
          onChange={() => {}}
        />
        {selectedTeams.length === 0 && (
          <p className="mt-2 text-xs text-amber-400/80 flex items-center gap-1">
            * Please select at least one responsible team or add a custom department.
          </p>
        )}
      </div>

      {/* ─── REMAINING STANDARD QUESTIONS ─── */}
      {STANDARD_TEXT_QUESTIONS.map(({ key, label, question, placeholder }, index) => (
        <div
          key={key}
          className="rounded-xl p-5 sm:p-6 transition-all"
          style={{ backgroundColor: "var(--bg-3)", border: "1px solid var(--border-2)" }}
        >
          <div className="mb-2 flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-xs font-black text-purple-400">
              {String.fromCharCode(67 + index)}
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-purple-400">{label}</p>
              <label htmlFor={`company-profile-${key}`} className="mt-1 block text-base font-semibold t-primary">
                {question}
              </label>
            </div>
          </div>
          <textarea
            id={`company-profile-${key}`}
            required
            rows={4}
            maxLength={5000}
            value={profile[key]}
            onChange={event => setProfile(previous => ({ ...previous, [key]: event.target.value }))}
            placeholder={placeholder}
            className="mt-2 w-full resize-y rounded-lg px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-purple-500/50"
            style={{
              backgroundColor: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>
      ))}

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={submitting} className="btn-primary min-w-48 gap-2">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
