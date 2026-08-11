# TechShop Homepage — Design Specification

**Status:** Implementation-ready · **Version:** 1.0 · **Last updated:** 2026-08-07
**Governed by:** [`design-system.md`](../design-system.md). Every token, component, spacing, and motion reference below resolves to that document. Where this spec names a value it is only restating a token; the design system is the source of truth.
**Scope:** the public marketplace homepage served at `/`. Product detail, catalog/listing (faceted search), cart, and checkout are separate specs.

This document is written so an engineer can build the homepage without guessing. It states not just *what* each section is but *why* it exists and *how* it behaves in every state.

---

## Table of contents

1. [Goals](#1-goals)
2. [User journey](#2-user-journey)
3. [Design stance (Hallmark framing)](#3-design-stance-hallmark-framing)
4. [Page layout & shell](#4-page-layout--shell)
5. [Section order & rationale](#5-section-order--rationale)
6. [Section-by-section specification](#6-section-by-section-specification)
7. [Visual hierarchy](#7-visual-hierarchy)
8. [Responsive behavior](#8-responsive-behavior)
9. [Component composition](#9-component-composition)
10. [Empty states](#10-empty-states)
11. [Loading states](#11-loading-states)
12. [Micro-interactions](#12-micro-interactions)
13. [Accessibility considerations](#13-accessibility-considerations)
14. [Data dependencies & graceful degradation](#14-data-dependencies--graceful-degradation)

---

## 1. Goals

**The homepage's single job:** get a visitor browsing products and discovering what TechShop sells — then, when they're ready, nudge them to sign in for a personalized experience. Browsing is public; personalization is the reward for signing in.

| Priority | Goal | How the page serves it |
|---|---|---|
| **Primary** | Start product discovery | Curated product grids/rails + "shop by category" above the fold-adjacent area |
| **Primary** | Let users find a specific item fast | Persistent header search + department bar |
| **Secondary** | Convert browsers to members | Account-benefit nudge + personalized rail once signed in |
| **Secondary** | Surface the current promotion | One restrained featured-promo module |
| **Supporting** | Build purchase confidence | Factual service-highlights strip (shipping/returns/warranty) |
| **Supporting** | Close the page with trust & wayfinding | Considered footer |

**Non-goals (explicitly out of scope for the homepage):** full faceted filtering (belongs on the catalog/PLP page), checkout, and account management. The homepage points *to* those; it doesn't host them. This is a deliberate change from the current build, which puts a filter sidebar on the homepage — see §5 for why.

**Success signals:** click-through into a product or category, use of search, and (for signed-out) sign-in/register starts. The layout is arranged to make each of those the path of least resistance.

---

## 2. User journey

Four representative visitors. The page is arranged so each reaches their goal without scrolling past irrelevant content.

**A. First-time, undirected ("just looking").**
Lands → reads the featured promo to understand what TechShop is → scans "shop by category" or the featured-products grid → clicks a category or product → enters the catalog/PDP. *The page must communicate "this is a tech store, here's what's good right now" within the first viewport-and-a-half.*

**B. Returning, signed-in ("show me what's relevant").**
Lands → header greets them by name → the "Recommended for you" rail (personalized) appears in place of the generic "popular" rail → clicks a recommended product. *Personalization is the payoff for signing in; it must be visibly different from the signed-out experience.*

**C. Directed searcher ("I want a specific thing").**
Lands → goes straight to the header search → submits → leaves the homepage for search results. *Search is always one interaction away, at every scroll position (sticky header).*

**D. Deal-seeker ("what's on sale").**
Lands → featured promo or the deals rail → filters mentally by price/badge → clicks through. *Deals are surfaced but never fabricated — the rail only appears when real discounted products exist.*

Each journey maps to a section in §5; the section order is chosen to satisfy the earliest-diverging journeys first.

---

## 3. Design stance (Hallmark framing)

- **Genre:** modern-minimal e-commerce. Restraint over decoration; convention over surprise **in the shopping mechanics** (users need familiar patterns to shop), and anti-slop discipline in the **visual language**.
- **Macrostructure:** *merchandised marketplace* — a stack of curated product rails/grids and category tiles, not a landing-page hero-funnel. This is the correct shape for a storefront and avoids the centered-hero → 3-feature-cards → CTA template.
- **Nav archetype:** canonical customer header with search (the design system's Customer shell), justified because the page genuinely has search + cart + account + departments to host.
- **Footer archetype:** considered close (mast line + essential link groups + payment/trust marks) — **not** the 4-column "Product / Company / Resources / Legal" + social-row + tiny-copyright AI footer.
- **Anti-patterns explicitly avoided:** gradient hero background, gradient headline, blue→cyan gradient chips/tiles, radial-glow bloom, glassmorphism-as-decoration, full-viewport centered hero, auto-rotating carousel without pause, invented metrics/badges, pure `#fff` ground, single-font typography, heavy 800/900 weights, `transition: all`, animated focus rings.

---

## 4. Page layout & shell

Uses the **Customer shell** from the design system:

- **Sticky header** at `--z-sticky`, `--color-surface`, hairline `--color-border` bottom. Shared component — not re-implemented on this page.
- **Main content** centered within `--layout-max` (1200px), page-edge padding fluid `--space-4` → `--space-16`.
- **Shared footer** closes the page.
- **Vertical rhythm between sections:** `--space-16` desktop / `--space-12` mobile, varied intentionally (the promo and footer get more air; rails sit tighter) — never every section padded identically.
- **Background:** `--color-bg` (tinted neutral). Section surfaces are `--color-surface`; alternating sections may use `--color-surface-sunken` to create rhythm without borders.
- **Grid:** 12-column; product grids use the auto-fill product-grid rule from the design system (min column ~240px, `--space-6` gap).
- **No horizontal scroll** at any width; horizontally-scrolling rails scroll inside their own container only.

Overall page composition, top to bottom:

```
┌─────────────────────────────────────────────┐
│  Header (sticky)                              │  global chrome
├─────────────────────────────────────────────┤
│  Department bar                               │  wayfinding
│  Featured promo (hero module)                 │  merchandising
│  Service highlights strip                     │  reassurance
│  Shop by category                             │  browse
│  Featured products (primary grid)             │  DISCOVERY (core)
│  Deals rail            (conditional)          │  value/urgency
│  Recommended for you / Popular (personalized) │  relevance
│  Newsletter            (optional)             │  retention
├─────────────────────────────────────────────┤
│  Footer                                       │  close + trust
└─────────────────────────────────────────────┘
```

---

## 5. Section order & rationale

The order front-loads the earliest-diverging journeys (§2): search/departments for the directed user are in the always-present header; the undirected user gets orientation (promo) then browse surfaces (category, products); the returning user's personalized rail sits after the generic discovery so it reads as an addition, not a gate.

| # | Section | Exists because… | Condition |
|---|---|---|---|
| 1 | **Header** | The control center: search, cart, account, departments must be reachable at every scroll position. | Always |
| 2 | **Department bar** | Serves the browse-by-department user (Journey A/D) who doesn't want to search; fast lateral movement. | Always |
| 3 | **Featured promo** | Orients first-time visitors ("this is a tech store; here's the current headline offer") and gives merchandising a home — without a gradient hero. | Always (content configurable) |
| 4 | **Service highlights** | Purchase-anxiety is highest for first-time buyers; factual reassurance early lifts conversion. | Always (policy copy) |
| 5 | **Shop by category** | Undirected visitors browse by department; visual tiles beat a text list for discovery. | Always |
| 6 | **Featured products** | The core job. The curated grid is the primary "start browsing" surface and the main click target. | Always |
| 7 | **Deals rail** | Deal-seekers (Journey D) want value concentrated in one place; urgency drives clicks. | Only if real discounted products exist |
| 8 | **Recommended / Popular** | Returning signed-in users get personalization (the reward for signing in); signed-out users get social proof + a sign-in nudge. | Always (content swaps on auth) |
| 9 | **Newsletter** | Captures intent from visitors who won't buy today; retention channel. | Optional |
| 10 | **Footer** | Closes the page, provides secondary navigation, and carries trust/legal/payment marks. | Always |

**Why the filter sidebar is removed from the homepage:** faceted filtering (price/brand/sort across the whole catalog) is a product-listing-page concern. On the homepage it competes with discovery, adds a non-functional control surface, and pushes products down. The homepage curates (rails + featured grid); the catalog page filters. The department bar and category tiles are the homepage's navigation into that filtered experience.

---

## 6. Section-by-section specification

Each section below gives: **Purpose (why)**, **Content**, **Composition** (design-system components), **Layout & hierarchy**, and **Behavior/states**. Cross-cutting patterns (responsive, empty, loading, motion, a11y) are detailed in §7–13 and referenced here.

### 6.1 Header (global chrome)
- **Why:** persistent access to the whole shopping session — search, departments, cart, account. Everything else on the page assumes it's reachable.
- **Content:** brand mark (links to `/`); search field with submit; cart button with item-count badge; notifications (signed-in); account control (signed-out → "Sign in" + "Register"; signed-in → avatar + menu: My profile, My orders, Admin Center if `role === ADMIN`, Sign out).
- **Composition:** shared Header + BrandMark + Input (search) + IconButton (cart, notifications) + Badge (cart count) + Avatar + Dropdown menu + Button (sign in/register). All from the design system — one implementation each.
- **Layout & hierarchy:** brand left · search center (flexible width) · actions right. Header is elevation `--elevation-1`, sticky at `--z-sticky`. Search is the visual center of gravity (widest interactive element).
- **Behavior/states:** cart badge shows real count (0 → badge hidden or "0" per cart spec; never a fabricated number). Account menu is a Dropdown (keyboard + focus rules per §13). Search submit routes to search results. Condenses on mobile (§8).

### 6.2 Department bar
- **Why:** department browsing for users who don't search. A horizontal quick-nav into major categories.
- **Content:** category/department links sourced from the **categories API** (not a hardcoded list). Optional "All departments" affordance.
- **Composition:** horizontal list of Ghost buttons / links; `--radius-pill` chips.
- **Layout & hierarchy:** single row under the header, `--color-surface`, hairline bottom border. Secondary to the header — quieter weight (`--weight-medium`, `--text-body-sm`).
- **Behavior/states:** horizontally scrollable on overflow (scrolls within its own track, not the page). Each item navigates to the catalog filtered to that category. Loading = chip skeletons (§11); empty (no categories) = the bar is omitted entirely (not shown blank).

### 6.3 Featured promo (hero module)
- **Why:** the merchandising headline — orients first-time visitors and surfaces the current campaign. It is a *module*, not a full-viewport hero, and carries **no gradient background, no glow, no glassmorphism**.
- **Content:** campaign eyebrow (optional, `--text-overline`), a short headline (≤ 7 words), one supporting sentence, one primary CTA, and one real product/lifestyle image. All copy is configurable campaign data — **no invented discount numbers**; a promo with no real offer shows the evergreen "browse the catalog" message instead.
- **Composition:** a Card-like banner (solid `--color-surface` or `--color-primary-soft`), Button (primary CTA), real image (never a gradient placeholder). Optional secondary "offer" detail as a small factual chip only if the offer is real.
- **Layout & hierarchy:** asymmetric, **left-biased** — text column left, image right on desktop; content-height, not `100vh`. Headline is the largest type on the page (`--text-display`, roman, `--weight-bold`), sized down per the type scale if copy runs long. One primary CTA only.
- **Behavior/states:** if no campaign is configured → evergreen fallback (headline + "Shop all products" CTA), never blank. Image uses high fetch priority (it's the LCP element) — never lazy-loaded. Loading = a single skeleton block matching the banner shape.

### 6.4 Service highlights strip
- **Why:** first-time buyers hesitate; stating shipping/returns/warranty/secure-payment up front reduces friction. These are **policy statements, not metrics** — always true, never invented.
- **Content:** 3–4 items, each an icon + short label + one-line detail (e.g., "Free shipping over [threshold]", "30-day returns", "Official warranty", "Secure payment"). Thresholds/terms are configuration, not guesses.
- **Composition:** a row of small icon-label units; icons from the single Lucide set; no cards-in-cards.
- **Layout & hierarchy:** low-emphasis utility band, `--color-surface-sunken`, `--text-body-sm`, muted detail line. Deliberately quiet — it reassures, it doesn't shout.
- **Behavior/states:** static content (no loading). On mobile, wraps to 2×2 or a horizontal scroll (§8).

### 6.5 Shop by category
- **Why:** visual department discovery for undirected browsers — imagery communicates a category faster than a text link.
- **Content:** category tiles from the categories API — name + representative image/icon + optional item count (real count only).
- **Composition:** grid of category tiles (Card variant), one containment layer, `--radius-md`, `--elevation-1`.
- **Layout & hierarchy:** section heading (`--text-h2`) + optional "View all" link, then a responsive tile grid. Tiles are equal in role but the grid may feature one larger tile to avoid a rigid matrix.
- **Behavior/states:** loading = tile skeletons matching the grid (§11); empty (no categories) = section hidden (a store with no categories shows products only). Tile click → catalog filtered to that category.

### 6.6 Featured products (primary grid)
- **Why:** the core discovery surface and primary click target — the homepage's reason to exist.
- **Content:** a curated set of products from the **products API** (featured/active). Each card: image, name, brand/category, price, and a badge **only when the flag is real** (e.g., status/stock-driven), plus an "Add to cart" affordance. No invented "Best seller"/"Hot" labels — badges are data-driven.
- **Composition:** ProductCard (Card + image + Badge + price + Button "Add"). Section header uses the Section-head pattern (heading + "View all" → catalog). One sort control is permitted (Most popular / Newest / Price) as a lightweight enhancement; heavy filtering stays on the catalog page.
- **Layout & hierarchy:** section heading `--text-h2`; product grid per the design-system product-grid rule (auto-fill, min ~240px, `--space-6` gap, 4→3→2→1 across breakpoints). Prices use **tabular numerals** and are the strongest in-card signal after the image. **Break the uniform matrix** with one featured (2× span) tile per band so it reads merchandised, not templated.
- **Behavior/states:** loading = product-card skeletons (§11); empty (no products) = designed empty state (§10); error = inline Alert with retry. "Add to cart" gives optimistic feedback (§12), not a celebratory toast.

### 6.7 Deals rail (conditional)
- **Why:** concentrates real value/urgency for deal-seekers.
- **Content:** products with a genuine active discount (price < basePrice, or a real promotion flag). If none exist, **the entire rail is omitted** — no fabricated deals.
- **Composition:** horizontally-scrollable rail of ProductCards, each showing original + current price (tabular numerals) and, if applicable, a real percentage-off derived from the two prices (computed, not invented).
- **Layout & hierarchy:** heading `--text-h2` + optional "See all deals"; horizontal scroll track with visible affordance, snap points.
- **Behavior/states:** manual/keyboard scroll — **never auto-rotating**. Loading = card skeletons in the rail; conditional visibility as above.

### 6.8 Recommended for you / Popular (personalized)
- **Why:** the return-visitor's fast path to relevant products, and the visible reward for signing in. Signed-out users get social-proof ("popular") plus a nudge to sign in.
- **Content (signed-in):** "Recommended for you" from the **recommendations API**; heading personalized. **Content (signed-out):** "Popular right now" from a popularity/top-products source, preceded by a compact **account-benefit nudge** (save carts, wishlists, personalized recommendations) with Sign in / Register buttons.
- **Composition:** Section-head + ProductCard rail/grid; for signed-out, a restrained inline band (not a gradient banner) with two Buttons (primary Register, secondary Sign in).
- **Layout & hierarchy:** clearly distinct heading so signed-in personalization reads as different from the generic featured grid. The signed-out nudge is secondary emphasis — informative, not a wall.
- **Behavior/states:** signed-in + no recommendations yet → fall back to "Popular" with a one-line "recommendations improve as you shop" note. Loading = card skeletons. The nudge never blocks browsing (no modal, no gate).

### 6.9 Newsletter (optional)
- **Why:** capture intent from visitors who won't purchase today.
- **Content:** one-line value proposition + email Input + submit Button. Single field.
- **Composition:** Input + Button + inline success/error Alert.
- **Layout & hierarchy:** a quiet full-width band near the footer, `--color-surface-sunken`. Low emphasis.
- **Behavior/states:** inline validation on submit (§16 form rules); silent-ish success (a small confirmation, not celebration); errors explain what to fix. Omit the section if no newsletter backend exists — don't ship a dead field.

### 6.10 Footer
- **Why:** closes the page, provides secondary navigation, and carries trust/legal/payment marks.
- **Content:** brand mast line + a few grouped links that genuinely exist (Shop / Support / Company), payment & security marks, copyright. **Not** the AI 4-column Resources/Legal + social-row + tiny-copyright cliché.
- **Composition:** shared Footer component; BrandMark; grouped links; payment icons from the single icon set.
- **Layout & hierarchy:** low emphasis, `--color-surface` over `--color-border` top hairline, generous top padding (`--space-16`) to signal "the page ends here."
- **Behavior/states:** static; links must resolve to real routes only.

---

## 7. Visual hierarchy

The page reads in this priority order; type scale, color, and space enforce it (never weight alone — max weight is 700).

1. **Featured-promo headline** — `--text-display`, `--weight-bold`, `--color-heading`. The single largest element; one per page.
2. **Section headings** — `--text-h2`, `--weight-semibold`. Consistent across all sections so the page scans as a rhythm of equals.
3. **Product name & price** — name `--text-h4`/`--weight-semibold`; **price** `--weight-semibold` + tabular numerals + `--color-heading` (the decisive in-card value).
4. **Primary CTAs** — one primary Button per section maximum; `--color-primary` fill carries the eye to the intended action.
5. **Supporting copy / metadata** — `--text-body-sm`, `--color-muted`.
6. **Utility bands** (service highlights, department bar, footer) — deliberately quietest; `--color-surface-sunken`/muted text.

**Rules applied here:**
- Color is earned: brand `--color-primary` appears only on interactive/priority elements; the accent (`--color-accent`) appears at most once (e.g., a single promo detail). No gradients as surface treatment.
- Eyebrows/overlines are used at most once (the promo), stacked above their heading — never a tag-left/heading-right two-column head.
- Whitespace varies by importance: the promo and footer breathe most; rails sit tighter.
- Surface alternation (`--color-surface` ↔ `--color-surface-sunken`) creates section separation without heavy borders.

---

## 8. Responsive behavior

Mobile-first; verified at 320 / 375 / 414 / 768 / 1024 / 1280px. Breakpoints per the design system.

| Section | `xs`–`sm` (< 768) | `md` (768–1023) | `lg`+ (≥ 1024) |
|---|---|---|---|
| Header | Brand + cart + account visible; search collapses to icon→expands, or drops to a second row; account condenses to avatar/menu | Full header, search inline | Full header, search centered |
| Department bar | Horizontal scroll, snap | Horizontal, may wrap | Full row |
| Featured promo | Single column, image below text; headline steps down the type scale | Two-column, tighter | Two-column, left-biased, full display size |
| Service highlights | 2×2 grid or horizontal scroll | Row of 3–4 | Row |
| Shop by category | 2 columns | 3 columns | 4 columns (one featured 2×) |
| Featured products | 1–2 columns | 3 columns | 4 columns (one featured 2×) |
| Deals / recommended rails | Horizontal scroll, ~1.2 cards peeking | Horizontal scroll | Horizontal scroll or grid |
| Newsletter | Stacked field + button | Inline | Inline |
| Footer | Stacked groups | 2–3 groups | Full row |

**Global responsive rules:**
- No horizontal page scroll at any width; rails and the table-free wide content scroll inside their own containers.
- Type and section padding interpolate between breakpoints (fluid ranges from the design system).
- Product/category grids collapse 4→3→2→1 predictably via the auto-fill min-width rule.
- Clickable labels never wrap to two lines — shorten (e.g., "Add to cart" → "Add" in the card) or `nowrap` and reflow.
- Touch targets ≥ 44px; spacing loosens slightly on coarse pointers.
- Images in grid tracks use a min-width floor of 0 to prevent blowout.

---

## 9. Component composition

Every UI element maps to a design-system component. Nothing on this page is a bespoke one-off.

| Section | Components used |
|---|---|
| Header | Header shell · BrandMark · Input (search) · IconButton (cart, notifications) · Badge · Avatar · Dropdown · Button |
| Department bar | Chip/Ghost-button links · (skeleton) |
| Featured promo | Promo Card · Button (primary) · Image · Chip (real offer only) |
| Service highlights | Icon + label units (Lucide icons) |
| Shop by category | Category Card grid · Image · (skeleton) |
| Featured products | ProductCard (Card · Image · Badge · price · Button "Add") · Section-head · Select (sort) · Empty state · Alert |
| Deals rail | ProductCard (with dual price) · Section-head · scroll rail |
| Recommended/Popular | Section-head · ProductCard rail · sign-in nudge (Buttons) |
| Newsletter | Input · Button · Alert |
| Footer | Footer shell · BrandMark · link groups · payment icons |

**Composition rules:** one containment layer per card (no card-in-card); one primary Button per section; ProductCard is a single shared component reused by featured / deals / recommended (variants: with/without dual price, with/without badge). If a needed component doesn't exist yet (ProductCard, Section-head, category tile), it is **added to the shared library first**, then used here — never inlined on the page.

---

## 10. Empty states

Every data-driven section has a designed empty state (design-system Empty-state anatomy: icon · title · one-line guidance · optional single action). Distinguish "empty because new" from "empty because filtered/none-available."

| Section | Condition | Title | Guidance | Action |
|---|---|---|---|---|
| Department bar | No categories | — | (bar hidden entirely) | — |
| Shop by category | No categories | — | (section hidden entirely) | — |
| Featured products | No products at all | "No products yet" | "Products will appear here as the catalog is stocked." | — (or "Notify me" if supported) |
| Deals rail | No real deals | — | (rail hidden entirely) | — |
| Recommended (signed-in) | No recommendations yet | "Recommendations are warming up" | "As you browse and buy, this fills with picks for you." | Falls back to "Popular" |
| Popular (signed-out) | No popularity data | "Start exploring" | "Browse the full catalog to find your gear." | "Shop all products" |
| Newsletter | Submitted successfully | inline success Alert | "You're on the list." | — |

**Rule:** a section with genuinely nothing to show (categories, deals) is **hidden**, not rendered as a blank frame. A section that will fill over time (recommendations) shows an encouraging empty state and a fallback, never a dead end. Centered within the content region, muted guidance text.

---

## 11. Loading states

Skeletons over spinners wherever the layout is known (design-system Skeleton rules). Skeletons match the shape and count of the content they replace.

| Section | Loading treatment |
|---|---|
| Header | Renders immediately from cached auth (no skeleton); account area shows a small placeholder only while the session is restoring |
| Department bar | 5–7 chip skeletons at the real chip size |
| Featured promo | One banner-shaped skeleton block (text lines + image block) |
| Shop by category | Tile skeletons matching the responsive column count |
| Featured products | Product-card skeletons (image block + 2 text lines + price line + button), same count as the target grid |
| Deals / recommended rails | Card skeletons in the rail width |
| Newsletter / footer | No skeleton (static) |

**Timing & motion:** delay-show skeletons ~150ms (don't flash on fast responses); once shown, keep ~300ms minimum to avoid flicker. Shimmer/pulse is subtle and **static under reduced motion**. The loading region carries `aria-busy` and an `aria-label` so assistive tech announces the wait. If a fetch fails, the section swaps skeleton → inline Alert with a retry action (not a silent empty grid).

---

## 12. Micro-interactions

Motion is short, scoped, and reversible (design-system Motion rules: animate only `transform`/`opacity`; durations `--dur-fast`/`--dur-base`; `--ease-out`; one signal per element; reduced-motion honored).

| Interaction | Behavior |
|---|---|
| Product card hover | One signal only — raise `--elevation-1` → `--elevation-2` (or a 1px lift), `--dur-fast`, `--ease-out`. No scale + shadow + border all at once. |
| Button hover/active | Background shifts `--color-primary` → `--color-primary-hover` (`--dur-fast`); pressed = subtle 1px translate. |
| Add to cart | **Optimistic**: card button shows an immediate "Added" affordance and the header cart badge increments at once; if the request fails, revert + inline error. No celebratory toast for a visible change. |
| Focus (any control) | Focus ring appears **instantly** (`--dur-instant`) — never transitioned. |
| Department / category / promo CTA | Color/underline shift on hover; instant focus ring. |
| Rails (deals/recommended) | Manual scroll with snap; scroll affordance buttons (if present) are keyboard-operable. **No auto-advance.** |
| Search focus | Field elevates to focus-within ring instantly; no animated gradient. |
| Page load | At most **one** orchestrated entrance (e.g., a gentle fade/rise of the promo + first product row on first paint). Everything below is simply present — no universal scroll-triggered fade-up. |
| Skeleton → content | Cross-fade ≤ `--dur-base`; under reduced motion, swap instantly. |

**Banned here:** bounce/overshoot easing, hover-scale on everything, animated hover gradients, cursor-follower dots, auto-rotating carousels, celebratory success toasts for visible actions, layout-shifting toasts.

---

## 13. Accessibility considerations

Baseline WCAG 2.1 AA (design-system Accessibility section).

**Structure & landmarks**
- One `h1` on the page (the featured-promo headline). Section headings are ordered `h2`; card titles `h3`.
- Landmark regions: `header` (with `nav` for departments), `main` (all content sections), `footer`. The department bar and footer nav are `nav` with distinct accessible names.
- Product and category cards are real links/buttons with accessible names (product name + price announced), not clickable divs.

**Keyboard & focus**
- Every interactive element (search, department chips, category tiles, product cards, "Add", CTAs, account menu, rails) is keyboard-reachable in logical order with a visible instant focus ring (`--color-focus`, ≥ 3:1).
- Account dropdown: opens on click/Enter, closes on Escape/outside-click, focus returns to the trigger; arrow-key navigation within.
- Horizontal rails are operable by keyboard (arrow keys or focusable scroll controls) — scrolling is never mouse/hover-only.

**Perception & semantics**
- Contrast ≥ 4.5:1 for text, ≥ 3:1 for UI/borders/focus, in both light and dark themes (page inherits app-wide dark mode; not a per-page toggle).
- State never by color alone: badges and price changes pair color with text/shape; the deals discount states the number, not just a red color.
- Icons are decorative (`aria-hidden`) with text labels, or icon-only buttons carry `aria-label` (cart, notifications).
- Images: product/category images have meaningful `alt` (product name); the promo image `alt` describes the campaign or is empty if purely decorative beside redundant text.

**Feedback & motion**
- Cart badge / count changes are announced via an `aria-live` region.
- Loading regions use `aria-busy`; errors use `role="alert"`.
- `prefers-reduced-motion` disables the load entrance, hover lifts collapse to instant, skeleton shimmer goes static.

**Targets & input**
- Touch targets ≥ 44×44px; nothing important is hover-only (card actions are visible/tappable, not hover-revealed).
- Search has a real associated label (visually hidden is acceptable) and a submit affordance reachable by keyboard.

---

## 14. Data dependencies & graceful degradation

The homepage composes several data sources. Each has a defined fallback so the page is never broken or blank.

| Section | Source | If unavailable / empty |
|---|---|---|
| Header account | Auth/session | Renders signed-out header (Sign in / Register) |
| Department bar | Categories API | Bar hidden |
| Featured promo | Campaign config | Evergreen "Shop all products" fallback |
| Service highlights | Static policy config | Always renders (real policy copy) |
| Shop by category | Categories API | Section hidden |
| Featured products | Products API | Empty state (§10); on error → inline Alert + retry |
| Deals rail | Products with real discount | Rail hidden |
| Recommended (signed-in) | Recommendations API | Falls back to Popular + note |
| Popular (signed-out) | Top-products/popularity | "Start exploring" empty state |
| Newsletter | Newsletter backend | Section omitted if no backend |

**Principles:** never fabricate content to fill a slot (no invented products, deals, badges, or metrics); hide sections that have genuinely nothing to show; degrade signed-in features to signed-out equivalents rather than erroring; and keep the core discovery grid (featured products) resilient with explicit empty/error states because it is the page's reason to exist.

---

*End of specification. Build order suggestion: shared ProductCard + Section-head + category tile components first (they're reused across §6.5–6.8), then compose sections top-down, wiring real data sources with the fallbacks in §14.*
