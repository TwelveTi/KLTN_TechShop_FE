# TechShop Design System

**Status:** Source of truth · **Version:** 1.0 · **Last updated:** 2026-08-07
**Applies to:** every TechShop frontend surface — Home, Auth, Profile, Admin, and all future features (catalog, cart, checkout, recommendations, AI assistant).

This document defines the complete visual language for TechShop. It is the authority for every future frontend implementation. Where this document and any component disagree, **this document wins** and the component is the bug. It supersedes the ad-hoc "Frontend Design Direction" notes in `DEVELOPMENT_LOG.md`, which it absorbs and formalizes.

It is a specification, not code. It names tokens and values; it does not ship CSS. Implementers translate these tokens into one canonical token layer and consume them by name — never by re-typing raw values.

---

## Table of contents

1. [Principles](#1-principles)
2. [Design tokens & naming](#2-design-tokens--naming)
3. [Typography](#3-typography)
4. [Color system](#4-color-system)
5. [Elevation](#5-elevation)
6. [Border radius](#6-border-radius)
7. [Shadows](#7-shadows)
8. [Spacing](#8-spacing)
9. [Grid](#9-grid)
10. [Layout](#10-layout)
11. [Motion](#11-motion)
12. [Components](#12-components)
13. [Iconography](#13-iconography)
14. [Empty states](#14-empty-states)
15. [Skeletons](#15-skeletons)
16. [Forms](#16-forms)
17. [Tables](#17-tables)
18. [Accessibility](#18-accessibility)
19. [Responsive rules](#19-responsive-rules)
20. [Governance](#20-governance)

---

## 1. Principles

TechShop should feel like a **modern production tech product** — the restraint of Linear, Stripe, Vercel, and Notion — not a generated demo. Six rules govern every decision:

1. **One system, one source of truth.** Every color, font, space, radius, shadow, and duration is a named token. No page defines its own palette; no component hardcodes a hex value. If a value is needed that no token provides, the token layer gains it first, then the component references it.
2. **Hierarchy comes from scale, not from weight.** Size, space, and color separate levels. Heading weight is capped — we do not turn every element up to bold to create emphasis.
3. **Color is earned.** A tinted-neutral surface is the default. One anchor hue (brand blue) carries interaction and identity. The accent (cyan) is a single small moment, never a second protagonist. Semantic colors (success / warning / danger) are separate from the accent and used only for state.
4. **Restraint in decoration.** No gradient hero backgrounds, no gradient headlines, no radial "glow" blooms, no glassmorphism-as-decoration, no floating orbs. Depth is communicated with elevation and space.
5. **Motion serves comprehension.** Transitions are short, scoped to specific properties, animate only `transform`/`opacity`, and always respect reduced-motion. One hover signal per element. Focus rings appear instantly.
6. **Accessible by default.** Every interactive element has all its states — including a visible focus ring. Contrast meets WCAG AA. Nothing important is hover-only.

**Explicit anti-patterns (never ship these):** blue→cyan gradient heroes/chips/tiles · a single font for display and body · pure `#000`/`#fff` as the primary ground · uppercase labels with zero tracking · unaligned number columns · `transition: all` · animated focus rings · emoji used as icons · mixed icon libraries · per-page dark mode.

---

## 2. Design tokens & naming

Tokens are two-layer. **Primitives** are the raw ramp values (they have no meaning on their own). **Semantic tokens** map primitives to a role and are what components consume. Components reference semantic tokens only; they never reach past them to a primitive or a raw value.

| Namespace | Purpose | Example token |
|---|---|---|
| `--color-*` | Semantic colors | `--color-surface`, `--color-primary` |
| `--brand-*`, `--neutral-*`, `--success-*` … | Color primitives (ramps) | `--brand-600`, `--neutral-200` |
| `--font-*` | Font families | `--font-display`, `--font-body`, `--font-mono` |
| `--text-*` | Type scale steps | `--text-h1`, `--text-body` |
| `--weight-*` | Font weights | `--weight-semibold` |
| `--space-*` | Spacing scale | `--space-4` |
| `--radius-*` | Corner radii | `--radius-md` |
| `--shadow-*` | Shadows | `--shadow-md` |
| `--elevation-*` | Elevation levels | `--elevation-2` |
| `--z-*` | Stacking tiers | `--z-modal` |
| `--dur-*`, `--ease-*` | Motion | `--dur-base`, `--ease-out` |

**Rules:** kebab-case, semantic-over-literal (`--color-danger`, not `--color-red`), one canonical token file at the project root, light and dark values defined for every semantic color token. Naming is stable — renaming a token is a breaking change and goes through governance (§20).

---

## 3. Typography

### 3.1 Font families (three roles)

| Role | Token | Typeface | Fallback stack | Usage |
|---|---|---|---|---|
| Display | `--font-display` | **Sora** | `"Segoe UI", system-ui, sans-serif` | h1–h3, hero, large numbers, page titles |
| Body / UI | `--font-body` | **Inter** | `system-ui, -apple-system, "Segoe UI", sans-serif` | all running text, labels, buttons, inputs, h4–h6 |
| Mono / data | `--font-mono` | **JetBrains Mono** | `ui-monospace, "Cascadia Code", Consolas, monospace` | SKUs, IDs, code, order codes, token/API values |

**Non-negotiable:** all three faces are **self-hosted** (bundled and served with the app), not loaded from a font CDN. The current build declares Inter but never ships it, so it silently falls back — that must never recur. A face that isn't bundled is not in the system.

The display/body pairing is mandatory. A single-font page is forbidden — Sora gives headings a distinct voice against Inter body. Mono is for data only, never for prose.

### 3.2 Type scale

Fluid where noted; base is 16px = 1rem. Headings use `--font-display`; everything else uses `--font-body`.

| Token | Size (px) | Line height | Weight | Tracking | Use |
|---|---|---|---|---|---|
| `--text-display` | 44–64 (fluid) | 1.05 | 700 | −0.02em | Hero headline only |
| `--text-h1` | 32–40 (fluid) | 1.1 | 700 | −0.015em | Page title |
| `--text-h2` | 26–30 | 1.15 | 600 | −0.01em | Section title |
| `--text-h3` | 21–24 | 1.2 | 600 | −0.005em | Card/subsection title |
| `--text-h4` | 18 | 1.3 | 600 | 0 | Group heading (body font) |
| `--text-body-lg` | 18 | 1.6 | 400 | 0 | Lead paragraph |
| `--text-body` | 16 | 1.6 | 400 | 0 | Default body |
| `--text-body-sm` | 14 | 1.5 | 400 | 0 | Secondary text, helper text |
| `--text-caption` | 12–13 | 1.4 | 500 | 0 | Captions, table meta, timestamps |
| `--text-overline` | 12 | 1.3 | 600 | +0.08em, UPPERCASE | Eyebrows/labels (used sparingly) |

### 3.3 Weights

| Token | Value | Use |
|---|---|---|
| `--weight-regular` | 400 | Body |
| `--weight-medium` | 500 | Emphasis in body, captions, nav |
| `--weight-semibold` | 600 | Buttons, labels, most headings |
| `--weight-bold` | 700 | Display and h1 only |

**Hard cap: no weight above 700 anywhere.** The current 800/900 usage is banned — it flattens hierarchy. Emphasis is carried by weight *step*, color, or size, not by maxing the weight.

### 3.4 Rules

- **Measure:** body text max ~65–75 characters per line.
- **Numerals:** tabular (monospaced figures) for anything that aligns in a column — prices, quantities, table cells, KPI values, order totals. Proportional figures for prose.
- **Uppercase labels** always carry positive tracking (`--text-overline`). Uppercase with zero tracking is banned.
- **Headings are roman** — never italic. Italic is for body-copy emphasis only.
- **Balance** headings so they don't leave a single orphaned word on the last line.
- Curly quotes, real em/en dashes (—, –), and the ellipsis character (…) in all rendered copy — never straight quotes, `--`, or `...`.

---

## 4. Color system

### 4.1 Primitive ramps

**Brand (blue) — anchor hue, carries interaction & identity**

| Token | Hex | | Token | Hex |
|---|---|---|---|---|
| `--brand-50` | `#EFF5FF` | | `--brand-500` | `#3B6EF3` |
| `--brand-100` | `#DBE7FE` | | `--brand-600` | `#2563EB` (base) |
| `--brand-200` | `#BFD3FE` | | `--brand-700` | `#1D4FD0` |
| `--brand-300` | `#93B4FD` | | `--brand-800` | `#1B44A8` |
| `--brand-400` | `#5E8CFA` | | `--brand-900` | `#1B3B85` |

**Accent (cyan) — one small moment only**

| Token | Hex | Use |
|---|---|---|
| `--accent-100` | `#CFF6FD` | Soft accent background (chips) |
| `--accent-500` | `#06B6D4` | Accent base |
| `--accent-600` | `#0891B2` | Accent strong / text-on-light |

**Neutral (cool slate) — the ground and the ink**

| Token | Hex | | Token | Hex |
|---|---|---|---|---|
| `--neutral-0` | `#FFFFFF` | | `--neutral-500` | `#6B7688` |
| `--neutral-25` | `#FBFCFE` | | `--neutral-600` | `#4B5563` |
| `--neutral-50` | `#F6F8FB` | | `--neutral-700` | `#374151` |
| `--neutral-100` | `#EEF1F6` | | `--neutral-800` | `#1F2733` |
| `--neutral-200` | `#E2E7EF` | | `--neutral-900` | `#111827` |
| `--neutral-300` | `#CBD3DF` | | `--neutral-950` | `#0B0F17` |
| `--neutral-400` | `#9AA5B5` | | | |

Neutrals are biased slightly cool (toward the brand blue) so they read as *chosen*, not default grey. Surfaces are never pure `#000`/`#fff` as the primary ground — the page sits on a tinted neutral.

**Semantic status ramps** (separate from brand/accent; used only for state)

| Role | Soft bg | Base | Strong |
|---|---|---|---|
| Success | `#DCFCE7` | `#16A34A` | `#15803D` |
| Warning | `#FEF3C7` | `#F59E0B` | `#B45309` |
| Danger | `#FEE2E2` | `#EF4444` | `#DC2626` |
| Info | `--brand-50` | `--brand-600` | `--brand-700` |

### 4.2 Semantic tokens

Components use these — never the primitives directly.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--color-bg` | `--neutral-50` | `--neutral-950` | Page background |
| `--color-surface` | `--neutral-0` | `#121826` | Cards, panels, header |
| `--color-surface-sunken` | `--neutral-50` | `#0E1420` | Insets, table stripes, wells |
| `--color-surface-raised` | `--neutral-0` | `#172032` | Menus, popovers, modals |
| `--color-border` | `--neutral-200` | `#232C3B` | Hairline borders, rules |
| `--color-border-strong` | `--neutral-300` | `#33405A` | Input borders, dividers needing weight |
| `--color-heading` | `--neutral-900` | `#F5F7FA` | Headings |
| `--color-text` | `--neutral-600` | `#C7D0DE` | Body text |
| `--color-muted` | `--neutral-500` | `#8A96A8` | Secondary text, placeholders |
| `--color-faint` | `--neutral-400` | `#63708A` | Disabled text, meta |
| `--color-primary` | `--brand-600` | `--brand-400` | Primary actions, links, active state |
| `--color-primary-hover` | `--brand-700` | `--brand-300` | Primary hover/pressed |
| `--color-on-primary` | `--neutral-0` | `#0B0F17` | Text/icon on primary fill |
| `--color-primary-soft` | `--brand-50` | `#16223D` | Tinted primary background |
| `--color-accent` | `--accent-600` | `--accent-500` | The single accent moment |
| `--color-focus` | `--brand-500` | `--brand-400` | Focus ring color |
| `--color-success` / `-warning` / `-danger` | status base | lightened base | State only |

**Dark theme:** never re-tint the brand into a different hue (the current auth page shifts blue→cyan in dark — banned). The brand stays blue; it only lightens for contrast on dark grounds. Dark mode is defined once at the token layer and applies app-wide (§10, §18) — never per page.

### 4.3 Usage rules

- **60 / 30 / 10:** ~60% neutral surface, ~30% text/structure, ~10% brand. Accent is a fraction of the 10%.
- Gradients are **not** a surface treatment. At most one small brand moment (e.g., a logo lockup) may use a gradient; heroes, chips, and product tiles use solid tinted surfaces.
- Never convey information by color alone — pair with text, icon, or shape (§18).

---

## 5. Elevation

Elevation expresses "how far off the page" a surface sits. It maps to shadow on **light** and to surface **lightness** on **dark** (a glowing shadow on a dark card is banned).

| Level | Token | Light treatment | Dark treatment | Used for |
|---|---|---|---|---|
| 0 | `--elevation-0` | flat, no shadow | `--color-bg` | Page background |
| 1 | `--elevation-1` | `--shadow-sm` | `--color-surface` | Cards, header, inputs |
| 2 | `--elevation-2` | `--shadow-md` | `--color-surface-raised` | Dropdowns, popovers, hover-raised cards |
| 3 | `--elevation-3` | `--shadow-lg` | `--color-surface-raised` + brighter border | Modals, dialogs |
| 4 | `--elevation-4` | `--shadow-lg` + backdrop | same + backdrop | Toasts, command overlays |

Rules: raise a surface by **one** level at a time. Elevation and z-index are related but distinct — z-index (§10) controls stacking order; elevation controls perceived height. Do not fake elevation with heavy borders.

---

## 6. Border radius

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | 6px | Chips, badges, small inline controls, focus outlines |
| `--radius-sm` | 8px | Buttons, inputs, small cards |
| `--radius-md` | 12px | Cards, panels, dropdowns |
| `--radius-lg` | 16px | Modals, large hero panels, feature cards |
| `--radius-pill` | 999px | Pills, tags, avatar chips, search field |
| `--radius-full` | 50% | Circular avatars, status dots |

Rules: one radius family per component — never mix `--radius-sm` and `--radius-lg` on nested corners of the same element. Nested elements step **down** one level from their container. Default product surface radius is `--radius-md`.

---

## 7. Shadows

Shadows are soft, low-opacity, and cool-tinted (matching the neutral bias). They imply light from above.

| Token | Description | Use |
|---|---|---|
| `--shadow-sm` | Subtle 1–2px ambient + faint drop | Resting cards, inputs, header |
| `--shadow-md` | Medium diffuse drop | Hover elevation, dropdowns, popovers |
| `--shadow-lg` | Large soft drop | Modals, dialogs, toasts |
| `--shadow-focus` | Focus ring halo (brand, ~14% alpha) | Focus-within on fields; paired with the outline ring |

Rules: shadows never carry brand color as a glow. On dark surfaces, prefer lightness-based elevation (§5); if a shadow is used on dark it is tight and dark, never a colored halo. Never stack more than one shadow token on an element. Hover raises resting `--shadow-sm` to `--shadow-md` — not more.

---

## 8. Spacing

4px base scale. Layout, gaps, and padding all draw from it. Spacing is applied via layout containers (flex/grid `gap`), not scattered per-element margins.

| Token | px | rem | Typical use |
|---|---|---|---|
| `--space-0` | 0 | 0 | Reset |
| `--space-1` | 4 | 0.25 | Icon-to-label, tight inline gaps |
| `--space-2` | 8 | 0.5 | Chip padding, small gaps |
| `--space-3` | 12 | 0.75 | Control inner padding |
| `--space-4` | 16 | 1 | Default gap, card padding (compact) |
| `--space-5` | 20 | 1.25 | Field spacing |
| `--space-6` | 24 | 1.5 | Card padding, grid gaps |
| `--space-8` | 32 | 2 | Card padding (comfortable), block gaps |
| `--space-10` | 40 | 2.5 | Section inner spacing |
| `--space-12` | 48 | 3 | Section padding (mobile) |
| `--space-16` | 64 | 4 | Section padding (desktop) |
| `--space-20` | 80 | 5 | Hero padding, major section breaks |
| `--space-24` | 96 | 6 | Page top/bottom rhythm |

Rules: **only scale values** — no off-grid one-offs (the current 9px/14px/18px values are non-compliant). Vary padding intentionally between sections (don't pad every section identically). Card default padding is `--space-6`; comfortable is `--space-8`. Section vertical rhythm is `--space-16` desktop / `--space-12` mobile.

---

## 9. Grid

- **Columns:** 12-column fluid grid for page-level layout.
- **Max content width:** `--layout-max` = 1200px (marketing/storefront) and up to 1320px for dense admin data. Content centers within it.
- **Gutters:** `--space-6` (24px) desktop, `--space-4` (16px) mobile.
- **Container padding (page edge):** fluid `--space-4` → `--space-16` (16px mobile up to 64px wide desktop).

**Product grid:** auto-fill, min column width ~240px, `--space-6` gap. Column counts land at 4 (xl) / 3 (lg) / 2 (md) / 1 (sm) naturally from the min-width. **Break the uniform matrix** — support one featured (2×) tile per row band so the grid reads merchandised, not templated. Every image-bearing track uses a min-width floor of 0 to prevent overflow.

**Dashboard grid:** 12-column; KPI cards span 3 each (4-up), charts span 6–8, side panels span 4. Collapses to a single column on mobile.

---

## 10. Layout

Three canonical app shells. Every page uses exactly one.

**Customer shell** (Home, Profile, catalog, cart, checkout)
- Sticky header, `--z-sticky`, `--color-surface`, hairline `--color-border` bottom, height ~64–72px. The header is shared, not re-implemented per page.
- Main content centered within `--layout-max`.
- Shared footer closes every page (mast line or single inline row — never a 4-column "Resources/Legal" block).

**Admin shell**
- Fixed left sidebar (~240px), `--color-surface`, section nav + brand lockup + "back to shop".
- Main region: sticky topbar (title + search + identity) over a scrolling content area.
- Sidebar collapses to a drawer under `md` (§19).

**Auth shell**
- Two-column split (brand panel + form panel) on desktop; single column on mobile.
- The page grows with content — it is **not** locked to the viewport height with hidden overflow (the current lock clips content and is banned). The document scrolls.

**Z-index scale** (only these tiers; no arbitrary values like `9999`):

| Token | Value | Layer |
|---|---|---|
| `--z-base` | 0 | Normal flow |
| `--z-raised` | 10 | Raised cards |
| `--z-sticky` | 30 | Sticky header / topbar |
| `--z-dropdown` | 40 | Menus, popovers, comboboxes |
| `--z-overlay` | 50 | Modal backdrop |
| `--z-modal` | 60 | Dialogs |
| `--z-toast` | 70 | Toasts |
| `--z-tooltip` | 80 | Tooltips |

---

## 11. Motion

Motion is short, purposeful, and reversible.

**Duration tokens**

| Token | Value | Use |
|---|---|---|
| `--dur-instant` | 0ms | Focus rings, state that must be immediate |
| `--dur-fast` | 120ms | Hover, small color/opacity shifts |
| `--dur-base` | 200ms | Default transition, dropdown open |
| `--dur-slow` | 320ms | Modal/backdrop, larger reveals |

**Easing tokens**

| Token | Curve intent | Use |
|---|---|---|
| `--ease-out` | Decelerate (primary) | Entrances, hover, most UI |
| `--ease-in` | Accelerate | Exits |
| `--ease-in-out` | Symmetric | Moves/reorders |

**Rules**
- Animate **only** `transform` and `opacity`. Never animate layout properties (width/height/top/left) or `all`.
- Name the properties transitioned — `transition: all` is banned.
- **One hover signal per element** — a 1px lift, or a color shift, or a border change; never all at once. No universal `scale`/`translate` on every card.
- **Focus rings appear instantly** (`--dur-instant`) — never transition `outline`/focus `box-shadow`.
- **No bounce/overshoot** easings on UI state. No animated hover gradients, cursor-follower dots, or auto-rotating carousels without pause.
- **One orchestrated entrance** per page load at most; content thereafter is simply present (no universal scroll-triggered fade-ups).
- **Reduced motion:** under `prefers-reduced-motion: reduce`, spatial motion collapses to an opacity crossfade ≤150ms; looping/decorative animation stops. This is mandatory on every animated element.

---

## 12. Components

The shared component library is the only place UI primitives are defined. Pages compose them; pages do not re-implement them. Today there are 3 modal implementations, 4 brand marks, and 3 alert patterns — the target is **one of each**. Every interactive component ships **all eight states**: default · hover · focus-visible · active · disabled · loading · error · success.

### 12.1 Buttons

| Variant | Fill | Text | Use |
|---|---|---|---|
| Primary | `--color-primary` | `--color-on-primary` | The one main action per view |
| Secondary | `--color-surface` + `--color-border-strong` | `--color-text` | Secondary actions |
| Ghost | transparent | `--color-primary` | Tertiary / in-toolbar actions |
| Danger | `--color-danger` | white | Destructive confirm |

- **Sizes:** sm (32px), md (40px, default), lg (48px). Radius `--radius-sm`. Label weight `--weight-semibold`.
- **Loading:** show an inline spinner + keep the label (or a `…` progressive label); disable interaction; preserve width to avoid layout shift.
- **One primary per view.** Labels are verb-first and specific ("Save profile", "Create product") — the toast/result echoes the same verb.
- Clickable labels never wrap to two lines — shorten the label or `nowrap` and let the container reflow.

### 12.2 Inputs & selects
Label above field. Field height matches button md (40–44px). Border `--color-border-strong`, radius `--radius-sm`, background `--color-surface`. Focus shows the ring instantly. Placeholder is `--color-muted` and never replaces a label. See §16.

### 12.3 Checkbox / radio / switch
16–20px control, `--color-primary` when checked, visible focus ring, label is clickable, minimum 44px touch target including padding.

### 12.4 Card
`--color-surface`, `--radius-md`, `--elevation-1`, padding `--space-6`. One containment layer — **no card-in-card**. No thick colored side-stripe; if a status accent is needed, use a small square or a chip beside the heading. Hover (if interactive) raises to `--elevation-2` with a single signal.

### 12.5 Modal / dialog (one implementation)
Backdrop at `--z-overlay` (scrim, dismiss on outside click for non-destructive). Dialog at `--z-modal`, `--color-surface-raised`, `--radius-lg`, `--elevation-3`, max-width ~560px (forms up to ~720px), full-width sheet under `sm`. `role="dialog"`, `aria-modal`, labelled title, focus trap, Escape closes, focus returns to trigger. Body scroll locked while open. Destructive/irreversible actions use a confirm dialog; reversible actions use optimistic update + Undo instead.

### 12.6 Toast (one implementation)
Fixed to a viewport corner at `--z-toast`; stacked; existing toasts don't move when a new one arrives (no layout shift). `role="status"`, `aria-live="polite"` (assertive for errors). Auto-dismiss ~5s with manual close. **Silent success** by default — toasts are for failures, async results the user can't see, and explicit confirmations. Types: success / info / error, distinguished by icon + accent bar + text (not color alone).

### 12.7 Badge / chip / tag
`--radius-pill`, `--text-caption`, soft status background + strong status text. Status pills encode state in shape/label too, not color alone.

### 12.8 Tabs
Underline or pill style, one active tab via `--color-primary`, `role="tablist"`/`tab`/`tabpanel`, arrow-key navigation, visible focus. Used for Profile sections and Admin sub-navigation.

### 12.9 Avatar & brand mark (one each)
Avatar: `--radius-full`, image or initials fallback, sizes sm/md/lg. BrandMark: single shared "TS / TechShop" lockup component — never re-drawn per page.

### 12.10 Dropdown / menu
`--color-surface-raised`, `--radius-md`, `--elevation-2`, `--z-dropdown`, keyboard navigable, closes on Escape/outside-click, anchored to trigger.

### 12.11 Alert / inline notice (one pattern)
Full-width inline block for form/section feedback. Soft status background, status-colored left indicator, icon + message. `role="alert"` for errors. Replaces the current three divergent alert styles.

---

## 13. Iconography

- **One library:** Lucide (2px stroke, 24px grid) is the canonical set. All icons come from it via a single `Icon` component. Existing hand-drawn inline SVGs are migrated to it.
- **Sizes:** 16px (inline with text), 20px (default UI), 24px (headers/empty states). Stroke stays visually 2px across sizes.
- **Color:** inherits `currentColor` so icons follow text color; interactive-state colors follow the control.
- **Never mix icon libraries.** Never use emoji (`✨🚀⚡`) as functional icons — emoji render per-OS and break the stroke voice.
- **Accessibility:** decorative icons are `aria-hidden`; icon-only buttons carry an `aria-label`. Icons never carry meaning alone (pair with text or an accessible name).
- The `public/icons.svg` sprite is either adopted as the delivery mechanism or removed — no orphaned icon sources.

---

## 14. Empty states

Every list, table, and data surface has a designed empty state — never a blank region.

**Anatomy:** (1) a small icon or restrained illustration, (2) a one-line title stating the situation, (3) one sentence of guidance, (4) an optional single primary action.

| Surface | Title | Guidance | Action |
|---|---|---|---|
| Orders (none) | "No orders yet" | "When you place an order it will appear here." | "Browse products" |
| Orders (filtered) | "No orders match this filter" | "Try a different status or clear the search." | Clear filter |
| Addresses | "No delivery addresses" | "Add an address for faster checkout." | "Add address" |
| Table (no records) | "Nothing here yet" | context sentence | Create action |
| Search (no results) | "No results for '{query}'" | "Check spelling or try fewer words." | — |

**Tone:** plain, specific, non-apologetic. Distinguish "empty because new" from "empty because filtered" — they need different guidance. Center within the content region; use `--color-muted` for the guidance line.

---

## 15. Skeletons

- **Use skeletons, not spinners, whenever the resulting layout is known** (lists, tables, cards, profile panels). Spinners only for indeterminate, layout-unknown waits.
- Skeletons **match the shape** of the content they replace (same rough sizes, counts, and rhythm) — no generic grey box where a card will be.
- Motion is a subtle shimmer/pulse; under reduced-motion it is static (no animation).
- **Timing:** delay-show by ~150ms (don't flash for fast responses); once shown, keep visible ~300ms minimum to avoid flicker.
- Use `--color-surface-sunken` for skeleton blocks; `aria-busy`/`aria-label` on the loading region so assistive tech announces the wait.

---

## 16. Forms

**Structure**
- Label sits **above** the field (not floating, not placeholder-as-label). Required fields marked consistently (asterisk or "required"); optional fields marked "optional" when clarity helps.
- Field groups use `--space-5` between fields, fieldsets for related groups (e.g., gender, address type) with a legend.
- Help text sits below the field in `--text-body-sm` `--color-muted`.

**Validation**
- **Timing:** validate on blur and on submit; reserve live/as-you-type feedback for genuinely helpful cases (email availability, password strength) and debounce it (~500ms).
- **Errors** appear inline beneath the field, `--color-danger`, with `aria-invalid` on the field and `aria-describedby` linking the message. On submit, focus and scroll to the first error.
- Error messages say **what went wrong and how to fix it** — specific, not "Invalid input". No blaming, no vagueness.
- A form-level summary (inline alert, §12.11) is used only when errors aren't field-specific.

**States & behavior**
- Fields have all states (default/hover/focus/disabled/readonly/error). Read-only fields (e.g., email on profile) are visually distinct from editable.
- Password fields include a show/hide toggle (icon button with `aria-label`) and, on register, a live requirement checklist.
- Submit buttons show a loading state and are disabled during submission; success is confirmed by visible result or a single toast, not celebration.
- Long/multi-step forms (e.g., address, product create) use a modal or a sectioned layout; guard against losing unsaved changes on close.
- Autofill and password-manager hints are set intentionally per field.

---

## 17. Tables

For admin/data-dense views.

**Anatomy & alignment**
- Header row: `--color-surface-sunken`, `--text-caption` uppercase-ish label, `--color-muted`.
- Text columns left-aligned; **numeric columns right-aligned with tabular numerals**; status as a chip, not raw text color.
- Row height comfortable (~48–56px); zebra striping optional via `--color-surface-sunken` at low emphasis.

**Interaction & state**
- Row hover uses `--color-surface-sunken`; clickable rows show a pointer and a clear affordance and are keyboard-activatable.
- When a row is clickable **and** contains action buttons (edit/delete), action clicks must not trigger the row navigation (stop propagation) — and this is documented behavior, not an accident.
- Selected rows use `--color-primary-soft`.

**Structure**
- Actions live in a trailing column, right-aligned, using ghost/danger buttons.
- Sorting indicated in the header; pagination below, right-aligned, with total count.
- **Empty state** replaces the body (§14), spanning all columns.
- **Responsive:** the table lives in a horizontal-scroll container so the page body never scrolls sideways; under `md`, prefer a stacked card layout per row where feasible.

---

## 18. Accessibility

Baseline target: **WCAG 2.1 AA**.

- **Contrast:** text ≥ 4.5:1 (large text ≥ 3:1); UI components, borders, and focus rings ≥ 3:1. All semantic tokens are chosen to meet this in both themes.
- **Focus:** every interactive element has a visible `:focus-visible` ring (`--color-focus`, ≥3:1, ≥2px, `--radius-xs` offset), appearing **instantly**. This is mandatory everywhere — the Admin console currently has none; that is a defect against this spec.
- **Keyboard:** all functionality operable by keyboard; logical tab order; Escape closes overlays; focus is trapped in modals and returned to the trigger on close; menus/tabs use arrow keys.
- **Semantics:** landmark regions (`header`/`nav`/`main`/`footer`), one `h1` per page, ordered headings, real buttons/links (not clickable divs), lists as lists.
- **ARIA patterns:** dialog (`role="dialog"`, `aria-modal`, labelled), tabs (`tablist`/`tab`/`tabpanel`), combobox/listbox for the location pickers, `aria-live` regions for toasts and async status.
- **Color independence:** never signal state by color alone — pair with icon, text, or shape.
- **Touch targets:** ≥ 44×44px.
- **No hover-only affordances:** anything revealed on hover is also available on focus and on tap (coarse pointers).
- **Motion:** honor `prefers-reduced-motion` everywhere (§11).
- **Images/media:** meaningful images have alt text; decorative images have empty alt; video is `muted` + captioned, never autoplaying sound.

---

## 19. Responsive rules

Mobile-first. Verify every screen at **320 / 375 / 414 / 768 / 1024 / 1280px**.

**Breakpoints**

| Token | Min width | Target |
|---|---|---|
| `xs` | 0 | Small phones (base) |
| `sm` | 480px | Large phones |
| `md` | 768px | Tablet |
| `lg` | 1024px | Small laptop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Large desktop |

(Consolidates the current ad-hoc 680/1040 breakpoints onto this scale.)

**Rules**
- **No horizontal scroll:** the page body never scrolls sideways; wide content (tables, code, wide grids) scrolls inside its own container. Root uses overflow-x clip.
- **Fluid type & space:** display/heading sizes and section padding interpolate between breakpoints (see fluid ranges in §3, §8).
- **Header:** customer header condenses under `md` (search collapses, actions group); admin sidebar becomes a drawer under `md`.
- **Grids collapse predictably:** product grid 4→3→2→1; dashboard/section grids collapse to one column on mobile.
- **Clickable text never wraps to two lines** at any width (§12.1) — shorten, `nowrap`, or drop non-essential items.
- **Modals** become full-width sheets under `sm`; forms stack to one column.
- **Touch:** interactive targets ≥44px on coarse pointers; increase spacing slightly on touch.
- Images in grid tracks use a min-width floor of 0 to avoid blowout.

---

## 20. Governance

- **One token layer.** All values in this document resolve to a single canonical token file the whole app imports. No feature defines its own palette, spacing, or type.
- **This document is the source of truth.** New components and pages conform to it before merge. A component that contradicts it is a bug to fix, not a new pattern.
- **Changing the system** (adding/renaming a token, adjusting the scale, introducing a component) is a deliberate change: update this document first, then the token layer, then components — in that order. Token renames are breaking changes.
- **Adding values:** if an implementation needs a value no token provides, add the token here and in the token layer, then reference it — never inline a raw value "just this once".
- **Review cadence:** revisit alongside major feature additions (catalog, cart, checkout, AI assistant) to confirm the system still covers new surfaces; record changes in a short changelog below.

### Changelog

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-08-07 | Initial system: formalizes brand palette into full ramps + semantic tokens, defines Sora/Inter/JetBrains Mono pairing, spacing/grid/motion/elevation scales, component contracts, and accessibility + responsive baselines. Supersedes the `DEVELOPMENT_LOG.md` direction notes. |
