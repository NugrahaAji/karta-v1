export const DOC_PAGES = [
    { slug: "getting-started", title: "Getting started", description: "Get started with Karta. Choose your role, understand the assessment cycle, and find the right guide for your process mining maturity assessment." },
    { slug: "company-guide", title: "Company guide", description: "Set up your Karta company workspace, invite assessors, manage sessions, review maturity scores, and track your improvement action plan." },
    { slug: "assessor-guide", title: "Assessor guide", description: "Access your Karta assessor account, review assigned dimensions and sessions, and complete your process mining maturity assessment." },
    { slug: "reference", title: "Reference", description: "Explore the Karta assessment workflow and answers about assessor access, deadlines, score adjustments, AI analysis, and parallel sessions." },
] as const;

export type DocSlug = typeof DOC_PAGES[number]["slug"];

export function topicHref(id: string) {
    const slug: DocSlug = id.startsWith("company-") ? "company-guide" : id.startsWith("assessor-") ? "assessor-guide" : id === "timeline" || id.startsWith("faq") ? "reference" : "getting-started";
    return `/docs/${slug}#${id}`;
}
