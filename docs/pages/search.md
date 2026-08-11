# TechShop Search — Design Specification

**Status:** Implementation-ready · **Version:** 1.0 · **Last updated:** 2026-08-07
**Governed by:** [`design-system.md`](../design-system.md) · **Continues:** [`home.md`](./home.md), [`catalog.md`](./catalog.md), [`product-detail.md`](./product-detail.md), [`cart.md`](./cart.md), [`checkout.md`](./checkout.md)
**Routes:** `/search?q=<query>` (canonical results route) · the **autocomplete** surface lives in the shared header on every page.

**Boundary with the catalog (read this first — it defines the whole spec).** The catalog spec and this spec are two faces of one results engine. **The catalog owns *browse*** (category / all products); **Search owns *query*** (free-text intent). They share the **identical results region** — product grid, facet panel, active-filter chips, sort control, pagination — which is specified once in [`catalog.md`](./catalog.md) and **reused verbatim** here. This document does **not** re-specify that region. It specifies only the **search-specific layer** the catalog doesn't have:

- the **autocomplete** dropdown that appears as the user types in the header,
- the **pre-query search landing** (focused, no query yet: recent / popular / categories),
- **query interpretation** — relevance ranking, term highlighting, "did you mean", corrected-query notices,
- the **zero-results recovery** experience (search's most important state).

Every token and component resolves to the design system; every decision states its reasoning; it is written so an engineer can build it without guessing.

---

## Table of contents

Purpose · Target Users · Primary User Goals · Information Architecture · Desktop Layout · Tablet Layout · Mobile Layout · Visual Hierarchy · Components Used · User Flow · Empty States · Loading States · Error States · Search & Filtering Behavior · Sorting Behavior · Pagination / Infinite Scroll · Accessibility · Responsive Rules · Motion · Edge Cases · Future Improvements

---

## Purpose

Turn a free-text intent into relevant products fast — and, just as importantly, **help the shopper form and repair the query** along the way. Where the catalog assumes the user knows the department, search assumes the user knows only what they *want* and must express it in words that may be partial, misspelled, or ambiguous. So search carries responsibilities the catalog never does:

- **Anticipate** the query (autocomplete) so the user types less and reaches results sooner.
- **Interpret** the query (relevance, spelling correction, "did you mean") so a rough query still lands.
- **Recover** from a query that returns nothing — the single most consequential search state.

The most important element is the **search input and its autocomplete**, because a good suggestion prevents a bad search entirely. The most important *rule* is that **search never dead-ends**: every state — no query, wrong query, zero results — offers an obvious next action.

---

## Target Users

| User | Behavior | What they need most |
|---|---|---|
| **Known-item searcher** | Types a specific product/model | Fast, exact matches at the top; autocomplete straight to the product |
| **Category-word searcher** | Types a category ("laptops") | Recognize it's a category → suggest the category + show products |
| **Vague/exploratory searcher** | Types loose terms ("cheap gaming") | Reasonable relevance + facets to refine; suggestions to sharpen the query |
| **Misspeller** | Typos, diacritic omissions ("labtop", "dien thoai") | Spelling tolerance, "did you mean", accent-insensitive matching |
| **Refiner** | Searches, then filters/sorts results | The reused catalog facets + relevance/price sort |
| **Repeat searcher** | Re-runs prior searches | Recent searches surfaced on focus |

**Reasoning for the Vietnamese-diacritics emphasis:** the profile page already normalizes Vietnamese diacritics for its location search; search **reuses that normalization** so "điện thoại" and "dien thoai" match. This is a real, high-frequency need for the store's audience, not a nice-to-have.

---

## Primary User Goals

1. **Find a specific product fast** — ideally from autocomplete, without a full results page.
2. **Get relevant results for a rough query** — good ranking, spelling tolerance, "did you mean".
3. **Understand what was searched** — the query is echoed; any correction is transparent.
4. **Refine results** — the reused catalog facets + sort (relevance-first).
5. **Recover from zero results** — never a dead end; always a next step.
6. **Re-run past searches** — recent searches on focus.

Goal 1 drives the autocomplete investment (many searches should end before a results page loads). Goal 5 drives the zero-results design, which gets more attention here than anywhere else in the app.

---

## Information Architecture

**Query state is URL-encoded** on the results route (like the catalog): `q` plus any applied facets/sort/page reuse the catalog's exact param model (`brand`, `minPrice/maxPrice`, `inStock`, `sort`, `page`). This makes a search result shareable, deep-linkable, and Back/Forward-correct.

| State | Where it lives | Why |
|---|---|---|
| Query | `?q=` on `/search` | Shareable, restorable, analytics-friendly |
| Facets / sort / page | URL params (catalog's model) | Reused results engine → reused state model |
| Autocomplete open/highlighted item | Ephemeral component state | Transient UI, not a shareable view |
| Recent searches | Local, per-browser | Convenience; private to the device; clearable |
| Corrected/"did you mean" query | Derived from the response | Presentation of what the backend interpreted |

**Three surfaces, one feature:**

```
1. Autocomplete  (in the shared header, every page)
   focus → recent/popular ;  typing → suggestions · product hits · category/brand hits
        └─ Enter / pick → navigates to /search?q=…  (or straight to a product if a product hit is chosen)

2. Search landing  (/search with no q, or the mobile full-screen search)
   recent searches · popular/trending · top categories · (signed-in) recently viewed

3. Search results  (/search?q=…)
   ├─ Search header:  "Results for 'q'" · count · corrected-query / did-you-mean
   └─ Reused catalog results region:  facets · sort(relevance-first) · grid · pagination
```

**Result scope:** results are products by default. Autocomplete additionally surfaces **category and brand** hits (so a category-word query offers the category directly). An optional **scope tabs** control (All · Products · Categories · Brands) is a *Future Improvement*, not v1 — v1 keeps it simple: product results + suggested categories/brands inline.

**Match fields** (backend-dependent): product name (primary), SKU, brand, category, and short description as available — accent- and case-insensitive.

---

## Desktop Layout

**≥ 1024px (`lg`+).** Two contexts: the **autocomplete overlay** (anchored to the header search) and the **results page** (reusing the catalog's two-region layout).

**Autocomplete overlay** (opens under the header search on focus/typing):

```
┌ Header ───────────────────────────────────────────────────────────────────┐
│  TechShop   [ laptop|                                   ]🔍   cart  account │
│            ┌──────────────────────────────────────────────┐                │
│            │ Suggestions                                   │                │
│            │  🔍 laptop                                    │  ← query suggest│
│            │  🔍 laptop stand                              │                │
│            │ Products                                      │                │
│            │  ┌─┐ AeroBook Pro 14        $1,249            │  ← product hit  │
│            │  ┌─┐ AeroBook Air 13        $999              │                │
│            │ Categories                                    │                │
│            │  ▸ Laptops (in Computers)                     │  ← category hit │
│            │  ─────────────────────────────────────────   │                │
│            │  See all results for "laptop"  →              │  ← submit row   │
│            └──────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────┘
```

- The dropdown is `--color-surface-raised`, `--radius-md`, `--elevation-2`, at `--z-dropdown`, width ≥ the search field. Grouped: **Suggestions**, **Products** (thumbnail + name + price, tabular), **Categories/Brands**, and a persistent **"See all results for 'q' →"** row that runs the full search.
- On focus with an empty field, the same dropdown shows **Recent searches** (removable) and **Popular searches**.

**Results page** (`/search?q=…`) reuses the catalog two-region layout exactly:

```
│  Search                                                                     │
│  Results for "laptop"  ·  128 results          Did you mean: laptops?       │
│  [ Acme ✕ | $200–$800 ✕ | Clear all ]              Sort: [ Relevance ▾ ]   │
│ ┌────────────────┐  ┌──────────────────────────────────────────────────┐   │
│ │ FILTERS        │  │  ProductCard grid (match terms highlighted)        │   │
│ │ (catalog facet │  │  … reused catalog results region …                 │   │
│ │  panel reused) │  │             [ Load more ] · showing 24 of 128      │   │
│ └────────────────┘  └──────────────────────────────────────────────────┘   │
```

- Everything below the **search header** (facets, grid, chips, sort, pagination) is the catalog's results region — not re-specified here. The search header adds: the query echo, the count, and the corrected/"did you mean" line.

---

## Tablet Layout

**768–1023px (`md`).**

- **Autocomplete** anchors under the header search as on desktop; the dropdown spans a comfortable width.
- **Results** reuse the catalog's `md` behavior: filters behind a **drawer** toggle, grid 3-up, sort in the toolbar. The search header (query, count, did-you-mean) sits above.
- **Reasoning:** the search-specific chrome is small; the heavy lifting is the reused catalog layout, so tablet inherits its proven behavior.

---

## Mobile Layout

**< 768px (`xs`–`sm`).** Search becomes a **full-screen overlay** — the highest-impact mobile search pattern.

- Tapping the header search icon opens a **full-screen search view**: a large input with the keyboard focused, a Cancel affordance, and beneath it the **landing content** (recent searches, popular searches, top categories) that swaps to **live autocomplete** (suggestions / product hits / category hits) as the user types. Selecting a product hit goes to the PDP; "See all results" or submitting goes to the results page.
- **Results** reuse the catalog's mobile layout: single/two-column grid, filter **full-screen sheet** (batch + Apply), sort **bottom sheet**. The search header (query echo + count + did-you-mean) sits at the top; a compact "edit query" affordance reopens the full-screen search.
- **Reasoning:** on a phone, a cramped inline dropdown under a tiny field is unusable; a full-screen search gives the keyboard room, makes suggestions tappable at 44px targets, and matches the platform pattern users expect.

---

## Visual Hierarchy

**In the autocomplete dropdown** (priority order):
1. **Product hits** — thumbnail + name + **price** (tabular). A direct product hit is the fastest possible success, so products lead once typing produces them.
2. **Query suggestions** — help complete/broaden the query.
3. **Category/brand hits** — route a category-word searcher to the right browse.
4. **"See all results" row** — always present, always last, so submitting is a known constant.
5. (empty field) **Recent** above **Popular**.

**On the results page:**
1. **The results grid** — the answer; most space and weight (reused ProductCard, with match-term highlighting).
2. **Query echo + result count** — "Results for 'q' · N results"; count is an `aria-live` region.
3. **Corrected-query / "did you mean"** — elevated when present (a query that returned little must show its lifeline prominently); uses accent/link styling, one line, directly under the count.
4. **Sort (relevance-first) + active-filter chips** — quiet toolbar.
5. **Facet panel** — structural, low-chroma (as in the catalog).

**Applied rules:** match highlighting uses **weight/`--weight-semibold`**, not a background color, so it doesn't fight the palette or fail contrast; one primary emphasis (the results); color earned; prices tabular; no gradients. **Reasoning:** in autocomplete, a product-with-price beats a text suggestion for a shopper, so products rank above suggestions once they exist; on the results page, the "did you mean" line is promoted precisely when results are thin, because that's when the user most needs the escape hatch.

---

## Components Used

Search-specific components are **new**; the results region is **reused** from the catalog. New components are added to the shared library first.

| Area | Components |
|---|---|
| Entry | Header SearchInput (shared) + **SearchAutocomplete** *(new: grouped suggestions/products/categories, keyboard combobox)* |
| Landing | **SearchLanding** *(new: RecentSearches · PopularSearches · top categories · (signed-in) recently viewed)* |
| Results header | **SearchResultsHeader** *(new: query echo · count · **DidYouMean** · **CorrectedQueryNotice**)* |
| Results region | **Reused from catalog:** ProductCard grid · FilterPanel/FacetGroup · ActiveFilterChipBar · Sort Select · Pagination/LoadMore · Skeleton · Empty · Alert |
| Result emphasis | **ResultHighlight** *(new: bolds matched terms in names)* |
| Mobile | **FullScreenSearch** *(new: overlay input + landing/autocomplete)* |
| Recovery | **ZeroResults** *(new: recovery guidance + popular/related products)* |

**Reasoning:** reusing the catalog's entire results region is the core architectural decision — it guarantees browse and search results look and behave identically (a consistency win and far less code). The new components are strictly the query layer the catalog lacks. RecentSearches is local-only and clearable (privacy).

---

## User Flow

**Primary paths:**

```
Any page → focus header search
  ├─ (empty) → Recent + Popular  → pick one → /search?q=…
  └─ type → autocomplete (debounced)
       ├─ pick a PRODUCT hit      → Product Detail (fastest success — no results page)
       ├─ pick a CATEGORY hit     → Catalog (that category)
       ├─ pick a SUGGESTION       → /search?q=<suggestion>
       └─ submit / "See all"      → /search?q=<typed query>

/search?q=…  → Results
   ├─ results found → refine (facets/sort — reused catalog) → click product → PDP
   ├─ corrected     → "Showing results for 'laptops'"  (with revert to original)
   ├─ did-you-mean  → suggestion link → re-run corrected query
   └─ zero results  → ZeroResults recovery (spelling · remove filters · broaden · popular products · categories)
```

**Detailed steps & reasoning:**
1. **Focus.** Empty field shows recent (local) + popular searches — a zero-typing path back to a prior intent.
2. **Type.** Autocomplete debounces (~200–300ms) and cancels stale requests; results are grouped (suggestions/products/categories). A product hit is a **direct route to the PDP** — the ideal outcome, skipping the results page entirely.
3. **Submit.** Enter, the "See all results" row, or the search button navigate to `/search?q=`; the query is recorded to recent searches.
4. **Results.** Default sort = **relevance**. If the backend corrected spelling, a **CorrectedQueryNotice** states it and offers to search the original instead ("Search instead for 'labtop'"). If it has a stronger interpretation, **DidYouMean** offers it.
5. **Refine.** The reused catalog facets/sort/pagination operate exactly as in the catalog; applying them keeps `q`.
6. **Zero results.** The ZeroResults component takes over the results region (see Empty States) — never a blank grid.
7. **Category-word query.** If the query matches a category name, autocomplete offers the category directly, and the results page surfaces a "Browse the {category} category" affordance — routing a browse-intent user to the better tool.

---

## Empty States

Search has **three distinct "empty" situations** — conflating them is a real failure. (The catalog's own no-results states are reused; search adds query-specific recovery.)

| Situation | Title | Guidance | Actions |
|---|---|---|---|
| **Pre-query landing** (no `q`) | "Search TechShop" | "Find laptops, phones, accessories and more." | Recent searches (removable) · Popular searches · Top categories |
| **Query returned nothing** (`q`, 0 results, no filters) | "No results for '{q}'" | "Check the spelling, try fewer or more general words." | **Did you mean {suggestion}?** · Popular products rail · Browse categories |
| **Query + filters returned nothing** (results existed, filters → 0) | "No results with these filters" | "Try removing a filter — price is the most common culprit." | Keep active-filter chips (individually removable) · "Clear all filters" (keeps `q`) |

**Reasoning:** the pre-query landing turns an idle search box into a discovery surface (recent/popular/categories). The true zero-results case leads with a *did-you-mean* and *popular products* so the user still sees merchandise, not a void. The filtered-to-zero case is distinct — the fix is a filter, not the query — so it keeps the chips visible and clears filters without discarding the search (mirroring the catalog's rule exactly). **Search must never present a blank screen as an answer.**

---

## Loading States

Skeletons over spinners; search adds an autocomplete-specific pattern.

- **Autocomplete:** as the user types, show a lightweight loading affordance in the dropdown (a slim progress line or muted "Searching…"), **keeping the previous suggestions visible until new ones arrive** so the list doesn't flicker empty between keystrokes. Debounced; stale responses discarded.
- **Results first load:** reuse the catalog's results-region skeletons (facet skeleton + product-card grid skeleton); the search header shows the query echo immediately and "Loading results…" until the count arrives.
- **Refinement (facet/sort/page):** reuse the catalog's behavior — skeleton only in the results region; facets stay interactive.
- **Timing:** autocomplete debounce ~200–300ms; skeletons delay-show ~150ms and hold ~300ms min; loading regions `aria-busy`; the result count announces via `aria-live` when it resolves.

**Reasoning:** the autocomplete-specific rule — *don't blank the list between keystrokes* — matters because a flickering dropdown is worse than a slightly stale one; keeping prior suggestions visible while the next set loads feels instant.

---

## Error States

- **Autocomplete request fails:** fail **silently** — hide the dropdown or keep the last good suggestions; never show an error under a search field the user is actively typing in. The user can still submit the query.
- **Results fetch fails:** reuse the catalog's results error — an inline Alert (`role="alert"`) with **Retry** carrying the current query/filters; the search header stays.
- **Facets fail but results succeed (or vice versa):** partial degradation (catalog rule) — browse results even if refinement is temporarily down.
- **Invalid/empty query submitted:** an empty or whitespace-only `q` is treated as the **landing state**, not an error (see Edge Cases).
- **Malformed URL params:** ignore/clamp bad facet/sort/page values (catalog rule); render the nearest valid view; rewrite the URL.

**Reasoning:** the deliberate choice is that **autocomplete errors are invisible** — an error toast while someone types is hostile and useless (they'll submit anyway). Results errors reuse the catalog's recoverable pattern.

---

## Search & Filtering Behavior

This is search's core, so it's spec'd in full here (whereas the catalog spec'd browsing).

**Query submission**
- Triggers: pressing Enter, clicking the search button, choosing the "See all results" row, or selecting a query suggestion. Selecting a **product** hit bypasses results and goes to the PDP; a **category** hit goes to the catalog.
- Minimum query length for autocomplete: ~2 characters (1-char queries are too broad to suggest usefully); submitting a 1-char query is allowed but may just show broad results.

**Matching & interpretation**
- **Fields:** product name (weighted highest), then SKU / brand / category / short description as the backend supports.
- **Accent- & case-insensitive:** reuse the profile page's Vietnamese diacritic normalization so "dien thoai" matches "điện thoại".
- **Relevance ranking:** exact/prefix name matches rank above partial/description matches; ranking is the backend's job, but the default sort **is relevance** and the UI must not override it silently.
- **Spelling correction / "did you mean":** when the backend offers a correction, show a **CorrectedQueryNotice** ("Showing results for 'laptops' — search instead for 'labtop'") or a **DidYouMean** link; both let the user pin the original. (Basic; fuzzy/synonyms are Future Improvements.)
- **Term highlighting:** matched terms in result names are emphasized with weight (not a highlight background), so scanning shows *why* an item matched.

**Filtering within results**
- The reused catalog facets apply on top of the query: **Category, Brand, Price, Availability**. Same logic as the catalog — **OR within a facet, AND across facets** — and applied filters keep `q`. Active filters show as removable chips; "Clear all" clears filters but **not** the query (clearing a search and clearing filters are different intents).
- **Search-within-a-category:** if the user arrived via a category or applies a category facet, the query is scoped to it. (Cross-navigation between search and category browse is seamless because they share the results engine.)

**Reasoning:** stating field weighting, diacritic handling, and the OR/AND filter logic explicitly removes the biggest sources of "why did I get these results?" confusion. Highlighting via weight (not color) keeps it accessible and on-palette.

---

## Sorting Behavior

- **Options:** **Relevance (default)**, Most popular, Newest, Price low→high, Price high→low, Name A–Z. Same control as the catalog (a labeled Select; a bottom sheet on mobile).
- **Relevance is search-only and the default** — it's meaningless when browsing a category, which is exactly why the catalog defaults to popularity and search defaults to relevance. Switching away from relevance is allowed but the user can always return to it.
- **Behavior:** changing sort resets to `page=1`, preserves `q` + filters, updates the URL, and re-fetches with a **stable secondary sort** so pagination can't duplicate/skip (catalog rule).

**Reasoning:** relevance as the default is the one sorting decision unique to search; everything else reuses the catalog's sort so behavior is identical across the two faces of the results engine.

---

## Pagination / Infinite Scroll

- **Results:** reuse the catalog's decision exactly — **"Load more" button + `?page=` in the URL**, with numbered pagination as the accessible/deep-link fallback. **No auto-firing infinite scroll** (footer reachability, accessibility, control, deep-linking — same rationale as the catalog). Page size 24.
- **Autocomplete:** **not paginated** — suggestions are capped (e.g., ~5 products, ~5 suggestions, ~3 categories) with the "See all results" row as the path to the full, paginated set. A dropdown is a shortlist, not a browsable list.

**Reasoning:** autocomplete deliberately caps and defers to "See all" because an infinite suggestion list defeats the purpose (a quick shortlist); the full results page is where pagination belongs, and it's already solved by the reused catalog engine.

---

## Accessibility

Baseline WCAG 2.1 AA. The **autocomplete combobox** is the most demanding pattern on the site and is spec'd to the WAI-ARIA combobox pattern.

- **Autocomplete (combobox):** the input has `role="combobox"`, `aria-expanded`, `aria-controls` → the listbox, and `aria-activedescendant` tracking the highlighted option; the popup is a `listbox` with `option`s (grouped with accessible group labels). Full keyboard support: ↓/↑ move through options, Enter selects, Escape closes and returns focus to the input, Tab behaves predictably. Product options announce name + price; the "See all results" row is a real option/button.
- **Result count** is an `aria-live="polite"` region so submitting/refining announces "128 results".
- **Term highlighting** uses weight (or `<mark>` with a non-color cue) and must not break screen-reader reading order or rely on color alone.
- **Did-you-mean / corrected notice** are real links/buttons with clear names ("Search instead for 'labtop'").
- **Recent searches** are a list where each item is selectable and each remove control is a named button ("Remove recent search: laptop"), keyboard-operable.
- **Mobile full-screen search** is a proper dialog/overlay: focus moves into the input on open, focus is trapped, Escape/Cancel closes and returns focus to the trigger.
- **Zero-results recovery** actions are reachable and clearly labeled; the guidance is real text, not an image.
- **Contrast & focus:** ≥ 4.5:1 text / ≥ 3:1 UI both themes; visible instant focus rings on the input, every option, chips, and recovery actions.
- **Reduced motion:** the dropdown and full-screen search appear without spatial animation under `prefers-reduced-motion`.

**Reasoning:** search's accessibility stands or falls on the combobox — a keyboard/screen-reader user must be able to type, arrow through suggestions, and select without a mouse. Getting `aria-activedescendant` + listbox semantics right is the single most important a11y task on this page; announcing the result count is the second.

---

## Responsive Rules

Mobile-first; verified at 320 / 375 / 414 / 768 / 1024 / 1280px. Breakpoints per the design system.

| Concern | `xs`–`sm` (<768) | `md` (768–1023) | `lg`+ (≥1024) |
|---|---|---|---|
| Search entry | **Full-screen search overlay** (tap icon) | Inline field + dropdown | Inline field + dropdown |
| Autocomplete | Full-screen list (large tap targets) | Anchored dropdown | Anchored dropdown |
| Results region | Reuse catalog mobile (grid 1–2, filter sheet, sort sheet) | Reuse catalog `md` (drawer, 3-up) | Reuse catalog `lg` (sidebar, 4-up) |
| Search header (echo/count/did-you-mean) | Stacked, compact; "edit query" reopens overlay | Above results | Above results |

**Global:** no horizontal page scroll; autocomplete/dropdown never causes body overflow; touch targets ≥ 44px (options, remove buttons, Cancel); type/padding fluid. The results responsiveness is entirely inherited from the catalog — search only owns the entry/overlay responsiveness.

---

## Motion

Short, scoped, reversible (design-system Motion; animate `transform`/`opacity`; one signal; reduced-motion honored).

| Interaction | Behavior |
|---|---|
| Autocomplete open/close | Quick fade (+ slight `transform`) at `--dur-fast`; reduced motion → instant. |
| Suggestion list update | Content cross-fades/updates in place; **no flicker to empty** between keystrokes (keep prior list until new arrives). |
| Highlighted option | Instant background/weight change on arrow/hover — no transition that lags the keyboard. |
| Mobile full-screen search | Slides up / fades in (`transform`); Cancel reverses; reduced motion → instant. |
| Results update (query/facet/sort) | Reuse the catalog's results cross-fade. |
| Did-you-mean / count appearing | Gentle fade; count change is announced (not just animated). |
| Focus (any control) | Ring appears **instantly** — never transitioned. |

**Banned:** typeahead characters animating, bounce/overshoot, per-option stagger in the dropdown (it must feel instant), animated highlight sweeps, layout-shifting dropdowns. **Reasoning:** autocomplete lives or dies on *perceived instantness* — any motion that delays a keystroke's result or lags the keyboard-highlighted option is actively harmful, so motion here is minimal and the anti-flicker rule takes priority over any transition.

---

## Edge Cases

Each has a defined behavior.

| Case | Behavior |
|---|---|
| **Empty / whitespace query** | Treated as the **landing state** (recent/popular/categories), not an error or empty results. |
| **1-character query** | Autocomplete withholds suggestions (too broad); submitting shows broad results (or a "keep typing" hint). |
| **Very long query** | Accepted; truncated for display in the echo with the full query in `title`/URL. |
| **Special characters / potential injection** | Query is treated as inert text — escaped on display, encoded in the URL; never interpreted. |
| **No results** | ZeroResults recovery (spelling · did-you-mean · popular products · categories) — never blank. |
| **Filters → zero (results existed)** | Distinct "no results with these filters" state; keep chips; clear-filters keeps `q`. |
| **Single result** | Show the results grid with one card — **do not auto-redirect** to the product (the user may want to refine or see alternatives). |
| **Query is a category/brand name** | Autocomplete offers the category/brand directly; results page surfaces a "Browse {category}" affordance. |
| **Vietnamese diacritics / accent-omitted** | Accent-insensitive matching (reused normalization). |
| **Trailing/leading spaces, mixed case** | Trimmed and normalized before matching; echo shows the cleaned query. |
| **Rapid typing / stale responses** | Debounce + cancel/ignore superseded autocomplete responses (last-write-wins). |
| **Deep-linked / shared `/search?q=`** | Renders results directly; the input reflects `q`. |
| **Back/forward through searches** | URL-encoded `q`+filters make history navigation restore each prior search correctly. |
| **Recent searches privacy** | Stored locally per browser, never synced without consent; a "Clear recent searches" control is provided. |
| **Autocomplete offline / slow** | Silent failure; the user can still submit; results page handles the actual fetch/error. |
| **Query matches a product exactly** | That product ranks first and appears as the top autocomplete product hit (fast path to PDP). |

---

## Future Improvements

Out of scope for v1 — mostly backend- or module-dependent, listed so they aren't faked.

- **Fuzzy matching / typo tolerance** and **synonyms** (beyond basic did-you-mean) — needs backend search capability.
- **AI natural-language search** ("gaming laptop under $1,200 with 16GB RAM") that parses intent into query + filters, and a **zero-results → AI assistant** handoff — ties directly into the planned AI assistant module.
- **Personalized results/ranking** for signed-in users, and **personalized recent/recommended** on the landing.
- **Trending/popular searches from real analytics** (v1's "popular" must use a real source, not invented terms — until then, curate a small real list or omit).
- **Scope tabs** (All · Products · Categories · Brands) and richer entity results.
- **Autocomplete product previews / instant results** (results updating live under the dropdown).
- **Voice search** and **visual/image search**.
- **Saved searches / search alerts** for signed-in users.
- **Search result "why it matched"** explanations, and merchandised/promoted results.
- **Search-within-results** as an explicit sub-query, and query refinements as suggested chips.

---

*End of specification. Build order suggestion: (1) reuse the catalog results engine on `/search?q=` and add the thin SearchResultsHeader (echo · count · DidYouMean · CorrectedQueryNotice) — this ships a working search results page fast; (2) build SearchAutocomplete as a WAI-ARIA combobox in the shared header (grouped suggestions/products/categories, debounced, keyboard-complete), with local RecentSearches; (3) the ZeroResults recovery component (the highest-value search-specific UI); (4) the mobile FullScreenSearch overlay; (5) result-term highlighting and the corrected/did-you-mean wiring; (6) reuse the profile diacritic normalization and finalize the edge-case + accessibility matrix. Keep relevance as the search default sort; keep autocomplete errors silent.*
