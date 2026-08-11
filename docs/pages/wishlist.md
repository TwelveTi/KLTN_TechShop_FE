# TechShop Wishlist — Design Specification

**Status:** Implementation-ready (forward-looking) · **Version:** 1.0 · **Last updated:** 2026-08-07
**Governed by:** [`design-system.md`](../design-system.md) · **Reuses** the ProductCard and patterns from [`catalog.md`](./catalog.md), [`product-detail.md`](./product-detail.md), and [`cart.md`](./cart.md).
**Route:** `/wishlist` (also surfaced as a tab within [`profile.md`](./profile.md)).

**Module-status note.** Wishlist is a **planned backend module** (the feature folder exists but is empty). This spec is written so the page is ready to build the moment the backend lands; where it depends on unbuilt endpoints it says so. The **save/heart affordance** that adds items lives on the ProductCard and the PDP (their specs); **this document specifies the collection view** — where saved items live, are managed, and move to the cart. Every token/component resolves to the design system; every decision states its reasoning.

---

## Table of contents

Purpose · Target Users · Primary User Goals · Information Architecture · Desktop Layout · Tablet Layout · Mobile Layout · Visual Hierarchy · Components Used · User Flow · Empty States · Loading States · Error States · Search & Filtering Behavior · Sorting Behavior · Pagination / Infinite Scroll · Accessibility · Responsive Rules · Motion · Edge Cases · Future Improvements

---

## Purpose

Let a shopper **save products for later without committing to buy**, then return to that collection to decide, compare, or move items into the cart. The wishlist is the "not now, but yes eventually" bucket — it reduces the pressure to buy immediately (supporting the browse-first ethos) and gives returning users a fast path back to the products they cared about.

Its two jobs: **be a reliable, persistent home** for saved items (across sessions/devices when signed in), and **make converting a saved item into a purchase effortless** (move to cart in one action). It also honestly surfaces when a saved item has **changed** — price moved, stock dropped, or it's gone — because a wishlist people trust is one that tells them what changed while they were away.

---

## Target Users

| User | Situation | Needs most |
|---|---|---|
| **Deliberate buyer** | Saving options to decide later | A clear collection; easy move-to-cart |
| **Comparison shopper** | Shortlisting across visits | Persistent list; see price/availability at a glance |
| **Deal waiter** | Waiting for a price drop | Price-change flags on saved items |
| **Gift/researcher** | Building a list over time | Reliable persistence; add/remove without friction |
| **Signed-out saver** | Saving before signing in | Either a guest wishlist that merges on sign-in, or a clear prompt to sign in to save |

**Auth stance (reasoning):** a wishlist is inherently *personal and persistent*, so it's a **signed-in feature**. Recommended: allow a **guest wishlist stored locally** that **merges on sign-in** (mirroring the cart), so saving never requires an account up front (browse-first). If the backend can't support the merge in v1, fall back to **signed-in-only** with a graceful "sign in to save" prompt on the save affordance. The collection page handles both: signed-in shows the server list; signed-out shows either the local guest list or the sign-in prompt, per the chosen mode.

---

## Primary User Goals

1. **See everything I've saved** — a scannable grid of saved products.
2. **Know what changed** — price drops/rises, low/out-of-stock, or removed items flagged.
3. **Move an item to the cart** — one action, per item.
4. **Remove items** — easily and reversibly.
5. **Get back to a product** — each card links to its PDP.
6. **Trust it persists** — my list is here next time (across devices when signed in).

Goals 2 and 3 are what make a wishlist more than a bookmark list — change-awareness and one-tap purchase.

---

## Information Architecture

```
Customer shell (shared header + footer)
└─ Wishlist
   ├─ Header        ("Your wishlist" · N items · optional Clear/Share*)
   ├─ Toolbar       (sort · optional filter: availability)      — only when the list is non-trivial
   └─ Saved-items grid
        └─ WishlistCard  (ProductCard + wishlist actions + change flags)
```

- **The heart/save toggle** (add/remove) lives on ProductCard and PDP; this page is the **collection view** of the resulting set.
- **State:** signed-in → server wishlist (source of truth); guest → local, merged on sign-in. Sort/filter of the *view* may reflect in the URL for a shareable/restorable view (like the catalog), but the *contents* are a possession, not a query.
- **Wishlist item data:** the product (image, name → PDP, brand, current price, availability) plus wishlist metadata (date added) and derived **change flags** (price changed since save, low/out of stock, removed from catalog).

---

## Desktop Layout

**≥ 1024px (`lg`+).** A single centered content column within `--layout-max` — a **product grid**, because a wishlist is a set of products, not a two-region browse/refine tool.

```
┌───────────────────────────── Header (sticky) ─────────────────────────────┐
├────────────────────────────────────────────────────────────────────────────┤
│  Your wishlist · 6 items                          Sort: [ Recently added ▾ ]│
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                                       │
│  │ card │ │ card │ │ card │ │ card │    (4-up grid, reused ProductCard)     │
│  │ ♥ ✕  │ │ ♥ ✕  │ │ ♥ ✕  │ │ ♥ ✕  │                                       │
│  │Add to│ │Add to│ │ Price │ │ Out  │    ← per-card: Move to cart · Remove   │
│  │ cart │ │ cart │ │ ↓ flag│ │ stock│                                       │
│  └──────┘ └──────┘ └──────┘ └──────┘                                       │
│  ┌──────┐ ┌──────┐                                                          │
│  │ card │ │ card │                          [ Load more ] (if long)         │
│  └──────┘ └──────┘                                                          │
├────────────────────────────────── Footer ──────────────────────────────────┤
```

- Grid uses the design-system product-grid rule (4-up at lg/xl, `--space-6` gap). Each **WishlistCard** = the reused ProductCard plus wishlist actions: a **Remove** control (the filled heart / an ✕) and a **Move to cart** button; **change flags** (price ↓/↑, low stock, out of stock, unavailable) render on the card.
- A light **toolbar** (sort, optional availability filter) appears **only when the list is large enough to warrant it**; a 3-item wishlist shows no toolbar (avoid controls for a list you can see at a glance).
- Prices use tabular numerals; a price-drop flag shows the old vs new price.

---

## Tablet Layout

**768–1023px (`md`).** Grid 3-up; the toolbar (if shown) sits above. Per-card actions (Move to cart, Remove) stay visible (not hover-only — touch). **Reasoning:** the wishlist is a simple grid; it just reflows column count.

## Mobile Layout

**< 768px (`xs`–`sm`).** Grid 2-up (or 1-up at the smallest widths). Per-card actions are always-visible tap targets (≥44px) — **never hover-revealed**. Sort (if present) is a bottom-sheet. Change flags remain legible on the compact card. **Reasoning:** on touch there is no hover, so Move-to-cart and Remove must be visible controls, not hover affordances.

---

## Visual Hierarchy

1. **The saved products (grid)** — the collection is the page; images + names lead, **prices tabular**.
2. **Change flags** — when present, elevated with semantic color + icon + text (a price drop is a reason to act; an out-of-stock is a reason to know). These earn prominence because change-awareness is the wishlist's differentiator.
3. **Per-card actions** — **Move to cart** is the primary per-card action (`--color-primary`); **Remove** is quiet/secondary (reversible).
4. **Header (count) + toolbar** — orient and, when needed, sort/filter; low emphasis.

**Applied rules:** one primary action per card (Move to cart); Remove is quiet because it's reversible; flags pair color with icon + text; prices tabular; no gradients. **Reasoning:** a wishlist should feel like *your shelf of maybes* — the products dominate, changes are surfaced clearly, and converting one to a purchase is the obvious next step.

---

## Components Used

| Area | Components |
|---|---|
| Shell | Header · Footer (shared) |
| Header | Section-head (title + count) · Button (Clear all* / Share*) |
| Toolbar | Sort Select · optional availability filter Chip · (shown only when the list is large) |
| Items | **WishlistCard** *(new: reused ProductCard + Move-to-cart Button + Remove + change flags)* · **ItemChangeNotice** *(reused from cart: price/stock/unavailable)* |
| Toggle | **SaveToggle** *(the heart on ProductCard/PDP — defined there, referenced here)* |
| States | Empty state · Skeleton · Alert (error) · Undo Toast (for remove) |
| Signed-out | **SignInToSavePrompt** *(new, when in signed-in-only mode)* |

**Reasoning:** the WishlistCard is the reused ProductCard with wishlist actions bolted on — same product presentation everywhere. The change-flag component is shared with the cart (a saved item and a cart item have the same "things changed while you were away" problem). Remove reuses the design-system Undo pattern.

---

## User Flow

```
Add: ProductCard/PDP heart → item saved (optimistic; heart fills)
      signed-in → server ; guest → local (+ merge on later sign-in)
      signed-out (if signed-in-only mode) → "sign in to save" prompt

/wishlist
  ├─ View saved grid (with change flags)
  ├─ Move to cart (per item) → optimistic add; cart badge bumps; item stays or is offered removal from wishlist*
  ├─ Remove (per item) → optimistic + Undo toast
  ├─ Card → PDP
  └─ (large list) sort / filter by availability
Empty → discovery prompt (browse / popular)
```

**Detailed reasoning:**
- **Save is optimistic** (the heart fills instantly, persists in the background) — saving must feel instant or people stop doing it.
- **Move to cart** adds to the cart optimistically (cart badge bumps, no celebratory toast — design-system rule) and, by a configurable choice, either **keeps** the item in the wishlist or offers to remove it (default: keep, so the user's shortlist isn't silently emptied; an inline "Remove from wishlist?" is offered).
- **Remove uses optimistic + Undo**, not a confirm dialog — it's reversible.
- **Guest → sign-in merge** combines the local wishlist with the server one (dedupe by product), mirroring the cart.

---

## Empty States

The empty wishlist is a **frequent, first-run state**, so it's a designed destination (design-system anatomy).

| Situation | Title | Guidance | Action |
|---|---|---|---|
| **Never saved anything** | "Your wishlist is empty" | "Tap the heart on any product to save it here for later." | "Browse products" (+ signed-in: recommended rail) |
| **Removed the last item** | "Your wishlist is empty" | Same; plus "Removed by mistake? Undo" within the window | "Browse products" |
| **Signed-out (signed-in-only mode)** | "Sign in to see your wishlist" | "Save products to your account and find them on any device." | "Sign in" / "Register" |
| **All saved items unavailable** | "Your saved items are no longer available" | "The products you saved have been removed or are out of stock." | Show what changed + "Browse the catalog" |

**Reasoning:** an empty wishlist is an opportunity to teach the *how* ("tap the heart") and to re-engage (recommended rail for signed-in users). The signed-out state sells the *why* (cross-device persistence) rather than just blocking.

---

## Loading States

- **First load:** product-card skeletons matching the grid (image block + name/price lines + action row).
- **Save toggle (elsewhere):** the heart fills optimistically; a failed save reverts it with a quiet notice.
- **Move to cart:** the card's button shows a brief loading→added state; the cart badge bumps.
- **Remove:** optimistic (card animates out) + Undo; failure re-inserts.
- Timing per design system; loading regions `aria-busy`; the item-count updates announce via `aria-live`.

---

## Error States

- **Wishlist fetch fails:** inline Alert (`role="alert"`) + Retry; the shell stays.
- **Save/remove/move persist fails:** revert the optimistic change; a specific inline notice ("Couldn't update your wishlist — try again"); other items unaffected.
- **Change conflicts (item unavailable / price changed):** **not errors — flagged notices** on the card (reused from cart), so the user re-decides; unavailable items are grouped/dimmed and can't be moved to cart until resolved.
- **Guest-merge conflict at sign-in:** dedupe by product; keep the union; notify if anything couldn't be merged.

**Reasoning:** like the cart, the wishlist treats stale data as an explained, first-class state, not a surprise — trust depends on it telling you what changed.

---

## Search & Filtering Behavior

- **Not a search surface** — a wishlist is a small, personal set, so there's no query/faceting like the catalog. The **global header search** remains (it searches the catalog).
- **Optional availability filter** appears **only when the list is large**: a simple toggle/chip to show *in-stock only* (useful when a big wishlist has gone partly out of stock). This is the one filter that earns its place; anything more is a Future Improvement.
- No text search within the wishlist in v1 (a shopper scans their own shelf).

**Reasoning:** imposing catalog-style search/facets on a handful of saved items is noise; the single high-value filter is "show me what I can actually buy right now."

## Sorting Behavior

- **Default: recently added first** (the item you just saved is on top — the expected mental model).
- **Optional sort (shown only when the list is large):** Recently added · Price (low→high / high→low) · Availability (in-stock first) · Price-drop first (surface deals). Stable secondary sort.
- **Reasoning:** "my latest save first" is the default everyone expects; the extra options matter only once the list is big enough to be hard to scan — and "price-drop first" directly serves the deal-waiter.

## Pagination / Infinite Scroll

- **Small lists** (the common case) show **all items** — no pagination.
- **Large lists** use **"Load more"** (+ URL `page`), consistent with the catalog — no auto-infinite-scroll (footer reachability, accessibility, control). **Reasoning:** most wishlists are short and shown whole; only an unusually large one needs the site-wide load-more pattern.

---

## Accessibility

- **Structure:** one `h1` ("Your wishlist"); the grid uses list semantics; the toolbar (when present) is labeled.
- **Item count** is an `aria-live` region so adding/removing announces the new count.
- **Save toggle** (heart, on cards/PDP) is a real toggle button with an accessible name and pressed state ("Save to wishlist" / "Remove from wishlist", `aria-pressed`) — never an unlabeled icon; **not hover-only** (visible/tappable on touch).
- **Move to cart / Remove** are real buttons named for their target ("Move AeroBook Pro 14 to cart", "Remove AeroBook Pro 14 from wishlist"); after Remove, **focus moves to the next card** (or the empty state) so keyboard users aren't stranded; the Undo toast is announced (`role="status"`).
- **Change flags** convey state with text + icon (not color alone); unavailable items announce their state and why Move-to-cart is disabled.
- **Contrast/focus/reduced-motion:** ≥4.5:1 both themes; visible instant focus rings; reduced-motion honored (card add/remove instant).

**Reasoning:** the wishlist's a11y hinges on the **save toggle being a properly-labeled, non-hover toggle** (it's the entry point everywhere) and on **focus management after Remove** — the same trap as the cart.

---

## Responsive Rules

Verified at 320 / 375 / 414 / 768 / 1024 / 1280px. Grid 4→3→2→1 across breakpoints (auto-fill, image tracks floored at min-width 0). Per-card actions always visible (never hover-only) — critical on touch. Toolbar (when shown) collapses to a bottom-sheet sort on mobile. No horizontal page scroll; ≥44px targets; prices tabular at all sizes.

## Motion

Minimal, reversible. Save toggle: the heart fills with a quick one-shot scale/opacity (`transform`, `--dur-fast`) — a small, satisfying confirmation, **not** a bounce loop; reduced-motion → instant fill. Remove: card fades/collapses out once + Undo toast; reduced-motion → instant. Move-to-cart: button → brief "Added" + cart-badge bump (one signal, no confetti). Grid reflow on remove is quick and non-janky. Focus rings instant; no gradients. **Reasoning:** the heart is the one place a tiny, tasteful confirmation animation is worth it (it rewards saving); everywhere else motion just confirms a reversible change.

---

## Edge Cases

| Case | Behavior |
|---|---|
| Save while signed out (signed-in-only mode) | "Sign in to save" prompt; on sign-in, complete the save. |
| Save while signed out (guest mode) | Save locally; merge into the account on sign-in. |
| Guest → sign-in merge | Dedupe by product (union); notify if anything couldn't merge. |
| Item price changed since save | Card shows a price-change flag (old vs new); Move-to-cart uses current price. |
| Item low/out of stock | Flag it; disable Move-to-cart for out-of-stock; offer Remove. |
| Item removed from catalog | Group/dim as unavailable; can't move to cart; easy Remove. |
| Move to cart | Optimistic add + cart badge bump; keep in wishlist by default (offer removal). |
| Remove last item | Transition to empty state; keep Undo active. |
| Duplicate save (already saved) | Heart already filled; saving again is a no-op (or removes, per toggle semantics). |
| Very large wishlist | Load-more pagination + sort/filter toolbar appears. |
| Cross-device (signed-in) | Server is source of truth; reflects changes made elsewhere. |
| Rapid save/unsave taps | Debounce persistence; final state wins; cancel stale requests. |
| Currency/locale | Prices formatted per locale, tabular; price-drop shows both values. |
| Variant products | Save records the product (and variant if the save happened on a specific variant); the card links to the PDP with that variant. |

---

## Future Improvements

Out of scope for v1 — the module itself is the prerequisite; these layer on once it ships.

- **The wishlist backend module** (the hard dependency) — persistence, per-user storage, and guest→account merge.
- **Price-drop notifications** — alert when a saved item drops (needs the notifications channel).
- **Back-in-stock notifications** for saved out-of-stock items.
- **Multiple/named lists** (e.g., "Gifts", "Build") and **list sharing** (a public share link).
- **Move all in-stock to cart** (bulk action) and **select-to-remove**.
- **Wishlist from anywhere** — quick-save from search/autocomplete and quick-view.
- **Personalized "you might also like"** based on saved items (ties to recommendations).
- **Wishlist analytics for admins** (most-wished products) — real data, in the admin console.
- **Sync surface in Profile** — the wishlist as a profile tab in addition to `/wishlist`.

---

*End of specification. Build order (once the backend module exists): (1) SaveToggle on ProductCard/PDP (optimistic, labeled, non-hover) + the guest-local vs signed-in mode decision and merge-on-sign-in; (2) the collection grid reusing ProductCard as WishlistCard with Move-to-cart + Remove(+Undo); (3) change flags reused from cart (price/stock/unavailable) + the unavailable grouping; (4) empty states (first-run teaching + signed-out prompt + recommended rail); (5) the large-list toolbar (sort + in-stock filter) and load-more; (6) accessibility (labeled toggle, focus-after-remove, live count) and the edge/merge matrix.*
