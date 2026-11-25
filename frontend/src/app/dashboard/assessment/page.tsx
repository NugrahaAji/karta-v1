"use client";

import { useState } from "react";
import { BookOpen, CheckSquare, ChevronDown, Layers, RefreshCw } from "lucide-react";
import { Button, IconButton, LoadingState, NavigationButton, SearchField } from "@/components/ui";
import { useWorkspaceResource } from "@/hooks/useWorkspaceResource";
import { EmptyState, ResourceError, SectionHeading, WorkspacePage } from "@/components/workspace/WorkspaceUI";
import styles from "@/components/workspace/company-workspace.module.css";
import type { Dimension } from "@/types";

export default function AssessmentPage() {
    const resource = useWorkspaceResource<{ dimensions: Dimension[] }>("/dimensions");
    const [query, setQuery] = useState("");
    const [selectedId, setSelectedId] = useState("");
    const dimensions = resource.data?.dimensions ?? [];
    const search = query.trim().toLowerCase();
    const filtered = dimensions.filter(dimension => [dimension.name, dimension.detail, ...dimension.subdimensions.flatMap(sub => [sub.name, sub.detail, ...sub.levels.flatMap(level => [level.name, level.detail, ...level.criteria.flatMap(criterion => [criterion.name, criterion.detail])])])].join(" ").toLowerCase().includes(search));
    const selected = filtered.find(dimension => dimension._id === selectedId) ?? filtered[0];
    const totalCriteria = dimensions.reduce((sum, dimension) => sum + dimension.subdimensions.reduce((count, sub) => count + sub.levels.reduce((total, level) => total + level.criteria.length, 0), 0), 0);
    return <WorkspacePage title="Assessment criteria" description="Understand the HP3M framework before your team begins an assessment." actions={<IconButton aria-label="Refresh assessment criteria" title="Refresh assessment criteria" disabled={resource.loading} onClick={resource.refresh}><RefreshCw aria-hidden="true" /></IconButton>}>
        <div className={styles.toolbar}><div className={styles.search}><SearchField label="Search assessment criteria" hint="Search dimensions, maturity levels, or criteria." hideLabel hideHint placeholder="Search dimensions or criteria…" value={query} onChange={event => setQuery(event.target.value)} onClear={() => setQuery("")} /></div>{!resource.loading && !resource.error && <span className={styles.caption}>{dimensions.length} dimensions · {totalCriteria} criteria</span>}</div>
        {resource.loading ? <LoadingState>Loading the assessment framework.</LoadingState> : resource.error ? <ResourceError message="Couldn't load assessment criteria. Try again to browse the framework." retry={resource.refresh} /> : !filtered.length ? <EmptyState icon={<BookOpen />} title={dimensions.length ? "No matching criteria" : "The framework is not configured yet"} description={dimensions.length ? "Search for a different dimension, maturity level, or criterion." : "Your administrator can add the dimensions and criteria for your assessments."} action={dimensions.length ? <Button variant="secondary" onClick={() => setQuery("")}>Clear search</Button> : undefined} /> : <div className={styles.criteriaLayout}>
            <nav className={styles.dimensionNav} aria-label="Assessment dimensions">{filtered.map(dimension => <NavigationButton key={dimension._id} selected={selected?._id === dimension._id} aria-pressed={selected?._id === dimension._id} leadingIcon={<Layers />} title={dimension.name} onClick={() => setSelectedId(dimension._id)}>{dimension.name}</NavigationButton>)}</nav>
            {selected && <section className={styles.dimensionDetail} aria-label={selected.name} key={`${selected._id}-${search}`}>
                <div><SectionHeading title={selected.name} description={selected.detail || "Explore the sub-dimensions and their maturity levels."} /><p className={styles.caption} role="status">{selected.subdimensions.length} sub-dimensions · Expand a section to compare its levels.</p></div>
                {!selected.subdimensions.length && <EmptyState title="No sub-dimensions yet" description="The administrator has not added sub-dimensions to this dimension." icon={<Layers />} />}
                {selected.subdimensions.map((sub, index) => <details className={styles.accordion} key={sub._id} open={index === 0 || Boolean(search)}><summary><span>{sub.name}<span className={styles.caption}> · {sub.levels.length} levels</span></span><ChevronDown aria-hidden="true" /></summary><div className={styles.accordionBody}>
                    {sub.detail && <p className={styles.muted}>{sub.detail}</p>}
                    {!sub.levels.length && <p className={styles.muted}>No maturity levels have been configured.</p>}
                    {sub.levels.map(level => <section className={styles.level} key={level._id}><h4>{level.name}</h4>{level.detail && <p>{level.detail}</p>}<ul className={styles.criteriaList}>{level.criteria.map(criterion => <li key={criterion._id}><div><strong>{criterion.name}</strong>{criterion.detail && <p>{criterion.detail}</p>}</div><span className={styles.weight}>Weight {criterion.bobot}</span></li>)}</ul>{!level.criteria.length && <p className={styles.caption}>No criteria at this level.</p>}</section>)}
                </div></details>)}
                <div className={styles.notice}><CheckSquare aria-hidden="true" /><p>Each level describes a stage of process mining maturity. Use the criteria to select the level that best reflects your organization.</p></div>
            </section>}
        </div>}
    </WorkspacePage>;
}
