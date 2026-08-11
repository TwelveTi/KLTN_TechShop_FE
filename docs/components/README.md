# TechShop Shared Components

**Status:** Source of truth for component implementation · **Version:** 1.0 · **Last updated:** 2026-08-07
**Governed by:** [`design-system.md`](../design-system.md). Consumed by every page spec in [`../pages/`](../pages/), [`../auth/`](../auth/), and [`../admin/`](../admin/).

This folder is the contract for TechShop's shared UI. Pages **compose** these components; pages do **not** re-implement them. If a page needs a UI element that isn't here, the component is added here first, then used. A component that contradicts this folder is the bug — this documentation wins.

Documentation only — no React, no CSS. Every colour, font, space, radius, shadow, duration, and z-index below is a **named token** from the design system; components reference tokens by name and never inline raw values.

---

## How to read these docs

Every component file uses the **exact same 17-section structure**:

`Purpose · Responsibilities · Anatomy · Variants · Props / Configuration · Sizes · States · Accessibility · Keyboard Behavior · Responsive Rules · Motion · Design Rules · Do's · Don'ts · Usage Examples · Future Extensions`

To avoid duplication, each component's **Accessibility / Keyboard / Responsive / Motion** sections state only what's *component-specific* and defer to the shared baselines below. Read this README once; then each component is a short, focused delta.

**Quality bar:** Linear / Stripe Dashboard / GitHub / Vercel — restrained, fast, keyboard-friendly, quiet chrome. Reusability is the priority: components take content via slots and behaviour via configuration, own no page-specific logic, and are theme- and density-agnostic.

---

## Naming conventions

- Components are **PascalCase** (`Button`, `ProductCard`, `SearchBar`); files here are kebab-case (`button.md`, `product-card.md`).
- One component = one name = one implementation. There is **one** Modal, **one** Toast, **one** Table — no per-page variants.
- Configuration options use camelCase (`variant`, `isLoading`, `leadingIcon`).
- Prop **types** are framework-agnostic: `text`, `number`, `boolean`, `enum(…)`, `content` (a slot), `icon` (an icon token), `event` (a callback). No framework-specific types appear in these docs.

---

## Token reference (all values come from [`design-system.md`](../design-system.md))

| Concern | Tokens used by components |
|---|---|
| Colour | `--color-surface / -surface-raised / -sunken`, `--color-border / -border-strong`, `--color-text / -heading / -muted`, `--color-primary / -primary-hover / -on-primary / -primary-soft`, `--color-accent`, `--color-focus`, `--color-success / -warning / -danger` |
| Type | `--font-display / -body / -mono`, `--text-*`, `--weight-regular/medium/semibold/bold` (cap 700) |
| Space | `--space-1…24` (4-pt scale) |
| Radius | `--radius-xs(6) / -sm(8) / -md(12) / -lg(16) / -pill / -full` |
| Elevation / shadow | `--elevation-1…4`, `--shadow-sm / -md / -lg`, `--shadow-focus` |
| Motion | `--dur-instant(0) / -fast(120) / -base(200) / -slow(320)`, `--ease-out / -in / -in-out` |
| Z-index | `--z-base / -raised / -sticky / -dropdown / -overlay / -modal / -toast / -tooltip` |

---

## Universal 8-state model

Every **interactive** component ships all applicable states. Each component's `States` section documents only the deltas from this baseline.

| State | Baseline behaviour |
|---|---|
| **Default** | Resting appearance from tokens. |
| **Hover** | **One** signal only (colour shift *or* 1px lift *or* border) at `--dur-fast` `--ease-out`. Never hover-only affordances. |
| **Focus** | Visible `:focus-visible` ring (`--color-focus`, ≥3:1, `--radius-xs` offset) that appears **instantly** (`--dur-instant`) — never animated. |
| **Active** | Pressed feedback (e.g., 1px translate); no bounce. |
| **Disabled** | Reduced emphasis, `aria-disabled`/`disabled`, not focusable-for-action; reason available where non-obvious. |
| **Loading** | In-place pending (spinner/skeleton), width preserved (no layout shift), interaction blocked, `aria-busy`. |
| **Empty** | *(if applicable)* Designed empty state: icon · title · one-line guidance · optional single action. Distinguish "new" from "filtered/none". |
| **Error** | *(if applicable)* Semantic-danger + icon + text (never colour alone); `role="alert"`; says what's wrong and how to fix it. |

---

## Shared accessibility baseline

- WCAG 2.1 AA: text ≥4.5:1, UI/borders/focus ≥3:1, in **both** themes.
- Visible **instant** focus ring on every interactive element (this is a hard requirement — it fixes the current admin's missing focus states).
- **State is never conveyed by colour alone** — pair with text, icon, or shape.
- Real semantic elements (`button`, `a`, `table`, `dialog`, `nav`), not clickable `div`s; real labels (visible or `aria-label`), never placeholder-as-label.
- Icon-only controls carry an `aria-label`; decorative icons are `aria-hidden`.
- Touch targets ≥44×44px; nothing important is hover-only.
- Composite widgets follow the relevant WAI-ARIA pattern (combobox, dialog, listbox, menu, tablist).

## Shared keyboard baseline

- Everything operable by keyboard in a logical order.
- `Enter`/`Space` activate buttons; `Enter` submits forms.
- `Esc` dismisses the topmost overlay (menu, dialog, sheet) and returns focus to the trigger.
- Composite/roving widgets use **arrow keys** within, `Tab` to move between; the component's `Keyboard Behavior` section names its specifics.
- `⌘/Ctrl+K` (command palette) and `/` (search focus) are app-level shortcuts; components don't hijack them.

## Shared responsive baseline

- Breakpoints: `xs`(<480) `sm`(480) `md`(768) `lg`(1024) `xl`(1280) `2xl`(1536).
- No horizontal page scroll at any width; wide content scrolls inside its own container.
- Inputs render ≥16px text (no mobile zoom-on-focus); targets ≥44px.
- Clickable labels never wrap to two lines — shorten or `nowrap`.
- Density and theme are inherited from context; components don't hard-code either.

## Shared motion baseline

- Animate **`transform`/`opacity` only**; never layout properties or `all`.
- Durations `--dur-fast`/`--dur-base`; easings `--ease-out` (entrances/UI), `--ease-in` (exits); **no bounce/overshoot** on UI.
- **One** signal per interaction; focus rings **instant**.
- Honour `prefers-reduced-motion`: spatial motion collapses to ≤150ms opacity crossfade; looping/decorative motion stops.
- **Banned tells:** `transition: all`, universal hover-scale, animated hover gradients, cursor followers, auto-rotating carousels, celebratory success toasts, layout-shifting toasts, animated focus rings, money odometers.

## Composition rules

- **Tokens only** — no inline hex/OKLCH/`font-family`; if a value is missing, add a token first.
- **One containment layer** — no card-in-card; no thick coloured side-stripes.
- **One primary action per view** — at most one `--color-primary`-filled Button visible at a time.
- **Slots over hard-coding** — components accept content; they don't embed page copy or business logic.
- **Silent success** for visible changes; **optimistic + Undo** over confirmation dialogs for reversible actions; **typed confirmation** for irreversible ones.

---

## Component index

| Component | Purpose | Primary consumers |
|---|---|---|
| [Button](./button.md) | Trigger an action | everywhere |
| [Input](./input.md) | Single-line/free text & the field wrapper | forms (auth, profile, checkout, admin) |
| [Modal](./modal.md) | Focus-trapped overlay dialog / confirm | admin, checkout, profile |
| [Dropdown](./dropdown.md) | Anchored menu / popover of actions or options | header account, table row actions, filters |
| [Table](./table.md) | Dense, sortable, selectable data grid | admin (products, orders, customers, …) |
| [Toast](./toast.md) | Transient, non-blocking notification | app-wide (errors, async, Undo) |
| [Badge](./badge.md) | Compact status / label chip | statuses, counts, tags |
| [Avatar](./avatar.md) | User/entity image with initials fallback | header, profile, customers, comments |
| [Navbar](./navbar.md) | Top navigation bar (customer header + admin topbar) | every page |
| [Footer](./footer.md) | Page close, secondary nav, trust marks | storefront pages |
| [Sidebar](./sidebar.md) | Vertical section nav (admin console, profile) | admin, profile |
| [ProductCard](./product-card.md) | Product tile in grids/rails | home, catalog, PDP, wishlist, search |
| [SearchBar](./search-bar.md) | Search input + autocomplete combobox | header (storefront), admin topbar |
| [Pagination](./pagination.md) | Advance through long result sets | catalog, search, admin tables |

---

*These are the only shared components v1 needs. New components enter via this index first, follow the 17-section structure, and reference these baselines rather than restating them.*
