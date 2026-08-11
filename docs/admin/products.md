# Admin · Products — Page Design Spec

**Governed by [`design-system.md`](../design-system.md)** (see its *"When it's a UI, not a document"* guidance). **Reference feel:** Linear, Stripe Dashboard, GitHub, Vercel — dense but calm, keyboard-first, quiet chrome, fast. Markdown only — no code.
**Route:** `/admin/products`. **Access:** ADMIN only (guarded — see [`dashboard.md`](./dashboard.md)).

**This is the flagship admin table page.** It defines the shared **admin shell**, **table system**, **filter/search model**, **bulk-action pattern**, **keyboard model**, and **motion** that the other admin table pages ([`orders.md`](./orders.md), [`customers.md`](./customers.md), [`categories.md`](./categories.md), [`brands.md`](./brands.md), [`inventory.md`](./inventory.md)) reuse and only specialize.

---

## Goals

Let an admin **find, assess, and change products fast**, at any catalog size, without leaving the list. The product list is the admin's home base for the catalog; every decision optimizes the loop *scan → filter to the right rows → act (edit / status / bulk) → stay in place*.

**Why this framing:** admin tools live or die on task-throughput, not first-impression polish. Linear/Stripe/GitHub win because the operator rarely leaves the list — actions happen inline, in slide-overs, or via the keyboard. We copy that: the table is the surface, everything else is an overlay on top of it.

---

## User Tasks

| Task | Frequency | How the page serves it |
|---|---|---|
| Scan the catalog / assess state | constant | Dense table; status pills; low-stock signal at a glance |
| Find a specific product | very high | Instant search (name/SKU) + `/` shortcut |
| Narrow to a subset | high | Composable filter tokens (status, category, brand, stock, price) |
| Edit one product's details | high | Row → right slide-over (quick fields) / full editor (variants, specs, images) |
| Change status / price quickly | high | Inline edit in the row (optimistic) — no modal for a one-field change |
| Act on many at once | medium | Multi-select + sticky bulk-action bar |
| Create a product | medium | "New product" → full editor (images/variants/specs) |
| Delete / archive | medium | Optimistic + Undo; bulk delete guarded |

**Why list tasks first:** the layout below is derived from these — the most frequent tasks (scan, find, filter, quick-edit) get the least friction; rare/destructive tasks (bulk delete, create-with-variants) get more deliberate flows.

---

## Layout

**Admin shell** (shared across all admin pages):

```
┌──────────┬────────────────────────────────────────────────────────────────┐
│ SIDEBAR  │ TOPBAR:  Products              [ / search ]  [＋ New]   ⟳   👤  │
│ TechShop │────────────────────────────────────────────────────────────────│
│ Admin    │ [ Status: Active ✕ ] [ Category: Laptops ✕ ] [＋ Filter]  ⋯view │  ← filter bar
│          │ 128 products · 3 selected                          Sort: Updated │  ← context row
│ Dashboard│ ┌────────────────────────────────────────────────────────────┐ │
│ Orders   │ │ ☐ │img│ Name / SKU      │ Category │ Brand │ Price │ Stock │…│ │  ← table
│ ▸Products│ │ ☑ │▪ │ AeroBook Pro 14 │ Laptops  │ Acme  │ $1,249│  42  │ ●│ │
│ Inventory│ │ ☐ │▪ │ NovaPhone X2    │ Phones   │ Nova  │  $829 │   0  │ ○│ │
│ Categories│ │ …                                                          │ │
│ Brands   │ └────────────────────────────────────────────────────────────┘ │
│ Customers│                              [ Load more ] · 24 of 128           │
│ Analytics│  ┌── (when rows selected) sticky bulk bar ──────────────────┐   │
│ Settings │  │ 3 selected   Set status ▾  Category ▾  Export   Delete  ✕ │   │
│ ──────── │  └──────────────────────────────────────────────────────────┘   │
│ ‹ Shop   │                                                                  │
└──────────┴────────────────────────────────────────────────────────────────┘
```

- **Sidebar** (~240px, fixed): the section nav (Dashboard · Orders · Products · Inventory · Categories · Brands · Customers · Analytics · Settings · Back to shop), current item marked with `--color-primary`. **Why:** persistent nav means an admin is one click from any section — the Stripe/Linear left-rail model that keeps the whole console in reach.
- **Topbar** (sticky): page title, **global search** (`/` to focus), a primary **"New product"** button, a **refresh** control, and the admin identity. **Why sticky:** search and "new" are needed at any scroll depth.
- **Filter bar + context row**: active filters as removable tokens, a result count, selection count, a **view/columns** menu, and the **sort** control. **Why a token bar (not a filter sidebar):** composable tokens (Linear-style) show the *current query as data* and keep horizontal room for the table — far more scannable than a persistent facet rail on a dense admin table.
- **Table**: the work surface (see Table Design).
- **Sticky bulk bar**: appears only when rows are selected, pinned to the bottom. **Why bottom + sticky:** it's reachable during a long selection scroll and doesn't shove the table down when it appears.
- **Detail**: a **right slide-over** for a single product's quick view/edit; a **full-page editor** for create and complex edits (variants/specs/images). **Why slide-over for quick, full-page for complex:** a slide-over keeps the list visible behind it (context preserved, fast in/out — Stripe/Linear pattern); the full product editor has too much (image upload, variant grid, spec rows) to cram into a drawer, so it earns a dedicated route.

---

## Table Design

The table is the product. It follows the design system's table rules (header on `--color-surface-sunken`, hairline rows, tabular numerals for money/counts, status as chips, comfortable ~52px rows).

**Columns** (default, customizable):

| Column | Content | Align | Notes / why |
|---|---|---|---|
| ☐ | Selection checkbox | — | Header checkbox = select-all-on-page (not all-matching — see Bulk) |
| Image | 32–40px thumbnail (or neutral placeholder) | — | Recognition is faster by picture than name |
| Name / SKU | Product name (link) + muted SKU beneath | left | Two-line cell keeps identity dense without a separate SKU column |
| Category | Category name | left | — |
| Brand | Brand name | left | — |
| Price | `basePrice` (or "from" if variants differ) | **right, tabular** | Right-aligned tabular figures so prices scan as a column |
| Stock | `stockQuantity` + a low/out indicator | **right, tabular** | Color+icon flag for low/out (state in form, not color alone) |
| Status | Pill: Draft · Active · Inactive · Out of stock | left | Semantic color + label; the fastest state read |
| Updated | Relative date ("2d ago", exact on hover) | left | Sortable; helps find recently-touched items |
| ⋯ | Row actions (hover/focus reveal) | right | Edit · Duplicate · Change status · Delete |

**Row behaviors & why:**
- **Whole row is clickable** → opens the slide-over; the Name is also a link. **Why both:** a big click target (row) for speed, a semantic link (name) for keyboard/right-click/open-in-new.
- **Row actions reveal on hover *and* focus**, never hover-only. **Why:** hover-only actions are invisible to keyboard and touch users; focus-reveal keeps them accessible.
- **Inline quick-edit** for Status and Price: click the pill/price → an in-cell control → **optimistic** save. **Why:** a one-field change shouldn't cost a modal round-trip; inline edit is the single biggest throughput win for the frequent "activate this / fix this price" task.
- **Low/out-of-stock rows** carry a subtle stock indicator (not a full-row tint that would fight status). **Why:** inventory triage is a core scan; the signal must be glanceable but not noisy.
- **Sortable columns**: Name, Price, Stock, Updated, Status. Click header to sort; a stable secondary sort keeps pagination deterministic. **Why:** "cheapest / lowest stock / most recently changed" are real triage questions.
- **Column visibility + density** via the view menu (Linear/GitHub). **Why:** different admins care about different columns; letting them hide noise raises scan speed without a redesign.
- **Sticky header** on scroll. **Why:** column meaning stays anchored in a long list.

---

## Filters

**Composable filter tokens** in the filter bar. "＋ Filter" opens a menu of fields → each adds a removable token; tokens combine with AND; multi-value within a token is OR (the universal model).

| Filter | Values | Why it earns a slot |
|---|---|---|
| Status | Draft · Active · Inactive · Out of stock | The #1 admin triage axis |
| Category | from categories API | Scope to a department |
| Brand | from brands API | Scope to a supplier |
| Stock | In stock · Low · Out | Inventory triage without leaving Products |
| Price | min–max | Find mis-priced / promo candidates |
| Has variants | yes/no | Find configurable products |

- Every filter is reflected in the **URL** (shareable, restorable, back-button-safe) — same model as the storefront catalog. **Why:** an admin can bookmark "active laptops low on stock" and share it with a teammate.
- **Saved views** (Linear): name a filter+sort+columns combo and pin it ("Needs restock", "Drafts"). **Why:** admins run the same queries daily; saving them removes repeated setup. *(Enhancement — real filters ship first.)*
- Filters **apply live** (desktop has the room; the table is visible), with the **result count** updating in the context row. **Why:** immediate feedback tells the admin whether the filter did what they meant.

**Why tokens over a facet sidebar:** on a data-dense admin table, a permanent facet rail steals the horizontal space the table needs and hides the *current query*. Tokens make the query explicit, editable, and removable one at a time — the Linear/Stripe approach.

---

## Search

- **Global search in the topbar**, focused with **`/`** (GitHub/Linear). Searches **name and SKU** (accent- and case-insensitive, reusing the app's Vietnamese normalization), debounced ~250ms, filtering the table in place. **Why in the topbar + `/`:** search is the highest-frequency find action; a keyboard shortcut to it is the single most-used admin accelerator.
- Search **composes with filters** (searching within the current filtered set), and reflects in the URL as `q`.
- A separate **⌘K command palette** handles *navigation and actions* ("Go to Orders", "New product", "Filter: out of stock"), distinct from the in-page product search. **Why two:** `/` = "find a product in this list"; ⌘K = "do something / go somewhere" — conflating them makes both worse. *(Palette is an enhancement; `/` search ships first.)*
- Clear affordance (✕ / Esc) to reset. **Why:** getting back to the full list must be instant.

---

## Bulk Actions

- **Selection:** per-row checkbox; **header checkbox selects all *on the current page*** (not all matching) with an explicit "Select all N matching" affordance if the admin wants the whole filtered set. **Why the distinction:** silently selecting thousands of off-screen rows is how accidental mass-deletes happen; the two-step (page vs all-matching) makes scope a conscious choice — the Gmail/GitHub pattern.
- **Range select** with Shift-click; `x` toggles the focused row (Linear/Gmail).
- **Sticky bulk bar** (bottom) shows the count and actions: **Set status** (Activate / Deactivate / Draft), **Assign category/brand**, **Export**, **Delete**.
- **Optimistic + Undo** for reversible bulk changes (status, category); a **typed confirmation** for bulk **delete** ("type DELETE / confirm N products"). **Why the asymmetry:** reversible actions should be frictionless with an Undo safety net (design-system rule); an irreversible mass-delete deserves a deliberate speed-bump, not a one-click OK.
- Bulk changes show **progress and per-item results** (e.g., "58 updated, 2 failed") rather than a single opaque success. **Why:** at scale, partial failure is normal; hiding it erodes trust.

---

## Empty States

Distinct, per the design system (icon · title · one-line guidance · one action):

| Situation | Title | Guidance | Action |
|---|---|---|---|
| No products yet (new store) | "No products yet" | "Add your first product to start selling." | **New product** |
| No results (filters/search) | "No products match these filters" | "Try removing a filter or clearing the search." | Clear filters (keep query) |
| No results (search only) | "No products match '{q}'" | "Check spelling or search by SKU." | Clear search |

**Why three:** "empty because new" needs a create CTA; "empty because over-filtered" needs a *clear-filters* path (and keeps the tokens visible so the admin sees why); conflating them sends a new admin to "adjust filters" that don't exist, or an over-filtering admin to "create a product" they don't need.

---

## Loading

- **First load:** table skeleton (rows matching the page size: checkbox + thumb block + text lines + right-aligned number blocks) + a filter-bar skeleton. **Why skeletons:** the layout is known, so a shape-matched skeleton reads as "loading this table," not "something's broken."
- **Filter/search/sort change:** skeleton (or a subtle dimmed overlay) **only over the table body**; the filter bar and toolbar stay interactive. **Why:** never blank the controls the admin is actively using; keep their place.
- **Inline/optimistic edits:** the changed cell updates instantly with a quiet pending state; the row never blocks the rest of the table.
- **Load-more:** button → loading; appended rows skeleton in; focus moves to the first new row.
- **Timing:** delay-show skeletons ~150ms, hold ~300ms min (no flash on fast responses); `aria-busy` on the loading region; result count announced via `aria-live`.

**Why the delay/min-duration:** admin actions are often fast; a spinner that flashes for 50ms is visual noise, and one that vanishes instantly after appearing causes flicker — the thresholds make loading feel intentional.

---

## Errors

- **List fetch fails:** an inline banner (`role="alert"`) above the table — "Couldn't load products. Retry." — with a Retry that reuses the current query; the shell/sidebar stay so the admin can navigate away. **Why keep the shell:** a broken products fetch shouldn't trap the admin on a dead page.
- **Inline/optimistic edit fails:** revert the cell, show a per-row inline error + retry; other rows unaffected. **Why per-row:** one failed update mustn't invalidate the whole table.
- **Bulk action partial failure:** report per-item results ("58 ok, 2 failed: …") with a way to retry just the failures. **Why:** actionable > opaque.
- **Delete conflict** (product in orders, etc.): explain and offer **archive/deactivate** instead of a hard delete. **Why:** the honest fix for "can't delete" is an alternative action, not a raw error.
- **Validation errors** in the editor: inline, per-field, focus the first error (see the product editor flow). Errors say what's wrong and how to fix it.

---

## Responsive Behavior

Admin is desktop-first, but must not break on smaller screens. Verified at 320 / 375 / 768 / 1024 / 1280px.

| Width | Behavior |
|---|---|
| ≥1024 | Full shell: fixed sidebar + full table (all default columns). |
| 768–1023 | Sidebar → **drawer** (topbar toggle); table drops low-priority columns (Brand, Updated) into the row's secondary line or the slide-over. |
| <768 | Sidebar drawer; the **table becomes a stacked card list** — each product a card (thumb + name/SKU + price + stock + status pill + a ⋯ menu); filters/search move into a sheet; bulk selection via a "Select" mode. |

**Why cards on mobile:** a multi-column table can't shrink to a phone without horizontal scroll hell; a per-row card preserves every field in a scannable stack. Wide content never scrolls the page sideways — any retained table scrolls inside its own container. Touch targets ≥44px; inline-edit falls back to the slide-over on touch (no hover).

---

## Accessibility

Baseline WCAG 2.1 AA (design-system A11y).

- **Semantic table:** real `<table>` with `<th scope>` headers; sortable headers expose sort state (`aria-sort`); the selection column header is a labeled checkbox.
- **Row selection** is announced; the **selected count** and **result count** live in `aria-live` regions so filtering/selecting is audible.
- **Status pills** and **stock flags** convey state with text + icon, never color alone.
- **Row actions** are real buttons with names scoped to the row ("Edit AeroBook Pro 14"); reachable by keyboard and on touch (not hover-only).
- **Slide-over** is a `dialog` (focus-trapped, Esc closes, focus returns to the originating row); the full editor is a normal page with one `h1`.
- **Inline edit** controls are labeled; entering/exiting edit is keyboard-operable and announced.
- **Bulk bar** is a labeled region; its actions are keyboard-reachable; destructive actions require the typed confirmation described above.
- **Focus:** visible **instant** focus rings everywhere (the current admin has none — this is a required fix); logical order sidebar → topbar → filters → table → bulk bar.
- Contrast ≥4.5:1 text / ≥3:1 UI in both themes; reduced motion honored.

**Why this matters here specifically:** admin operators are power users who often work by keyboard and for long sessions — missing focus states and hover-only actions (both present in today's admin) are not edge-case failures, they're daily blockers.

---

## Keyboard Navigation

First-class, GitHub/Linear-style — the difference between a tool an operator tolerates and one they fly through:

| Key | Action | Why |
|---|---|---|
| `/` | Focus search | Fastest path to "find" |
| `j` / `k` | Move row focus down / up | Hands stay on the keyboard during triage |
| `x` | Toggle-select focused row | Rapid multi-select without the mouse |
| `Shift`+`j/k` or `Shift`+click | Extend selection (range) | Bulk selection at speed |
| `Enter` | Open focused row (slide-over) | Inspect without reaching for the mouse |
| `e` | Edit focused row | Jump straight to editing |
| `Esc` | Close slide-over / clear selection / blur search | One consistent "back out" key |
| `⌘/Ctrl`+`A` | Select all on page | Standard, scoped to page (not all-matching) |
| `⌘/Ctrl`+`K` | Command palette (nav + actions) | Do anything from anywhere *(enhancement)* |
| `?` | Show keyboard-shortcut help | Discoverability |

**Why publish a `?` help sheet:** shortcuts only help if they're discoverable; a `?` overlay (GitHub) teaches them without cluttering the UI.

---

## Motion

Restrained and functional (design-system Motion: `transform`/`opacity` only; `--dur-fast`/`--dur-base`; `--ease-out`; one signal; reduced-motion honored):

| Interaction | Behavior | Why |
|---|---|---|
| Row hover/focus | Background shift (`--color-surface-sunken`), one signal | Confirms the target without jitter |
| Slide-over open/close | Slide from right + backdrop fade (`transform`, `--dur-base`) | Spatial cue that it's a layer over the list (context kept) |
| Inline edit save | Quick cell cross-fade to the new value | Confirms the optimistic change without an odometer |
| Bulk bar appear | Slide up once when the first row is selected | Announces the action surface without shoving the table |
| Filter/sort update | Table body cross-fades | Signals "results changed" without re-render flicker |
| Row remove (delete) | Row collapses out + Undo toast | Reversible feel |
| Skeleton | Subtle shimmer; static under reduced motion | "Loading," not decoration |
| Focus ring | **Instant** | Keyboard users need the indicator immediately |

**Banned:** bouncy/overshoot easings, per-row stagger on load, money odometers, layout-shifting toasts, celebratory success animations. **Why:** an admin performs the same actions hundreds of times a day — any motion that delays feedback or draws attention becomes friction fast. Motion here only *confirms* and *orients*; it never entertains.

---

*Build order: AdminShell (sidebar + sticky topbar, unified tokens, **focus states**) → the Table system (semantic table, sortable headers, selection, inline quick-edit, column/density menu) → filter tokens + `/` search + URL state → the sticky bulk bar (page-vs-all-matching scope, optimistic+Undo, typed-confirm delete, per-item results) → the right slide-over (quick view/edit) and the full product editor route (images/variants/specs) → keyboard model + `?` help → empty/loading/error states. This shell + table system is reused by orders / customers / categories / brands / inventory.*
