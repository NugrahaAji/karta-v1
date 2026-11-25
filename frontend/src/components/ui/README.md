# Karta UI kit

Use these primitives for public, account, and workspace navigation. They work outside `AuthShell` and use the same light/dark tokens as the landing page and documentation. Legacy dashboard content utility classes are maintained separately; the workspace sidebar uses this kit directly.

## Foundations

`tokens.css` is imported once by `app/globals.css`. It maps the application palette and spacing scale to shared `--ui-*` semantics. Page modules may define layout variables, but should not redefine colors, control radii, or field/button states.

| Token family | Purpose |
| --- | --- |
| `--ui-surface`, `--ui-paper`, `--ui-panel`, `--ui-tile` | Page, input/card, panel, and inset surfaces |
| `--ui-ink`, `--ui-copy`, `--ui-placeholder` | Primary, supporting, and placeholder text |
| `--ui-action`, `--ui-on-action`, `--ui-action-text` | Action backgrounds, labels, and theme-aware links |
| `--ui-hover`, `--ui-selected`, `--ui-focus`, `--ui-pressed` | 8%, 12%, 16%, and 24% interaction overlays |
| `--ui-outline`, `--ui-outline-input` | Dividers and control borders |
| `--ui-error`, `--ui-error-surface` | Validation feedback |
| `--ui-feature`, `--ui-on-feature`, `--ui-coral` | Public hero artwork and inverse CTAs; coral is not body text |
| `--ui-radius-control`, `--ui-radius-card`, `--ui-radius-panel` | 8px controls, 16px cards, 24px panels |
| `--ui-font-*`, `--ui-icon-*`, `--ui-control-height` | Inter type scale, 24px / 1.75-stroke icons, 48px controls |
| `--ui-page-gutter`, `--ui-content-width`, `--ui-duration` | Responsive gutters, 1600px public container, reduced-motion-aware transitions |

Existing `--landing-action*` variables are compatibility aliases to these tokens. Landing and documentation surface aliases point to the same foundations. Theme overrides live only in `tokens.css`; `html.dark` selects dark mode.

## Components

| Component | Anatomy / properties | Layout and behavior |
| --- | --- | --- |
| `Button` | Label, optional `leadingIcon` / `trailingIcon`, progress icon; `primary`, `secondary`, `inverse`; `default` / `large` sizes | Inline flex, 12px gap, 48px minimum height (56px large), optional `fullWidth`. Defaults to `type="button"`; specify `submit` in forms. `loading` disables repeat actions, announces busy state, and replaces the trailing icon. |
| `ButtonLink` | Next link with the same visual variants and sizes | Use for navigation. Preserves link semantics, keyboard behavior, and Next link props. No simulated disabled link state. |
| `IconButton` | Native button with a required accessible `aria-label` and an icon | 48px circular target, shared hover/pressed/focus/disabled states; defaults to `type="button"`. |
| `TextField` | Associated label, optional label-row `action`, native input, required `hint`, optional `error` | 8px internal spacing, full width, native input attributes and ref. Password type includes a visibility toggle. Combines supporting-text IDs with supplied `aria-describedby`, connects errors and sets `aria-invalid`. Mobile text is 16px to avoid focus zoom. |
| `Alert` | Content plus error icon for `variant="error"`; default `notice` | 12/16px padding; errors use `role="alert"`, notices use `role="status"`. Persistent feedback remains in document flow. |
| `Divider` | Optional caption between two lines | 24px block margin; use to separate alternate actions. |
| `LoadingState` | Progress icon and descriptive message | Centered status announcement; spinner stops for reduced motion. |
| `BrandLink` | Karta mark and wordmark, home destination | Shared 24/32 typography (20px on smaller screens), mark size, spacing, and keyboard focus. Used in public navigation/footer and auth header. |

Buttons, fields, and icon actions include hover, pressed, keyboard focus, and disabled states. Fields also include invalid states; errors should tell the user how to fix the input. Native `required`, `type`, `pattern`, and `minLength` validation remain available. A disabled fieldset disables its child inputs and password buttons.

## Example

Workspace navigation also uses `IconLink` (the link equivalent of `IconButton`), `SearchField` (the shared text field with a search icon, clear action, and optional shortcut), and `NavigationLink` / `NavigationButton`. Navigation rows use 48px controls, 24px leading icons, 8px control radii, and the shared hover/selected/focus/pressed states. `compact` hides the visible label while retaining its accessible name. Only links use `aria-current`.

`BrandLink` accepts an optional `href`, `subtitle`, and `compact` mode; its public home-link defaults are unchanged. `TextField` supports leading icons and trailing adornments; `hideLabel` and `hideHint` retain accessible text when space is constrained. `LoadingState` supports `inline` and `iconOnly` layouts. Sidebar modules should only handle positioning, spacing, scrolling, and responsive layout; do not override these control styles.

```tsx
import { Button, ButtonLink, TextField, Alert } from "@/components/ui";

<form onSubmit={save} aria-busy={saving}>
  {error && <Alert variant="error">{error}</Alert>}
  <TextField
    name="email"
    label="Email address"
    type="email"
    autoComplete="email"
    hint="Use your work email address."
    required
    disabled={saving}
  />
  <Button type="submit" loading={saving} fullWidth>
    {saving ? "Saving changes…" : "Save changes"}
  </Button>
  <ButtonLink href="/docs" variant="secondary">Read the guide</ButtonLink>
</form>
```

Use layout CSS to space form fields (`--space-24` is the auth convention). Avoid overriding primitive colors, borders, or states. For a plain text link or supporting copy, compose `textLink` or `hint` from `ui.module.css`; these styles work without an auth ancestor. Keep page-specific content and authentication/network behavior out of the kit.

## Adoption and checks

`Modal` supports `placement="center"` (default) and `placement="right"` for workspace drawers. Both use the same header, tokens, focus management, dismissal controls, and responsive viewport sizing. Drawer content owns its bounded scroller and footer; keep long-running requests outside the dialog so dismissal does not discard them.

- Auth wrappers use the primitives for login, registration/verification, recovery, reset, and callback loading states.
- Public landing/footer CTAs use `ButtonLink`; public navigation/footer and auth share `BrandLink` and the icon theme toggle.
- When editing tokens or primitives, run the frontend TypeScript check and build. Review auth routes plus `/`, `/docs`, and `/hp3m` at mobile/tablet/desktop widths in both themes. Check keyboard focus, native validation, password visibility, selected choices, and pending/error feedback.
