# Auth components

These components compose the [shared Karta UI kit](../ui/README.md) for `/auth/*`. The shell owns auth layout and content; reusable controls and theme tokens live in `components/ui` and also serve public pages.

## Anatomy and layout

- `AuthShell`: shared brand and theme controls, help link, twelve-column main grid, assessment preview, form region, and footer. Header/footer use the public 1600px container and 48px gutters (24px below 1024px). The main grid is capped at 1200px, uses a 24px gap, and limits forms to 432px. Below 768px the form becomes the sole main column.
- `AuthField`: compatibility export of `TextField`, with an associated label, optional recovery action, input, optional password toggle, and persistent 12/16 supporting text. Fields use 24px gaps and major groups 32px.
- `PrimaryButton`: wraps the shared `Button` with a trailing arrow and full width; pending state replaces the arrow with a spinner. `GoogleButton` uses its secondary variant and retains the provider redirect behavior. Navigation actions use `ButtonLink`.
- `CodeInput`: one native six-digit field with numeric keyboard, OTP autofill, and paste normalization. A single field supports selection and correction without moving between six separate controls.
- `FormError`, resend notices, dividers, and loading states use the shared feedback primitives; errors use an alert and success/resend messages use status announcements.

## Tokens and states

`auth.module.css` consumes shared `--ui-*` tokens directly. It does not define a separate auth palette. The lavender panel, ink text, paper surfaces, coral graphic, and blue actions come from the same foundations as the public landing page and documentation. Light/dark overrides, validation colors, outlines, and interaction overlays live in `ui/tokens.css`.

Inter typography uses 32/40 medium headings, 16/24 body text, 14/24 labels and links, and 12/16 supporting text. Buttons use the public kit's 14/24 medium sentence-case labels. All numbers are tabular. Controls share the public 8px radius, cards use 16px, and the story panel uses 24px. Mobile input text is 16px. The preview contains no inset imagery.

| Component | Default | Hover / pressed | Focus | Disabled / pending | Error |
| --- | --- | --- | --- | --- | --- |
| Primary button | Blue surface, white label | 8% / 24% dark-blue mix | Visible outline | Neutral surface, disabled action, progress label and spinner | Form alert |
| Secondary / icon / text action | Neutral surface or underlined link | 8% / 24% primary overlay | Visible outline | Disabled with readable text | Form alert |
| Input | White surface, neutral outline | Stronger outline | Primary outline and 16% overlay ring | Neutral surface | Error outline and supporting message |
| Role / plan choice | Native radio, neutral outline | 8% overlay | Visible outline | Not applicable to the setup step | Native validation |
| Selected choice | 12% primary overlay and primary outline | Same selection remains visible | Native radio keyboard behavior | Not applicable | Not applicable |

## Usage and behavior

Use this shell only for authentication and account recovery. The assessment is explicitly labeled example data, uses Karta's seven HP3M dimensions, and is not an interactive dashboard. Do not present it as the signed-in user's results.

The existing auth hook and API contracts remain in use: email/password sign-in, Google redirect/callback, role/plan registration, email verification, resend, and password recovery. Registration moves focus to the heading when the step changes. Busy forms disable repeated submissions, resend requests have pending and cooldown states, and all timers clean up on unmount. The verification-only entry redirects users without a session to sign-in after verification.

Google signup retains the existing backend redirect behavior; it does not send the email signup role/plan selection to the provider. Backend OAuth behavior is outside these presentation components.

Inputs use native required/type/minimum-length validation and autocomplete. Six-digit codes support paste and mobile autofill. Password visibility is a labeled keyboard-accessible button. Animation is limited to request progress and interaction feedback; reduced-motion disables animation and transitions. Empty forms show specific placeholder examples and supporting instructions.

## Extending the UI

Use `components/ui` directly when building new pages. Add generic controls there, and keep auth API calls, provider redirects, OTP normalization, registration choices, and step navigation here. `auth.module.css` should contain only layout, content-specific presentation, and compositions of shared styles. This prevents future auth pages from drifting away from the public interface.
