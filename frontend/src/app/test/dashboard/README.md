# Temporary dashboard layout preview

Open `/test/dashboard` with the frontend development server. The server returns
404 outside development, and the page is marked noindex. Nothing here uses the
assessment API or saves changes: all projects, people, and tasks are sample data
held in component state and reset on refresh.

The screenshot informs the layout only. Controls come from `components/ui`;
the sidebar, summary cards, board, task cards, list, and calendar compose the
existing `--ui-*` and `--space-*` tokens. These compositions are local to this
preview until a dashboard design is approved. The live dashboard is untouched.

Try sidebar collapse/mobile navigation, project switching, theme switching,
board/list/calendar views, search, high-priority and assigned-to-me filters,
sorting, adding tasks, and opening tasks to update their status or priority.

To remove the preview:

1. Delete this `app/test/dashboard` directory.
2. Remove `PreviewChromeBoundary` from `app/layout.tsx`, retaining its children,
   then delete `components/PreviewChromeBoundary.tsx`.
3. Remove the `/test/dashboard` exception in `components/LenisProvider.tsx`.
