# Company workspace

Live company routes compose the shared `components/ui` kit and `company-workspace.module.css`. Colors, type, radii, interaction overlays, and spacing use the same `--ui-*` / `--space-*` foundations as the public pages. This is separate from the temporary `/test/dashboard` project-board preview.

## Component contracts

| Component | Anatomy and properties | Layout, usage, and behavior |
| --- | --- | --- |
| `WorkspacePage` | Breadcrumb, help link, title, description, optional actions, content | Responsive page gutters; one primary page action. Provides the common page hierarchy. |
| `SectionHeading` | Section title, optional supporting description and action | Wraps actions on narrow screens; use within a page rather than duplicating its title. |
| `Metric` | Label and icon, tabular value, supporting text, optional link | Use inside `metrics`, four columns on desktop and two on small screens. Use an em dash while unavailable; never turn a failed load into zero. |
| `StatusBadge` | Semantic status, outline icon, visible label | Neutral defaults, action overlay for active/scheduled, error token for cancelled. Status remains readable without color. |
| `FilterTabs` | Named button group, selection, optional counts | Filters one collection; uses `aria-pressed`, not tab semantics. 48px controls, primary underline, 12% selection, 8% hover, 24% pressed, visible keyboard focus. Horizontally scrolls within its container. |
| `AvatarGroup` | Initials, up to three people, overflow count | Accessible full member names; empty groups say “Unassigned.” No invented images or people. |
| `EmptyState` / `ResourceError` | Icon, descriptive heading/copy, optional action or retry | Distinguish no data, no search results, and network failure. Never show a false empty state after a failed request. |
| `AssessmentCollection` | Search, sort, status filters, grid/list control, records, count | Shared by overview and assessment management. Searches title, description, and assignees. Overview limits to four matches; full list includes all. Controls retain accessible labels and keyboard focus. |
| `AssessmentEditor` / `MemberEditor` | Shared dialog, labeled fields, supporting text, choices, error, footer | Reuses `Modal`, `TextField`, `SelectField`, `ChoiceGroup`, and `Button`. Native validation, no repeat submission, dismissal disabled while saving, recoverable server errors, scrollable body. Dates round-trip through local wall time and ISO timestamps; clearing dates sends null. |
| `ConfirmAction` | Shared dialog, impact description, cancel and explicit action | Used before destructive assessment/member operations. Pending state blocks repeat actions and dismissal; failures preserve the dialog. |

## Data and routing

- `useWorkspaceAssessments` retains the existing assessment-change event and focus refresh. All writes continue to use the existing company API.
- `useWorkspaceResource` aborts obsolete reads and exposes separate pending/error/empty states. The dimensions endpoint already returns the complete nested framework; the browser no longer requests every dimension again.
- `/dashboard/manage-sessions?create=true`, `?edit=<id>`, and `?status=<status>` support overview and sidebar entry points. Results and monitoring links retain their existing destinations.
- Company members retain department roles, dimension access, activation/deactivation, account editing, and explicit removal confirmation.
- The criteria browser supports dimension/level/criterion search and native expandable sub-dimensions. Settings retain the shared company-profile form.

## Verification

Run `node --test frontend/src/lib/workspace.test.mjs`, the frontend TypeScript check, and the production build. Review 360px, tablet, and desktop widths in both themes, including empty/error states, filters, dialog scrolling, native validation, and keyboard navigation. Colors are inherited from the kit; no page-level theme palette is introduced. Motion is limited to control feedback using the reduced-motion-aware duration token.

## Assessment detail and monitoring

The company detail route uses the same UI kit and semantic tokens as the workspace. The assessment table retains the reference column order: Dimension, Sub-dimension, Assessment note, Final result, Strength / weakness, Opportunity analysis, Expected level, Action plan. Monitoring retains Dimension, Sub-dimension, Final result, Expected level, Action plan, Months 1–6, PIC, Checker, Achievement status, Notes, and a labeled edit action.

| Component | Anatomy and properties | Layout, usage, and behavior |
| --- | --- | --- |
| `ResultCharts` | Section heading, five-level spider chart, four-level bar chart, axis labels, score labels and tooltips | Groups by the exact number of levels. Charts precede the results table and stack on narrower viewports. Uses shared tokens and no animation. Missing radar scores create gaps rather than zeroes; individual results remain visible. Scrollable charts keep labels readable, and expandable lists expose every score as text. |
| `AssessmentResultsTable` | Search, dimension selection, result matrix, merged dimension/analysis/action-plan cells | Search includes notes. Recomputes contiguous spans after filtering. Sticky headings and dimension cells inside a focusable scroller. Scores open response review; target levels open the expected-level editor. |
| `ExpectedLevelDialog` | Target selector, level description, criteria, save/error state | Shared Modal and SelectField; previews criteria before saving. Request lock prevents repeats. Errors keep the selection. Target changes save independently of monitoring drafts. |
| `ResultReviewDialog` | Score/source, evaluator responses/notes, tie-resolution selector | Preserves unique highest-vote scoring and manual tie resolution. Pending operations prevent dismissal; failures keep the dialog open. |
| `MonitoringWorkspace` | Search/status filter, legend, merged table, month cells, edit dialog, save bar | All reference columns remain accessible through horizontal scrolling. Each month has an abbreviation, icon, and accessible name. The editor sets PIC, checker, monthly statuses, and multiline notes. Apply stages changes; Save monitoring persists them. Clear details preserves the plan and requires confirmation. Read-only callers omit mutation callbacks. |

`MonitoringTable.tsx` remains the shared entry point for company/admin consumers. `lib/monitoring.ts` builds dimension-ordered rows, merges contiguous cells, normalizes older row-level statuses, and emits one payload per tracking item. Company display and saving use the same manual plus AI-generated groups, including every generated action step. Filters never restrict the save payload.

Monitoring drafts survive tab changes and expected-level edits. Failed writes preserve the draft and expose a retryable error. A dirty draft blocks refresh and asks before following another workspace link; browser reload/close uses the native unsaved-change prompt. Back/forward navigation retains normal browser behavior.

## Assessment analysis panel and scroll behavior

`AiReasoningPanel` uses the UI kit's `Modal` with `placement="right"`. Its anatomy is a shared header, assessment context, Activity/Findings selectors, a bounded content scroller, and a persistent action footer. It receives an `AnalysisSnapshot` and callbacks; API requests and lifecycle state live in `AiAnalysisProvider` at the workspace level. Search, expanded findings, the selected view, and each view's scroll position survive closing and reopening the panel.

Activity shows actual requests and their completion/save/error events. Findings show searchable, expandable analysis and actions. Closing the drawer or navigating within the workspace does not cancel analysis or saving. Duplicate submissions are prevented. A failed save keeps the generated findings and retries only persistence. Saved analyses hydrate from the assessment response instead of showing an empty locked panel. No free-text chat control is shown because the existing API accepts assessment evidence rather than chat prompts.

The provider is keyed by the signed-in user and caches each assessment independently in memory. Reloading the browser restores saved findings from the server; unsaved request history is scoped to the current workspace visit. Ending that workspace aborts its pending requests. Analysis continues to use the existing proxy, with saves through the authenticated company endpoint.

The persistent workspace scroll container resets only when the pathname changes. Query/tab changes and asynchronous updates do not trigger a reset. Scroll anchoring is disabled on the workspace and dense table scrollers, and table/drawer scrolling does not chain into the page. The public smooth-scroll animation frame is cancelled on cleanup. Charts reserve their height; the spider plot has a larger radius and labels, while the bar card keeps a compact independent height and width. Container queries stack the charts when the content area is too narrow.

Regression checks: `node --test frontend/src/lib/ai-analysis.test.mjs` verifies subscriber close/reopen, background completion, save-only retries, request isolation, locked analysis restoration, cancellation, immutable submitted targets, and empty responses.

Checks: `node --test frontend/src/lib/assessment-results.test.mjs frontend/src/lib/assessment-charts.test.mjs frontend/src/lib/monitoring.test.mjs frontend/src/lib/workspace.test.mjs`, `node node_modules/typescript/bin/tsc --noEmit --incremental false -p frontend/tsconfig.json`, and `npm run build --workspace=frontend`. Tests cover scoring/ties, radar gaps, analysis identity, overlapping plans and groups shared across dimensions, extra action steps, merged table geometry, legacy statuses, and generated plan persistence.
