# Pagination

Shared conventions, tokens, and the universal 8-state model live in [`README.md`](./README.md); this file states only Pagination specifics.

# Purpose

Let users move through a result set that's too large for one view — **without** losing the footer, breaking the back button, or disorienting assistive tech. It advances long lists (catalog, search, admin tables) predictably and shareably.

# Responsibilities

- Advance/append results and reflect the current position in the **URL** (deep-linkable, back-safe).
- Communicate progress ("24 of 128") and keep the page footer reachable.
- Emit `pageChange` / `loadMore`; own **no** data fetching (the page fetches; Pagination controls position).

# Anatomy

Two forms sharing a footer position:
- **Load-more:** a "Load more" [`Button`](./button.md) + a **count** ("showing 24 of 128"). Appends the next page.
- **Numbered:** a `nav` of page controls — prev, a windowed set of page numbers (with ellipses), next — + optional count. Replaces the view with the chosen page.

# Variants

| Variant | Use | Why |
|---|---|---|
| `loadMore` | **Default** for storefront grids/rails (catalog, search) and admin lists | Keeps the footer reachable, is accessible, avoids unbounded DOM |
| `numbered` | Accessible/deep-link fallback + admin tables that benefit from jump-to-page | Discrete, shareable page targets; jump to a known page |
| `loadMore+numbered` | Both together (load-more primary, numbers as fallback) | Best of both — append flow + deep links |

**Not offered:** auto-firing infinite scroll — **banned** (it makes the footer unreachable, harms accessibility and control, and isn't deep-linkable). Load-more is the explicit, user-driven equivalent.

# Props / Configuration

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | enum(loadMore, numbered, loadMore+numbered) | loadMore | — |
| `page` | number | 1 | Current page (URL `?page=`) |
| `pageSize` | number | 24 | Divisible by 2/3/4 so last row fills |
| `total` | number | — | Total items (for count + last page) |
| `onPageChange` / `onLoadMore` | event | — | Position callbacks |
| `isLoading` | boolean | false | Disables controls, shows progress |

# Sizes

Compact controls: `loadMore` button `md` (or full-width on mobile); numbered controls ~32–36px targets (≥44px effective on touch). Count text `--text-body-sm` `--color-muted`, numbers tabular.

# States

- **Default** — controls at rest; count reflects current position.
- **Hover** — page-number / button hover (one signal); current page not hoverable-as-target.
- **Focus** — instant ring on the focused control.
- **Active** — the **current page** is marked (`aria-current="page"`), visually distinct from hover/press.
- **Disabled** — prev disabled on page 1, next/load-more disabled on the last page; disabled during `isLoading`.
- **Loading** — `loadMore` button shows a loading state and appends skeleton rows below; numbered controls disable while the page fetches. `aria-busy` on the region.
- **Empty** — n/a (with zero results the page shows its empty state; Pagination isn't rendered).
- **Error** — a failed load surfaces on the list (banner + Retry); the load-more button returns to its idle state so the user can retry.

# Accessibility

`numbered` is a `nav` labelled "Pagination"; the current page uses `aria-current="page"`; prev/next have clear names. **`loadMore` moves focus to the first newly-appended item** after loading (so keyboard/AT users aren't stranded at the button) and announces the new count (`aria-live`). The count is real text, not an image. Footer stays reachable in both variants (the reason auto-infinite-scroll is banned).

# Keyboard Behavior

Controls are tabbable; `Enter`/`Space` activate. `loadMore`: after append, focus jumps to the first new row. `numbered`: prev/next and each page number are individually focusable; no arrow-key roving required (they're links/buttons). `Esc` isn't used here.

# Responsive Rules

`loadMore` button goes full-width on mobile; `numbered` collapses its window (fewer numbers + prev/next, ellipses) on narrow screens to avoid overflow — never wraps to two rows of tiny targets. Count may hide on the smallest widths (keep the button). No horizontal scroll.

# Motion

Appended items fade/rise once **as a group** (not per-item stagger); page swap (numbered) cross-fades the list body. Load-more button shows a steady spinner. Reduced-motion → instant. No layout shift when the button becomes disabled at the last page.

# Design Rules

- **Load-more by default; numbered as the accessible/deep-link fallback.** Never auto-infinite-scroll (footer + a11y + deep-linking).
- Always **reflect position in the URL** (`?page=`) so results are shareable and back/forward works.
- Always show **progress** ("N of M") — users need to know how much remains.
- Page size divisible by common column counts so the final row isn't ragged.
- One Pagination component for storefront and admin; variants configure it.

# Do's

- Do move focus to the first new item after "Load more".
- Do keep the footer reachable.
- Do disable prev/next at the ends and during loading.

# Don'ts

- Don't auto-load on scroll.
- Don't lose the current page on refresh (URL-encode it).
- Don't wrap numbered controls into tiny two-row targets on mobile.
- Don't leave the button spinning with no error path on failure.

# Usage Examples

- **Catalog / Search** results ("Load more" + `?page=`, numbered fallback) — [`../pages/catalog.md`](../pages/catalog.md), [`../pages/search.md`](../pages/search.md).
- **Admin tables** footer ([`Table`](./table.md)) — load-more or numbered per list size ([`../admin/products.md`](../admin/products.md)).
- **Profile → Orders** history load-more ([`../pages/profile.md`](../pages/profile.md)).

# Future Extensions

- **Cursor-based pagination** for very large / real-time sets.
- **Page-size selector** (24 / 48 / 96) on admin tables.
- **"Back to top"** affordance appearing after several load-more expansions.
