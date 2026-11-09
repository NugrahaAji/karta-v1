export type GuideRole = "company" | "assessor";

export interface GuideChapter {
    id: string;
    title: string;
    summary: string;
    role: GuideRole;
    duration?: string;
    steps: string[];
    callout?: {
        type: "tip" | "warning" | "info";
        text: string;
    };
    highlights?: {
        title: string;
        description: string;
    }[];
    handoff?: {
        id: string;
        label: string;
        text: string;
    };
}

export const GUIDE_CHAPTERS: GuideChapter[] = [
    {
        id: "company-account",
        title: "Create account and sign in",
        summary: "Create your company account to manage members, dimensions, sessions, results, and AI analysis.",
        role: "company",
        duration: "Estimated time: 2 minutes",
        steps: [
            "Open https://karta.my.id in your browser.",
            'Open the registration page at /auth/register. On the landing page, select "Start an assessment"; other entry points may use "Sign Up" or "Get Started".',
            'Choose a registration method. For Google, select "Continue with Google" and choose your Google account. For email, enter your name, email, and a password of at least 6 characters, then verify the OTP code sent to your email.',
            "After successful registration, continue with company onboarding.",
        ],
        callout: {
            type: "tip",
            text: "Use Google Auth for faster sign-up without email verification.",
        },
    },
    {
        id: "company-onboarding",
        title: "Company onboarding",
        summary: "Give the system your organization's context so AI analysis is more relevant and accurate.",
        role: "company",
        duration: "Estimated time: 5–10 minutes",
        steps: [
            "Choose your industry and the teams responsible for process mining. Add a custom industry or team if needed.",
            "Describe your process mining journey, the processes involved, and the technology you use or plan to use.",
            "Define your assessment scope and organizational readiness. Additional information is optional.",
            'Review your answers, then select "Finish setup" to open your workspace. Use "Save & sign out" to save an unfinished profile and resume later.',
        ],
        callout: {
            type: "warning",
            text: "Complete the onboarding form accurately. This data is the foundation for AI analysis. You can update it later from the company profile settings.",
        },
    },
    {
        id: "company-members",
        title: "Add members (assessors)",
        summary: "Add the team members who will act as assessors before an assessment session begins.",
        role: "company",
        duration: "Estimated time: 5 minutes",
        steps: [
            'Open "Members" in the sidebar.',
            'Select "+ Add Member".',
            'Enter the member\'s full name and email address, and select the "Assessor" role.',
            "Select one or more dimensions to assign to this assessor.",
            "Repeat for each assessor you want to add.",
        ],
        callout: {
            type: "info",
            text: "Assessors can only log in after you create their accounts. They cannot self-register.",
        },
    },
    {
        id: "company-sessions",
        title: "Create an assessment session",
        summary: "An assessment session brings assessors together to complete their assessments during a defined time period.",
        role: "company",
        duration: "Estimated time: 5 minutes",
        steps: [
            'Open "Sessions" in the sidebar.',
            'Select "+ Create New Session".',
            'Enter the session name, such as "Q3 2026 Assessment", set the start date and deadline, and select participating assessors.',
            'Select "Create Session". A notification will be sent to the selected assessors.',
        ],
        callout: {
            type: "warning",
            text: "Assessors can only fill in assessments after their accounts are created, dimensions are assigned, and they are added to an active session.",
        },
        handoff: {
            id: "assessor-login",
            label: "Read the assessor guide",
            text: "The session is created and assessors can now begin. Share their login credentials and ask them to follow the assessor guide.",
        },
    },
    {
        id: "company-results",
        title: "Monitor assessment results",
        summary: "Review assessment completion and detailed scores for each session.",
        role: "company",
        duration: "Anytime after assessors begin filling in",
        steps: [
            'Open "Results" in the sidebar.',
            "Select the session you want to monitor.",
            "View completion progress per assessor and per dimension.",
            "Select a dimension to see detailed scores.",
        ],
    },
    {
        id: "company-adjust",
        title: "Adjust final score",
        summary: "If there is a discrepancy in the final score, the Company can make a manual adjustment with a written justification.",
        role: "company",
        steps: [
            'Select the "Detail View" tab.',
            "Select the sub-dimension you want to adjust.",
            'Select "Adjust Score".',
            "Enter the considered final score.",
            "Add an adjustment note as justification.",
            'Select "Save".',
        ],
    },
    {
        id: "company-ai",
        title: "One-click AI analysis",
        summary: "Once all assessments are submitted, get an in-depth analysis powered by AI.",
        role: "company",
        duration: "Estimated time: 2–10 minutes (depends on number of dimensions)",
        steps: [
            'From the "Results" page, select "Analyze with AI".',
            "Wait for the analysis to complete.",
            "Review the full analysis results displayed by the system.",
        ],
        callout: {
            type: "info",
            text: "Analysis may take a few minutes as the AI analyzes all data in depth. Do not close the page while the process is running.",
        },
        highlights: [
            {
                title: "Dimension summary",
                description: "Strengths and areas that need improvement.",
            },
            {
                title: "Action plan recommendations",
                description: "Specific and measurable action plans.",
            },
            {
                title: "Gap analysis",
                description: "The gap between the current state and the target maturity level.",
            },
        ],
    },
    {
        id: "company-monitoring",
        title: "Action plan monitoring",
        summary: "Track implementation progress for AI-recommended action plans.",
        role: "company",
        duration: "Ongoing",
        steps: [
            'Open "Results", select a session, and select the "Monitoring" tab.',
            "View the action plan list per dimension.",
            "Update the status of each action plan.",
            "Add progress notes if needed.",
        ],
        callout: {
            type: "info",
            text: "Action plan statuses: Target, Not Started, On Going, Completed, and Delayed.",
        },
    },
    {
        id: "assessor-login",
        title: "Log in",
        summary: "Use the credentials provided by the Company to access your assigned assessments.",
        role: "assessor",
        duration: "Estimated time: 1 minute",
        steps: [
            "Check your email for the login credentials sent by the Company.",
            "Open https://karta.my.id in your browser.",
            'Select "Login" to open /auth/login.',
            "Enter the email and password you received.",
        ],
        callout: {
            type: "warning",
            text: "You cannot self-register. Your account can only be created by the Company that invited you.",
        },
    },
    {
        id: "assessor-check",
        title: "Check your assignment",
        summary: "After logging in, review the dimensions and sessions assigned to you.",
        role: "assessor",
        steps: [
            'Go to your Dashboard and look for the "Active Session" section, or open the "My Session" tab.',
        ],
        callout: {
            type: "info",
            text: "If no assignment is visible, contact your Company admin.",
        },
    },
    {
        id: "assessor-fill",
        title: "Fill in the assessment",
        summary: "Complete the assessment for your assigned dimensions and submit before the deadline set by the Company.",
        role: "assessor",
        duration: "Estimated time: 15–45 minutes (depends on number of dimensions)",
        steps: [
            'Open "Assessment" in the menu or open the assessment directly from the Dashboard.',
            "Select the available active session.",
            "Choose the dimension you are responsible for.",
            "Answer each question or indicator honestly and objectively. Select the level that best reflects the current actual condition, and add notes if needed for context.",
            'Once everything is filled in, select "Submit Assessment".',
        ],
        callout: {
            type: "warning",
            text: "Base your answers on the current actual state, not the ideal state. The submission deadline is set by the Company.",
        },
        handoff: {
            id: "company-results",
            label: "Read the company results guide",
            text: "Assessment submitted. Your part is complete. The Company will now monitor results, run AI analysis, and track action plans.",
        },
    },
];

export const FAQS: { question: string; answer: string }[] = [
    {
        question: "Can an assessor register on their own?",
        answer: "No. Assessor accounts can only be created by the Company.",
    },
    {
        question: "Can one assessor fill in more than one dimension?",
        answer: "Yes, as long as the Company assigns more than one dimension to them.",
    },
    {
        question: "What happens if an assessor hasn't submitted by the deadline?",
        answer: "The Company can view submission status on the Results page and may extend the session deadline if needed.",
    },
    {
        question: "Can assessment results be edited after submission?",
        answer: "Assessors cannot edit their own submissions. However, the Company can perform a manual Adjust Score with a written justification.",
    },
    {
        question: "How long does the AI analysis process take?",
        answer: "Usually 2–10 minutes depending on the number of dimensions and assessors involved.",
    },
    {
        question: "Can one company run multiple active sessions at once?",
        answer: "Yes. You can create and run multiple sessions in parallel for different time periods or teams.",
    },
];
