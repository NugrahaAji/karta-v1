"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Building2,
    ChevronDown, ClipboardList, Clock, Info, Lightbulb, Menu, Search, TriangleAlert, X,
} from "lucide-react";
import { GUIDE_CHAPTERS, FAQS, type GuideChapter, type GuideRole } from "./guide-content";
import styles from "./docs.module.css";
import { DOC_PAGES, topicHref, type DocSlug } from "./routes";

type Navigate = (event: MouseEvent<HTMLAnchorElement>, id: string) => void;

const COMPANY_CHAPTERS = GUIDE_CHAPTERS.filter(chapter => chapter.role === "company");
const ASSESSOR_CHAPTERS = GUIDE_CHAPTERS.filter(chapter => chapter.role === "assessor");
const PAGE_SECTIONS = [
    { id: "overview", title: "Overview" },
    { id: "user-roles", title: "Choose your guide" },
    { id: "company-guide", title: "Company guide" },
    { id: "assessor-guide", title: "Assessor guide" },
    { id: "timeline", title: "Assessment workflow" },
    { id: "faq", title: "Common questions" },
];
const CONTENTS = [
    { title: "Getting started", items: PAGE_SECTIONS.slice(0, 2) },
    { title: "Company guide", items: COMPANY_CHAPTERS },
    { title: "Assessor guide", items: ASSESSOR_CHAPTERS },
    { title: "Reference", items: PAGE_SECTIONS.slice(4) },
];
const SEARCH_INDEX = [
    ...PAGE_SECTIONS.map(section => ({ ...section, category: "User guide", text: section.title, description: "Explore the Karta user guide." })),
    ...GUIDE_CHAPTERS.map(chapter => ({
        id: chapter.id, title: chapter.title,
        category: chapter.role === "company" ? "Company guide" : "Assessor guide",
        description: chapter.summary,
        text: [chapter.title, chapter.role, chapter.summary, ...chapter.steps, chapter.callout?.text ?? "", ...(chapter.highlights ?? []).map(item => `${item.title} ${item.description}`)].join(" "),
    })),
    ...FAQS.map((faq, index) => ({ id: `faq-${index + 1}`, title: faq.question, category: "Common questions", description: faq.answer, text: `${faq.question} ${faq.answer}` })),
];
const OBSERVED_IDS = ["overview", "user-roles", "company-guide", ...COMPANY_CHAPTERS.map(c => c.id), "assessor-guide", ...ASSESSOR_CHAPTERS.map(c => c.id), "timeline", "faq"];

function ChapterLink({ id, children, onNavigate, className, current = false }: { id: string; children: ReactNode; onNavigate: Navigate; className?: string; current?: boolean }) {
    return <Link href={topicHref(id)} className={className} aria-current={current ? "location" : undefined} onClick={event => onNavigate(event, id)}>{children}</Link>;
}

function Contents({ slug, activeId, query, onQuery, onNavigate, mobile = false }: {
    slug: DocSlug; activeId: string; query: string; onQuery: (query: string) => void; onNavigate: Navigate; mobile?: boolean;
}) {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const results = terms.length ? SEARCH_INDEX.filter(item => terms.every(term => item.text.toLowerCase().includes(term))) : [];
    const inputId = mobile ? "docs-mobile-search" : "docs-search";

    return (
        <div className={styles.contents}>
            <label className={styles.search} htmlFor={inputId}>
                <Search aria-hidden="true" />
                <input id={inputId} type="search" placeholder="Search the guide" aria-label="Search the user guide" aria-describedby={`${inputId}-help`} autoComplete="off" value={query} onChange={event => onQuery(event.target.value)} />
                {query && <button type="button" aria-label="Clear search" onClick={() => onQuery("")}><X aria-hidden="true" /></button>}
            </label>
            <p id={`${inputId}-help`} className={styles.searchHelp}>Find a topic, task, or answer.</p>
            {terms.length > 0 ? (
                <div className={styles.searchResults}>
                    <p className={styles.navHeading} role="status">{results.length} {results.length === 1 ? "result" : "results"}</p>
                    {results.length ? (
                        <ul>
                            {results.map(result => (
                                <li key={result.id}>
                                    <ChapterLink id={result.id} onNavigate={onNavigate} className={styles.searchResult}>
                                        <small>{result.category}</small>
                                        <strong>{result.title}</strong>
                                        <span>{result.description}</span>
                                    </ChapterLink>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className={styles.emptySearch}>
                            <p>No matching topics.</p>
                            <span>Try “session”, “score”, or “deadline”.</span>
                            <button type="button" onClick={() => onQuery("")}>Show all topics <ArrowRight aria-hidden="true" /></button>
                        </div>
                    )}
                </div>
            ) : (
                <nav aria-label={mobile ? "Mobile documentation contents" : "Documentation contents"}>
                    {DOC_PAGES.map((page, index) => (
                        <div className={styles.navGroup} key={page.slug}>
                            <Link href={`/docs/${page.slug}`} className={styles.pageLink} aria-current={slug === page.slug ? "page" : undefined} onClick={() => onQuery("")}>{page.title}</Link>
                            {slug === page.slug && <ul>
                                {CONTENTS[index].items.map(item => (
                                    <li key={item.id}>
                                        <ChapterLink id={item.id} onNavigate={onNavigate} current={activeId === item.id} className={styles.navItem}>{item.title}</ChapterLink>
                                    </li>
                                ))}
                            </ul>}
                        </div>
                    ))}
                </nav>
            )}
            <Link href="/dashboard" className={styles.workspaceLink}>Open workspace <ArrowUpRight aria-hidden="true" /></Link>
        </div>
    );
}

function RoleCard({ role, onNavigate }: { role: GuideRole; onNavigate: Navigate }) {
    const isCompany = role === "company";
    const Icon = isCompany ? Building2 : ClipboardList;
    return (
        <ChapterLink id={isCompany ? "company-guide" : "assessor-guide"} onNavigate={onNavigate} className={styles.roleCard}>
            <Icon aria-hidden="true" />
            <h3>{isCompany ? "Company guide" : "Assessor guide"}</h3>
            <p>{isCompany ? "Create a workspace, invite assessors, manage sessions, and review your results." : "Sign in with your company invitation, review assigned dimensions, and submit an assessment."}</p>
            <span className={styles.cardLink}>Read the guide <ArrowRight aria-hidden="true" /></span>
        </ChapterLink>
    );
}

function Callout({ callout }: { callout: NonNullable<GuideChapter["callout"]> }) {
    const Icon = callout.type === "warning" ? TriangleAlert : callout.type === "tip" ? Lightbulb : Info;
    return (
        <aside className={styles.callout} aria-label={callout.type === "warning" ? "Important" : callout.type === "tip" ? "Tip" : "Note"}>
            <Icon aria-hidden="true" />
            <div><strong>{callout.type === "warning" ? "Important" : callout.type === "tip" ? "Tip" : "Note"}</strong><p>{callout.text}</p></div>
        </aside>
    );
}

function Chapter({ chapter, number, onNavigate }: { chapter: GuideChapter; number: number; onNavigate: Navigate }) {
    return (
        <section id={chapter.id} className={styles.chapter} tabIndex={-1} aria-labelledby={`${chapter.id}-title`}>
            <div className={styles.chapterMeta}><span>Chapter {String(number).padStart(2, "0")}</span>{chapter.duration && <span><Clock aria-hidden="true" />{chapter.duration.replace("Estimated time: ", "")}</span>}</div>
            <h2 id={`${chapter.id}-title`}>{chapter.title}</h2>
            <p className={styles.chapterSummary}>{chapter.summary}</p>
            <ol className={styles.instructions}>
                {chapter.steps.map((step, index) => <li key={index}><span aria-hidden="true">{index + 1}</span><p>{step}</p></li>)}
            </ol>
            {chapter.highlights && <div className={styles.highlights}>{chapter.highlights.map(item => <div key={item.title}><h3>{item.title}</h3><p>{item.description}</p></div>)}</div>}
            {chapter.callout && <Callout callout={chapter.callout} />}
            {chapter.id === "company-account" && <Link href="/auth/register" className={styles.textLink}>Create your company account <ArrowUpRight aria-hidden="true" /></Link>}
            {chapter.id === "assessor-login" && <Link href="/auth/login" className={styles.textLink}>Open the sign-in page <ArrowUpRight aria-hidden="true" /></Link>}
            {chapter.handoff && <div className={styles.handoff}><p>{chapter.handoff.text}</p><ChapterLink id={chapter.handoff.id} onNavigate={onNavigate} className={styles.textLink}>{chapter.handoff.label}<ArrowRight aria-hidden="true" /></ChapterLink></div>}
        </section>
    );
}

function Guide({ role, onNavigate }: { role: GuideRole; onNavigate: Navigate }) {
    const isCompany = role === "company";
    const chapters = isCompany ? COMPANY_CHAPTERS : ASSESSOR_CHAPTERS;
    return (
        <div className={styles.guide}>
            <section id={`${role}-guide`} className={styles.guideHeading} tabIndex={-1} aria-labelledby={`${role}-title`}>
                <h1 id={`${role}-title`}>{isCompany ? "Company guide" : "Assessor guide"}</h1>
                <p>{isCompany ? "Set up your company workspace, run an assessment session, and track improvements from the results." : "Access your assignment, assess your company’s current practices, and submit your responses."}</p>
            </section>
            {chapters.map((chapter, index) => <Chapter key={chapter.id} chapter={chapter} number={index + 1} onNavigate={onNavigate} />)}
        </div>
    );
}

export default function DocsPage({ slug }: { slug: DocSlug }) {
    const router = useRouter();
    const pageNumber = DOC_PAGES.findIndex(page => page.slug === slug);
    const firstSectionId = CONTENTS[pageNumber].items[0].id;
    const [activeId, setActiveId] = useState(slug === "company-guide" ? "company-guide" : slug === "assessor-guide" ? "assessor-guide" : slug === "reference" ? "timeline" : "overview");
    const [query, setQuery] = useState("");
    const [mobileOpen, setMobileOpen] = useState(false);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const focusMobileSearch = useRef(false);

    useEffect(() => {
        const revealHash = () => {
            const id = window.location.hash.slice(1);
            if (!id) return;
            const target = document.getElementById(id);
            if (target instanceof HTMLDetailsElement) {
                target.open = true;
                target.scrollIntoView({ block: "start" });
            }
            // Preserve links to chapters from the former single-page guide.
            if (!target && SEARCH_INDEX.some(item => item.id === id)) {
                router.replace(topicHref(id));
            }
        };
        revealHash();
        window.addEventListener("hashchange", revealHash);
        window.addEventListener("popstate", revealHash);
        return () => {
            window.removeEventListener("hashchange", revealHash);
            window.removeEventListener("popstate", revealHash);
        };
    }, [router, slug]);

    useEffect(() => {
        let frame = 0;
        const updateActive = () => {
            frame = 0;
            let current = firstSectionId;
            for (const id of OBSERVED_IDS) {
                const element = document.getElementById(id);
                if (element && element.getBoundingClientRect().top <= 144) current = id;
            }
            setActiveId(current);
        };
        const onScroll = () => { if (!frame) frame = requestAnimationFrame(updateActive); };
        updateActive();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
    }, [firstSectionId]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                if (window.matchMedia("(max-width: 900px)").matches) {
                    if (dialogRef.current?.open) {
                        document.getElementById("docs-mobile-search")?.focus();
                    } else {
                        focusMobileSearch.current = true;
                        setMobileOpen(true);
                    }
                } else {
                    document.getElementById("docs-search")?.focus();
                }
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!mobileOpen || !dialog) return;
        dialog.showModal();
        if (focusMobileSearch.current) {
            document.getElementById("docs-mobile-search")?.focus();
            focusMobileSearch.current = false;
        }
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const desktop = window.matchMedia("(min-width: 901px)");
        const onResize = () => { if (desktop.matches) setMobileOpen(false); };
        desktop.addEventListener("change", onResize);
        return () => { dialog.close(); document.body.style.overflow = previousOverflow; desktop.removeEventListener("change", onResize); };
    }, [mobileOpen]);

    const navigate: Navigate = (event, id) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const target = document.getElementById(id);
        if (!target) { setMobileOpen(false); return; }
        event.preventDefault();
        setMobileOpen(false);
        if (target instanceof HTMLDetailsElement) target.open = true;
        window.history.pushState(null, "", `#${id}`);
        requestAnimationFrame(() => {
            target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
            target.focus({ preventScroll: true });
        });
    };

    return (
        <div className={styles.page}>
            <a href="#docs-content" className={styles.skipLink}>Skip to guide content</a>
            <div className={styles.mobileBar}><button type="button" className={styles.mobileToggle} aria-controls="docs-mobile-navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Menu aria-hidden="true" />Contents & search</button></div>
            <div className={styles.layout}>
                <aside className={styles.sidebar} aria-label="Guide navigation" data-lenis-prevent>
                    <Contents slug={slug} activeId={activeId} query={query} onQuery={setQuery} onNavigate={navigate} />
                </aside>

                <main id="docs-content" className={styles.main} tabIndex={-1}>
                    {slug === "getting-started" && <><section id="overview" className={styles.overview} tabIndex={-1} aria-labelledby="docs-title">
                        <h1 id="docs-title">Getting started</h1>
                        <p className={styles.lead}>Use Karta to assess your company’s process mining maturity. Follow the guide for your role to set up a session or complete an assessment.</p>
                    </section>

                    <section id="user-roles" className={styles.roleSection} tabIndex={-1} aria-labelledby="roles-title">
                        <div className={styles.sectionIntro}><h2 id="roles-title">Choose your guide</h2><p>Company accounts manage the assessment. Assessors receive their sign-in credentials from the company.</p></div>
                        <div className={styles.roleCards}><RoleCard role="company" onNavigate={navigate} /><RoleCard role="assessor" onNavigate={navigate} /></div>
                    </section>

                    </>}
                    {slug === "company-guide" && <Guide role="company" onNavigate={navigate} />}
                    {slug === "assessor-guide" && <Guide role="assessor" onNavigate={navigate} />}

                    {slug === "reference" && <><header className={styles.guideHeading}><h1>Reference</h1><p>The assessment workflow and answers to common questions about accounts, sessions, and results.</p></header><section id="timeline" className={styles.referenceSection} tabIndex={-1} aria-labelledby="timeline-title">
                        <div className={styles.sectionIntro}><h2 id="timeline-title">Assessment workflow</h2><p>Each session follows three stages, from company setup to reviewing the results.</p></div>
                        <div className={styles.timeline}>
                            <div><span className={styles.timelineNumber}>01</span><div><h3>Company setup</h3><p>Create an account, complete onboarding, add assessors, and open an assessment session.</p><ChapterLink id="company-account" onNavigate={navigate} className={styles.textLink}>Set up your workspace <ArrowRight aria-hidden="true" /></ChapterLink></div></div>
                            <div><span className={styles.timelineNumber}>02</span><div><h3>Assessor submission</h3><p>Receive credentials, sign in, check assigned dimensions and sessions, then complete and submit an honest assessment before the deadline.</p><ChapterLink id="assessor-login" onNavigate={navigate} className={styles.textLink}>Complete an assessment <ArrowRight aria-hidden="true" /></ChapterLink></div></div>
                            <div><span className={styles.timelineNumber}>03</span><div><h3>Review and follow-up</h3><p>Monitor results, adjust scores with justification if needed, run AI analysis, and track the action plan over time.</p><ChapterLink id="company-results" onNavigate={navigate} className={styles.textLink}>Understand your results <ArrowRight aria-hidden="true" /></ChapterLink></div></div>
                        </div>
                    </section>

                    <section id="faq" className={styles.referenceSection} tabIndex={-1} aria-labelledby="faq-title">
                        <div className={styles.sectionIntro}><h2 id="faq-title">Common questions</h2></div>
                        <div className={styles.faqList}>{FAQS.map((faq, index) => <details key={faq.question} id={`faq-${index + 1}`} tabIndex={-1}><summary>{faq.question}<ChevronDown aria-hidden="true" /></summary><p>{faq.answer}</p></details>)}</div>
                    </section>

                    </>}
                    <nav className={styles.pagination} aria-label="Guide pagination">{DOC_PAGES[pageNumber - 1] ? <Link rel="prev" href={`/docs/${DOC_PAGES[pageNumber - 1].slug}`}><small><ArrowLeft aria-hidden="true" /> Previous</small><strong>{DOC_PAGES[pageNumber - 1].title}</strong></Link> : <span />}{DOC_PAGES[pageNumber + 1] ? <Link rel="next" href={`/docs/${DOC_PAGES[pageNumber + 1].slug}`}><small>Next <ArrowRight aria-hidden="true" /></small><strong>{DOC_PAGES[pageNumber + 1].title}</strong></Link> : <Link href="/docs/getting-started"><small>Back to</small><strong>Getting started</strong></Link>}</nav>

                    <div className={styles.articleFooter}><span>Guide last updated September 2026</span><ChapterLink id={slug === "company-guide" ? "company-guide" : slug === "assessor-guide" ? "assessor-guide" : slug === "reference" ? "timeline" : "overview"} onNavigate={navigate}>Back to top <ArrowUp aria-hidden="true" /></ChapterLink></div>
                </main>


            </div>

            <dialog ref={dialogRef} id="docs-mobile-navigation" className={styles.mobileDialog} aria-labelledby="docs-mobile-title" onCancel={() => setMobileOpen(false)} onClick={event => { if (event.target === event.currentTarget) setMobileOpen(false); }}>
                <div className={styles.dialogHeader}><h2 id="docs-mobile-title">Guide contents</h2><button type="button" aria-label="Close guide contents" onClick={() => setMobileOpen(false)}><X aria-hidden="true" /></button></div>
                <div className={styles.dialogContents} data-lenis-prevent>{mobileOpen && <Contents slug={slug} activeId={activeId} query={query} onQuery={setQuery} onNavigate={navigate} mobile />}</div>
            </dialog>
        </div>
    );
}
