# TechShop Catalog (Product Listing) — Design Specification

**Status:** Implementation-ready · **Version:** 1.0 · **Last updated:** 2026-08-07
**Governed by:** [`design-system.md`](../design-system.md) · **Continues:** [`home.md`](./home.md)
**Route(s):** `/catalog` (all products), `/catalog?category=<slug>` (department browse), `/catalog?q=<query>` (search results). One page, three entry modes.

The homepage spec deliberately deferred all faceted filtering to this page ("the homepage curates; the catalog filters"). This is where that filtering lives. Every token, component, and rule below resolves to the design system; where this spec restates a value it is only naming a token. It is written so an engineer can build the page without guessing, and every decision states its reasoning.

---

## Table of contents

Purpose · Target Users · Primary User Goals · Information Architecture · Desktop Layout · Tablet Layout · Mobile Layout · Visual Hierarchy · Components Used · User Flow · Empty States · Loading States · Error States · Search & Filtering Behavior · Sorting Behavior · Pagination / Infinite Scroll · Accessibility · Responsive Rules · Motion · Edge Cases · Future Improvements

---

## Purpose

The catalog page turns *intent* into a *shortlist*. A visitor arrives with a need — a department to browse, a search to run, or a deal to chase — and this page's only job is to let them **narrow a large product set to the few items worth considering**, then click through to a product.

It is the workhorse of the store: most sessions that end in a purchase pass through it. Everything on it exists to serve one loop — **see results → refine → see fewer, better results → click a product**. Design decisions optimize the speed and confidence of that loop.

**Why a single page for three entry modes (browse / search / all):** the mechanics — grid, facets, sort, pagination — are identical whether the initial set came from a category, a search query, or "everything." Unifying them means one component, one mental model for the user, and one place to maintain. Only the header context (title + breadcrumb + result framing) and the default sort differ by mode.

---

## Target Users

| User | Arrives from | Mindset | What they need most |
|---|---|---|---|
| **Directed searcher** | Header search (`?q=`) | "I know roughly what I want" | Relevant results fast; refine by brand/price |
| **Department browser** | Homepage department bar / category tiles (`?category=`) | "Show me what's in this category" | A scannable grid; sort + light filters |
| **Deal / budget shopper** | Homepage deals rail, or price sort | "What fits my budget / is on sale" | Price filter + price/discount sort |
| **Comparison shopper** | Any entry, then refines | "Which of these is best for me" | Enough per-card info to compare; stable, predictable filtering |
| **Returning signed-in user** | Anywhere | "Get me back to relevant gear" | (Future) personalized default sort; consistent behavior with signed-out |

All are shopping, not reading. The page is **scanned and operated**, not read top-to-bottom — so per the design system this is information-design work: surface the result summary before the detail, make state legible at a glance, and make what's interactive look interactive.

---

## Primary User Goals

1. **Understand the result set immediately** — what am I looking at, and how many results?
2. **Narrow confidently** — apply filters and instantly see the effect, without losing my place or my other filters.
3. **Re-order to my priority** — sort by price, newness, or relevance.
4. **Recover from over-filtering** — when I filter to zero, get out of the dead end easily.
5. **Get to a product** — click through with the context (filters/scroll) preserved so Back returns me here.
6. **Share or return to a view** — the URL captures my filters, sort, and page so the view is deep-linkable and Back/Forward work.

Goal 6 is a foundational decision that shapes the whole page: **all view state lives in the URL** (see Information Architecture). It is why filtering feels like navigation, not a hidden client state that evaporates on refresh.

---

## Information Architecture

**View state is URL-encoded.** Every dimension of the current view is a query parameter, so the view is shareable, deep-linkable, refresh-safe, and Back/Forward-navigable.

| Param | Meaning | Example | Notes |
|---|---|---|---|
| `q` | Search query | `?q=laptop` | Present in search mode |
| `category` | Category slug | `?category=laptops` | Single (department mode); may be multi in "all" mode |
| `brand` | Brand slug(s) | `?brand=acme,nova` | Multi-select, comma-joined |
| `minPrice` / `maxPrice` | Price bounds | `?minPrice=200&maxPrice=800` | Numeric |
| `inStock` | Availability | `?inStock=1` | Boolean |
| `sort` | Sort key | `?sort=price_asc` | See Sorting |
| `page` | Page number | `?page=2` | 1-based |

**Why URL state (reasoning):** e-commerce users share links, open products in new tabs, and lean on the Back button. Client-only filter state breaks all three and makes refresh destroy the shortlist the user just built. URL state also gives SEO-friendly, crawlable filtered views and makes the page trivially testable (a URL is a fixture).

**Content hierarchy on the page (outermost → in):**

```
Customer shell (shared header + footer)
└─ Catalog page
   ├─ Breadcrumb                     (where am I)
   ├─ Page header                    (title + result count + mode framing)
   ├─ Toolbar                        (sort · view · active-filter chips · result count)
   ├─ Two-region body
   │   ├─ Filter panel (facets)      (narrow)
   │   └─ Results region             (grid + pagination)
   └─ Footer                         (reachable — see Pagination)
```

**Facets available now** (derived from real data — never invented): **Category** (categories API), **Brand** (brands API, multi-select), **Price range** (from `basePrice`), **Availability** (in-stock, from `stockQuantity`/`status`). Spec-based facets (RAM, CPU, screen size) and rating facets are *Future Improvements* — the current data model stores specs as free-text name/value pairs and reviews are a planned module, so structured facets can't be built yet without fabricating structure.

---

## Desktop Layout

**≥ 1024px (`lg` and up).** Two-region layout: a persistent left **filter panel** beside a wide **results region**, both inside `--layout-max` (up to 1320px for this data-dense page).

```
┌───────────────────────────── Header (sticky) ─────────────────────────────┐
├────────────────────────────────────────────────────────────────────────────┤
│  Home / Laptops                                             ‹ breadcrumb ›   │
│  Laptops                                                    ‹ page title ›   │
│  1,240 results                                              ‹ result count › │
│                                                                              │
│  [ Active filters: Acme ✕  |  $200–$800 ✕  |  In stock ✕  |  Clear all ]     │
│                                              Sort: [ Most popular ▾ ]  ▦ ▤   │
│ ┌────────────────┐  ┌──────────────────────────────────────────────────┐   │
│ │ FILTERS        │  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                │   │
│ │ Category       │  │ │ card │ │ card │ │ card │ │ card │   (4-up grid)  │   │
│ │  ☐ Laptops     │  │ └──────┘ └──────┘ └──────┘ └──────┘                │   │
│ │  ☐ Phones …    │  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                │   │
│ │ Brand          │  │ │ card │ │ card │ │ card │ │ card │                │   │
│ │  ☐ Acme (120)  │  │ └──────┘ └──────┘ └──────┘ └──────┘                │   │
│ │  ☐ Nova (86) … │  │                                                    │   │
│ │ Price          │  │            [ Load more ]  · showing 24 of 1,240    │   │
│ │  [min]–[max]   │  │                                                    │   │
│ │ Availability   │  └──────────────────────────────────────────────────┘   │
│ │  ☐ In stock    │                                                          │
│ └────────────────┘                                                          │
├────────────────────────────────── Footer ──────────────────────────────────┤
```

- **Filter panel:** fixed width ~260–280px, `--color-surface`, `--radius-md`, `--elevation-1`, sticky within the viewport (scrolls with content until it reaches the top, then pins) so facets stay reachable in a long grid. Facet groups are collapsible disclosures; the most-used (Category, Brand, Price) are open by default.
- **Results region:** the product grid uses the design-system product-grid rule — **4 columns** at `lg`/`xl`, `--space-6` gap, one optional featured (2× span) tile to avoid a rigid matrix. Prices use **tabular numerals**.
- **Toolbar** sits above the grid: result count (left), sort Select + view toggle (right), and an active-filter chip row beneath. Chips are individually removable + a "Clear all".
- **Why the persistent sidebar on desktop:** with the horizontal space available, keeping facets always visible lets users refine in a tight loop without opening/closing anything — the fastest path for the comparison shopper. (This is the same sidebar the homepage spec *removed* from the homepage, because on the homepage it competed with discovery; here refinement *is* the job.)

---

## Tablet Layout

**768–1023px (`md`).** Horizontal space is tight for a permanent sidebar beside a useful grid, so filters move behind a **toggle**, and the grid takes the full width.

- A sticky **"Filters" toggle button** (with an active-filter count badge, e.g., "Filters · 3") sits in the toolbar. Activating it opens the filter panel as a **left slide-in drawer** (overlay, `--z-overlay`/`--z-modal`), not a full-screen sheet — the user still sees results behind it.
- Grid: **3 columns**, `--space-6` gap.
- Toolbar: result count + Filters toggle (left), sort Select (right); active-filter chips wrap to their own row.
- Filters **apply live** while the drawer is open (results update behind it), since the drawer only covers part of the screen — the user gets immediate feedback. Closing the drawer keeps the applied state.
- **Why a drawer, not the desktop sidebar:** at this width a 260px sidebar would squeeze the grid to 2 cramped columns; a drawer preserves a comfortable 3-up grid while keeping filters one tap away.

---

## Mobile Layout

**< 768px (`xs`–`sm`).** Single column; filtering and sorting are **deferred into sheets** so the grid owns the small screen.

- A **sticky bottom (or below-header) action bar** with two equal controls: **"Filter"** (with active count badge) and **"Sort"**. It stays reachable as the user scrolls the grid.
- **Filter** opens a **full-screen sheet** (`role="dialog"`, focus-trapped): facet groups stacked, a live **result-count preview** on the apply button ("Show 42 results"), a sticky footer with "Clear all" + "Apply". **Filters batch here and commit on Apply** — they do *not* auto-apply per tap.
- **Sort** opens a compact **bottom sheet** of radio options; selecting one applies and closes.
- Grid: **2 columns** at `sm`, **1 column** at the smallest widths (or a compact 2-up if card content allows); `--space-4` gap.
- Breadcrumb collapses to a single "‹ Back to {parent}" affordance; page title + result count stay.
- **Why batch-then-apply on mobile (reasoning):** each auto-apply under a full-screen sheet would refetch a result set the user can't even see, wasting data and thrashing the network on cellular. Batching lets the user assemble a query, preview the count, and commit once. The count-on-button gives the immediate feedback that auto-apply would otherwise provide.

---

## Visual Hierarchy

The page reads in this order; scale, color, and space enforce it (never weight alone — max weight 700).

1. **Product cards (the grid)** — the reason for the page. They get the most space and visual weight. Within a card: **image** first, then **name** (`--text-h4`/`--weight-semibold`), then **price** (`--weight-semibold`, tabular numerals, `--color-heading` — the decisive value), then secondary meta (brand/rating) muted.
2. **Page title + result count** — `--text-h1` title, count in `--color-muted` beside/below. Orients without dominating.
3. **Toolbar (sort + active filters)** — present but quiet; sort is a labeled Select, active filters are removable chips (`--radius-pill`).
4. **Filter panel** — structural, low-chroma. Facet group labels `--text-overline`/`--weight-semibold`; options `--text-body-sm`. It's a tool, not a focal point.
5. **Breadcrumb** — quietest; `--text-body-sm`, `--color-muted`.
6. **Pagination / Load more** — a single clear affordance at the grid's end.

**Applied rules:** color is earned — `--color-primary` appears only on the active sort, applied filters, and the primary action; no gradients anywhere; badges/states pair color with text/shape (out-of-stock, discount). Whitespace: the grid breathes (`--space-6`), the filter panel is denser (a working surface). Active-filter chips make the *current query legible at a glance* — the single most important "state in form" decision on the page.

---

## Components Used

Everything maps to the shared library. Components not yet in it are **added there first**, then used (never inlined).

| Area | Components |
|---|---|
| Shell | Header · Footer (shared, from design system) |
| Wayfinding | **Breadcrumb** *(new)* |
| Header of page | Section-head (title + count) |
| Toolbar | Select (sort) · **ViewToggle** grid/list *(new, optional)* · **ActiveFilterChipBar** *(new)* using Chip (removable) · Button ("Clear all") |
| Filter panel | **FilterPanel / FacetGroup (disclosure)** *(new)* · Checkbox (brand, category, availability) · **PriceRangeControl** *(new: min/max Inputs, optional slider)* · Button ("Apply"/"Clear") |
| Mobile/tablet | **FilterSheet / Drawer** *(new)* built on the design-system Modal/dialog primitive · Bottom-sheet for Sort |
| Results | **ProductCard** (reused from homepage — variants: badge, dual-price, out-of-stock) · grid container |
| Paging | **LoadMoreButton** *(new)* and/or **Pagination** *(new)* |
| States | Skeleton (card + facet) · Empty state · Alert (error) |

**Reasoning:** reusing the homepage's ProductCard guarantees the product looks identical wherever it appears — a core consistency goal of the design system. The new components (Breadcrumb, FilterPanel, FacetGroup, PriceRangeControl, FilterSheet, ChipBar, Pagination/LoadMore) are catalog-shaped but reusable by future search and category pages, so they belong in the shared library, not on this page.

---

## User Flow

**Primary loop:**

```
Enter (browse / search / all)
   → Results render (grid + facets + count)
      → User refines: toggle facet / set price / change sort
         → URL updates → results + count update → active-filter chips update
            → (repeat until satisfied)
   → User clicks a product card
      → Navigate to Product Detail (view state preserved in URL + scroll restored on Back)
```

**Detailed steps & reasoning:**
1. **Arrival.** Mode determined by params. Search mode: title = "Results for '{q}'", default sort = relevance. Browse mode: title = category name, default sort = popularity/featured. All mode: title = "All products".
2. **First render.** Facets + count + grid load (facets and first page can load in parallel). Skeletons per Loading States.
3. **Refine.** Desktop/tablet: facet changes apply live and update the URL, count, chips, and grid. Mobile: changes batch in the sheet, preview the count, commit on Apply.
4. **Sort.** Changes `sort`, resets to `page=1`, re-fetches, preserves filters.
5. **Paginate.** "Load more" appends the next page and updates `page`; numbered pagination replaces. Footer stays reachable (see Pagination).
6. **Click through.** Card → Product Detail. The catalog URL (with all state) is in history, so Back restores the exact view; scroll position is restored to the clicked card.
7. **Recover.** If refinement yields zero, the empty state offers one-tap relaxation of the last/most-restrictive filter and "Clear all".

---

## Empty States

Three genuinely different "no results" situations need three different messages (design-system Empty-state anatomy: icon · title · one-line guidance · one action). Conflating them is a real UX failure — "no results" for an over-filtered search reads as "the store is broken."

| Situation | Title | Guidance | Primary action |
|---|---|---|---|
| **Search found nothing** (`q` with 0 base results) | "No results for '{q}'" | "Check the spelling or try fewer, more general words." | "Browse all products" |
| **Filters exclude everything** (results existed, filters → 0) | "No products match these filters" | "Try removing a filter — price is the most common culprit." | "Clear all filters" (+ chips remain, individually removable) |
| **Category genuinely empty** (rare) | "Nothing here yet" | "This category has no products right now." | "Browse other categories" |

**Reasoning:** the filter-exclusion case keeps the active-filter chips visible so the user sees *why* it's empty and can remove one; it does not dump them back to an unfiltered page (which would discard the query they built). The search-empty case suggests query changes, not filter changes. Empty states are centered in the results region; the filter panel stays fully interactive so recovery is immediate.

---

## Loading States

Skeletons over spinners wherever layout is known (design-system Skeleton rules). Distinguish **first load** from **refinement load**.

- **First load:** filter-panel skeleton (group labels + a few option rows) **and** a product-grid skeleton (card-shaped: image block + 2 text lines + price line), count reads "Loading…". Facets and first product page load in parallel.
- **Refinement load** (filter/sort/page change): keep the filter panel fully rendered and interactive; show the skeleton **only in the results region** (or a subtle dimmed overlay on the existing grid so the user keeps context). The count switches to a spinner-less "Updating…" until the new number arrives.
- **Load-more:** the button enters a loading state; a row of card skeletons appears below the existing grid; on arrival they swap to real cards and focus moves to the first new card (see Accessibility).
- **Timing:** delay-show skeletons ~150ms (no flash on fast responses); once shown, keep ~300ms minimum. The loading region carries `aria-busy`; results-count changes announce via `aria-live`.

**Reasoning:** refinement must never blank the filter panel — the user is mid-thought and needs their controls to stay put. Replacing only the results region preserves their place and prevents the "whole page reloaded" feeling that makes filtering feel heavy.

---

## Error States

- **Products fetch fails:** results region shows an inline Alert (`role="alert"`) — "Couldn't load products. Check your connection and try again." — with a **Retry** button. The filter panel stays usable so a Retry can carry the current query.
- **Facets fetch fails (products OK):** render the grid normally; the filter panel shows a compact inline error with Retry, so the user can still browse even if refinement is temporarily unavailable. Partial failure never blocks the whole page.
- **Both fail:** full results-region Alert + Retry; header/breadcrumb still render.
- **Invalid URL params** (e.g., `minPrice=abc`, unknown `brand`, `page` beyond last): **degrade gracefully, don't error** — ignore/clamp the bad value, render the nearest valid view, and reflect the corrected state back into the URL. A shared link should never land on a broken page.
- **Stale/again-in-flight requests:** cancel or ignore superseded responses (last-write-wins) so a fast series of filter clicks can't render an out-of-order result set.

**Reasoning:** errors explain what went wrong and how to fix it (design-system copy rules), never apologize vaguely. Partial degradation (grid without facets, or facets without grid) beats an all-or-nothing failure because the user's core task — seeing products — survives.

---

## Search & Filtering Behavior

**Search**
- Search is initiated from the shared header (submit-driven) and lands here with `?q=`. An in-page search-refine field is optional; if present it is submit/debounced (~300–400ms), not per-keystroke fetching.
- Search scope: product name primarily, with SKU/short-description as backend allows. Case- and accent-insensitive (the profile page already normalizes Vietnamese diacritics — reuse that approach).
- Results framing: "Results for '{q}'"; default sort = relevance.

**Filtering**
- **Facets:** Category, Brand (multi), Price range, Availability. **Within a facet, multiple selections are OR** (Acme *or* Nova); **across facets they are AND** (Acme/Nova *and* $200–800 *and* in stock). This is the universal e-commerce mental model — state it in no UI copy but honor it exactly.
- **Apply timing:** desktop/tablet drawer → **live apply** on change (instant feedback, cheap because the panel is visible); mobile full-screen sheet → **batch, preview count, commit on Apply** (reasoning under Mobile Layout).
- **Price range** commits on blur/Enter (or a debounced ~400ms) — not per digit — to avoid a fetch per keystroke.
- **Active-filter chips:** every applied filter appears as a removable chip above the grid; each chip removes just that filter; "Clear all" removes every filter (but not the search query — clearing filters and clearing a search are different intents).
- **Facet counts** (e.g., "Acme (120)") are shown when the backend can provide per-facet counts; treated as an enhancement, and only real counts — never estimated.
- **Zero-result facets:** a facet option that would yield zero given the current other filters is disabled (not hidden) so the user understands the constraint rather than wondering where an option went.

**Reasoning:** OR-within/AND-across matches expectation; violating it silently produces "wrong" results the user can't diagnose. Live-vs-batch apply is tuned to whether the results are visible during refinement — the same principle, adapted to viewport.

---

## Sorting Behavior

- **Options:** Relevance (search mode only) · Most popular / Featured (browse default) · Newest · Price: low→high · Price: high→low · Name A–Z. Each maps to a `sort` value (`relevance`, `popular`, `newest`, `price_asc`, `price_desc`, `name_asc`).
- **Defaults:** search mode → `relevance`; browse/all → `popular` (falls back to `newest` if no popularity data exists — never invent ranking).
- **Control:** a single labeled Select ("Sort: …"), `--color-primary` on the active value. On mobile, a bottom-sheet of radio options.
- **Behavior:** changing sort resets to `page=1`, preserves all filters, updates the URL, and re-fetches. A **stable secondary sort** (e.g., by id) guarantees deterministic order so pagination never duplicates or skips an item.
- **Variant-priced products:** price sorts use the product's effective/base price (or "from" price if variants differ) consistently — the same value shown on the card, so the sort matches what the eye sees.

**Reasoning:** resetting to page 1 on sort change is required — keeping `page=3` after re-sorting would land the user in the middle of a newly-ordered set. The stable secondary key is the difference between correct and subtly-broken pagination.

---

## Pagination / Infinite Scroll

**Decision: "Load more" button as the primary mechanism, with page synced to the URL — plus numbered pagination as an accessible/deep-link fallback. No auto-firing infinite scroll.**

- Page size: **24** (divisible by 2/3/4 so the last row is full at every column count).
- **Load more:** appends the next page, updates `?page=`, and shows "showing 24 of 1,240". After append, focus moves to the first newly-loaded card so keyboard/screen-reader users aren't stranded at the button.
- **Numbered pagination** (`nav` with `aria-current="page"`) is offered as an alternative and is the canonical mechanism for deep links and SEO; a shared `?page=N` link loads that page directly.
- **Back-button:** returning from a product restores the accumulated pages (or the specific page) and the scroll position of the clicked card.

**Why not auto-infinite-scroll (reasoning):**
- **Footer reachability** — auto-loading on scroll makes the footer (and its links/trust marks) practically unreachable; the design system requires the footer to close every page.
- **Accessibility** — content appearing without user action disorients screen-reader and keyboard users; a button is an explicit, announced action.
- **Control & performance** — the user decides when to load more; the DOM doesn't grow unbounded on a large catalog. (For very large catalogs, list virtualization is a Future Improvement.)
- **Deep-linking** — a discrete `page` param is shareable and restorable; pure scroll position is not.

---

## Accessibility

Baseline WCAG 2.1 AA (design-system Accessibility section).

- **Landmarks & headings:** `header`, `nav` (breadcrumb + pagination, each named), `main` with one `h1` (page title), facet group labels as headings/legends, `footer`. A "Skip to results" link lets keyboard users bypass the filter panel.
- **Result count is a live region** (`aria-live="polite"`): every filter/sort/search change announces the new count ("42 results") so non-visual users get the same immediate feedback sighted users get from the grid changing.
- **Filters as real form controls:** checkboxes with associated labels grouped in fieldsets/disclosures; the disclosure toggle exposes expanded state; price inputs are labeled with min/max and validated. Every facet is keyboard-operable.
- **Active-filter chips** are buttons with accessible names ("Remove filter: Acme"); removable by keyboard.
- **Filter sheet/drawer (tablet/mobile)** is a `dialog` with `aria-modal`, focus trap, Escape to close, focus returned to the trigger; body scroll locked while open.
- **Sort** is a labeled Select (or a radio group in the mobile sheet); the current value is programmatically determinable.
- **Pagination:** `nav` labeled "Pagination", current page `aria-current="page"`; "Load more" moves focus to the first new item and is a real button.
- **Product cards:** each is a link with an accessible name including product name and price; the "Add" control has its own name and is not hover-only.
- **Contrast & color-independence:** ≥ 4.5:1 text / ≥ 3:1 UI in both themes; out-of-stock, discount, and active-filter states pair color with text/shape, never color alone.
- **Focus:** visible instant focus ring everywhere (never animated); logical order across breadcrumb → toolbar → filters → grid → pagination.
- **Reduced motion:** honored throughout (see Motion).

**Reasoning:** filtering is invisible to non-sighted users unless the result change is announced — the `aria-live` count is the single most important a11y decision on the page. The dialog semantics on mobile prevent the classic trap of a filter sheet that keyboard users can't escape.

---

## Responsive Rules

Mobile-first; verified at 320 / 375 / 414 / 768 / 1024 / 1280px. Breakpoints per the design system.

| Concern | `xs`–`sm` (<768) | `md` (768–1023) | `lg`+ (≥1024) |
|---|---|---|---|
| Filters | Full-screen **sheet** (batch + Apply), opened from sticky Filter bar | Left **drawer** (live apply) from toolbar toggle | Persistent left **panel** (live apply) |
| Sort | Bottom-sheet radios | Toolbar Select | Toolbar Select |
| Grid columns | 1–2 | 3 | 4 (one featured 2×) |
| Breadcrumb | "‹ Back to {parent}" | Full trail | Full trail |
| Active-filter chips | Own scrollable row above grid | Wrapping row | Row under toolbar |
| Paging | Load more (full-width button) | Load more + numbered | Load more + numbered |

**Global:** no horizontal page scroll at any width; the active-filter chip row and any wide content scroll within their own containers. Type and section padding interpolate fluidly. Grid collapses 4→3→2→1 via the auto-fill min-width rule (image tracks floored at min-width 0 to prevent blowout). Touch targets ≥ 44px; the mobile Filter/Sort bar and card actions are comfortably tappable. Sticky elements: header (all sizes), desktop filter panel (pins within viewport), mobile Filter/Sort bar.

---

## Motion

Short, scoped, reversible (design-system Motion: animate only `transform`/`opacity`; `--dur-fast`/`--dur-base`; `--ease-out`; one signal per element; reduced-motion honored).

| Interaction | Behavior |
|---|---|
| Filter apply → grid update | Results cross-fade (`opacity`, ≤ `--dur-base`); the grid never janks its layout mid-fetch. Count updates without motion. |
| Active-filter chip add/remove | Chip fades/scales in subtly on add; on remove, it disappears and the grid updates — one signal, no bounce. |
| Filter sheet / drawer | Slides in from the edge (`transform`, `--dur-base`, `--ease-out`); backdrop fades. Reduced motion → instant with a fade only. |
| Sort change | Grid cross-fade, same as filter apply. |
| Load more | Appended cards fade/rise once as a group (not staggered per card); focus jumps to the first new card. |
| Card hover | One signal — elevation `--elevation-1`→`--elevation-2` (or 1px lift), `--dur-fast`. |
| Focus (any control) | Ring appears **instantly** — never transitioned. |
| Skeleton shimmer | Subtle; **static under reduced motion**. |

**Banned:** auto-advancing anything, scroll-triggered fade-up on every card, bounce/overshoot, hover-scale on everything, animated gradients, layout-shifting updates. **Reasoning:** the page updates constantly as the user filters; motion must make those updates *legible* (a gentle cross-fade signals "results changed") without ever making them *slow* or *distracting*. A single cross-fade beats per-card stagger, which would make every refine feel laggy.

---

## Edge Cases

Each has a defined, non-guessy behavior.

| Case | Behavior |
|---|---|
| **Out-of-stock product** | Still shown (discoverability), image slightly de-emphasized, an "Out of stock" badge, "Add" replaced by a disabled state or "Notify me" (if supported). Excluded when "In stock" filter is on. |
| **Missing product image** | Neutral placeholder (brand/category initial or a generic product glyph) — never a gradient block, never a broken-image icon. |
| **Very long product name** | Clamp to 2 lines with ellipsis; full name available via title/tooltip and on the product page. Card height stays uniform. |
| **Variant products / price ranges** | Card shows the effective base price or "From {price}"; sorts and filters use that same value so the eye and the order agree. |
| **Single result** | Render the grid normally with one card (don't auto-redirect to the product — the user may want to refine). |
| **Huge result set (10k+)** | Server-side paginate; cap displayed page count sensibly; virtualization is a Future Improvement. |
| **Filter → zero** | Filter-exclusion empty state (keeps chips, offers one-tap relax + Clear all). |
| **Brand/category with zero products** | Facet option disabled with a count of 0 (or hidden if the backend omits it) — never a selectable dead-end. |
| **Invalid/deep-linked params** | Ignore/clamp bad values, render nearest valid view, rewrite URL to corrected state. |
| **`page` beyond last page** | Clamp to the last valid page. |
| **Rapid consecutive filter clicks** | Debounce/cancel stale requests; last-write-wins; never render an out-of-order response. |
| **Slow network** | Skeleton persists (with min-duration); Retry offered on timeout. |
| **Search with empty/whitespace `q`** | Treat as "All products" browse, not an error. |
| **Currency/locale** | Prices formatted per locale with tabular numerals (the app already formats VND/USD — reuse the shared formatter). |
| **Admin viewing** | Only published/active products appear in the public catalog; drafts/inactive are excluded (admins preview via the admin console, not here). |
| **Back from product** | Restore accumulated pages/scroll to the clicked card. |

---

## Future Improvements

Explicitly out of scope now, mostly because the data or a backend module doesn't exist yet — listed so they aren't accidentally faked in v1.

- **Spec-based facets** (RAM, CPU, screen size, storage) — requires structured specifications; today they're free-text `name/value`. High value for tech shopping; the top future facet.
- **Ratings & reviews** — filter "4★ & up" and sort "Top rated" — blocked on the reviews module (currently planned, not built).
- **Facet counts everywhere** + "zero-result" dimming driven by live counts.
- **Search autocomplete / suggestions / "did you mean"** and typo tolerance.
- **Personalized default sort** for signed-in users (recommendations-driven), consistent with the homepage's personalization.
- **Compare products** (select 2–4 → side-by-side), **Quick view** modal, **Recently viewed** rail, **Save this search** / wishlist from the card.
- **AI shopping assistant hook** — natural-language query ("gaming laptop under $1,200, 16GB RAM") that translates into catalog filters, tying into the planned AI feature.
- **List virtualization** for very large result sets, and **SSR/prerender** of key category/search views for SEO.
- **URL-slug filters** (`/catalog/laptops/acme`) for cleaner, more crawlable links than query params.

---

*End of specification. Build order suggestion: (1) the shared new components — Breadcrumb, FilterPanel + FacetGroup, PriceRangeControl, ActiveFilterChipBar, FilterSheet/Drawer, Pagination/LoadMore — since search and future category pages reuse them; (2) URL-state read/write layer (the backbone of every behavior here); (3) desktop two-region layout wired to real products/categories/brands with the empty/loading/error states; (4) tablet drawer and mobile sheets; (5) the edge-case handling and graceful param degradation.*
