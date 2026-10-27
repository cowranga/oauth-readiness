# Design

Goal: the app should look like a page from Composio's own dashboard. Use their visual language. Do not spend long on polish: product decisions matter more than pixels. Time box all styling work to about 45 minutes total.

Source: Composio brand hub, https://brand.composio.dev/guidelines and https://brand.composio.dev/colors (read Oct 2026). Re-read both pages in Task 0.2 and follow them over this file if they differ. Ignore third-party "Composio-inspired" design specs online: they use retired fonts (ABC Diatype) and a retired blue (#0007cd).

## Surface

Use the DEV (dark) surface everywhere. It is Composio's developer surface and matches an internal tool. Do not mix light and dark in one section. Exception: the print stylesheet uses the light values so printed guides stay readable.

## Fonts

- **Geist Sans** for everything: headings, body, UI, buttons. Load with the `geist` npm package (`geist/font/sans`). Weights 400 and 500 only. Never bold. Display and H1 at 400; H2 at 500. Emphasis comes from size, not weight.
- **JetBrains Mono** (`next/font/google`) for code, scopes, URLs, badges, tier and evidence chips, version and date metadata, numbers in time tables. It may be uppercase with wide tracking in small chips. Not for headings or body text.
- No other fonts. No eyebrow labels above headings.

## Color tokens (CSS variables in `app/globals.css`, mapped into Tailwind)

| Token | Dark (use this) | Light (print only) |
|---|---|---|
| `--background` | #0f0f0f | #f6f6f6 |
| `--card` | #1e1e1e | #ffffff |
| `--popover` | #2a2a2a | #fafafa |
| `--foreground` | #ffffff | #0f0f0f |
| `--muted-foreground` | rgba(255,255,255,0.6) | rgba(15,15,15,0.6) |
| `--border` | #2c2c2c | #eaeaea |
| `--accent` (neutral hover surface, not blue) | #262626 | #f5f5f5 |
| `--brand` | #51a2ff | #51a2ff |
| `--brand-on-brand` (only text color allowed on a brand fill) | #0f0f0f | #0f0f0f |
| `--brand-ink` (links, focus rings, selected rows, any blue text) | #51a2ff | #0b6fd6 |

Semantic colors only for their literal meaning (from the brand hub, oklch):
- destructive: `oklch(0.637 0.208 25.3)`
- success: `oklch(0.648 0.17 155.8)`
- warning: `oklch(0.758 0.163 75)`

Rules:
- The interface is black, white, and greys. Brand blue is for interactive state only, about 7% of the screen. Never use it for body text on a brand fill.
- Primary button: white fill, #0f0f0f text. Secondary button: transparent with a hairline border (white at 15%). Focus ring: `--brand-ink`.
- Cards: `--card` fill, 1px `--border` hairline, small radius (6px). Hierarchy from surface contrast and whitespace, not shadows or decoration.

## Mapping our concepts onto their palette

- **Tier badges.** Neutral mono chips with a small colored dot. Tier 1 to 2: success dot. Tier 3: warning dot. Tier 4 to 5: destructive dot. This is "literal meaning" (risk level), so it is allowed.
- **Evidence badges.** Mono uppercase chips, no color fill: `TESTED` (solid white border), `PROBED`, `SOURCED`, `INFERRED` (dashed border, muted text). Do not invent new colors for them.
- **Owner tags** on steps (`AGENT`, `YOU`, `PROVIDER`): mono chips. `AGENT` may use a brand-blue dot, as it is the one interactive concept we want to highlight.
- **Live agent log:** mono text in a `--card` panel, like a terminal. Timestamps muted.
- **Use-case chips:** toggle chips (Geist, 400). Selected: brand fill with `--brand-on-brand` text. Unselected: hairline border. Matching scope-tier rows get a 2px brand left border, not a fill.
- **"Your tier":** large Geist number + label next to the chips; it updates when chips change.
- **Checklist:** native checkboxes styled with `accent-color: var(--brand)`. Checked steps go muted, not struck through. A thin progress bar (brand fill on `--border` track) under "Your next step", with "x of y" in mono.
- **Attempt-depth indicator:** 4 small mono steps in a row (`DOCS READ`, `ENDPOINTS PROBED`, `PORTAL CHECKED`, `SET UP BY A PERSON`). Reached steps in foreground color, unreached muted. A one-line tooltip explains each.
- **Provider says vs developers report:** two small stacked lines in the time table, the first labeled "Provider says", the second "Developers report". No color difference; the label carries it.

## Layout

- Max widths: 1240px page, 720px for the guide's long-form column, 520px for the generate form.
- Top bar like a dashboard: product name on the left in Geist ("OAuth Readiness"), links to Library and About, primary button "Generate guide" on the right.
- Guide page: left column is the guide (720px), right side on desktop is a sticky summary card (tier, hands-on vs wait, next step, copy buttons). On mobile the summary card sits at the top.
- Readable at 375px. No horizontal scroll.

## Branding boundary

Use their visual language, not their identity. No Composio logo or wordmark, and do not present the app as an official Composio product, since the deployed link is public. Footer: "Built as a take-home for Composio's APM Integrations role. Not an official Composio product." Mentioning Composio managed apps in guide content is fine.

## Do not

- Add a component library, icon pack, or animation library. Tailwind + a few local components. If you need a handful of icons, inline SVG.
- Spend more than about 45 minutes on styling.
