# TechShop Cart — Design Specification

**Status:** Implementation-ready · **Version:** 1.0 · **Last updated:** 2026-08-07
**Governed by:** [`design-system.md`](../design-system.md) · **Continues:** [`home.md`](./home.md), [`catalog.md`](./catalog.md), [`product-detail.md`](./product-detail.md)
**Route:** `/cart`

The PDP ends in an add-to-cart; the cart is where the shopper **reviews and adjusts what they're about to buy**, then commits to checkout. It is a confirmation-and-control surface: verify the items, fix quantities, remove mistakes, see an honest total, and proceed with confidence. Every token and component resolves to the design system; every decision states its reasoning; it is written so an engineer can build it without guessing.

**A note on three required sections.** *Search & Filtering*, *Sorting*, and *Pagination* don't apply to a cart the way they do to the catalog. They're interpreted here for the cart's reality — the cart is a short, ordered, human-curated list — and each section says explicitly why the catalog concept doesn't transfer.

**Relationship to the mini-cart.** The PDP spec defined a **mini-cart** (a quick drawer/confirmation on add). This document specs the **full cart page** — the deliberate review surface reached via "View cart" or the header cart icon. The two share the line-item component and totals logic; the mini-cart is a condensed preview, the cart page is the complete, editable view.

---

## Table of contents

Purpose · Target Users · Primary User Goals · Information Architecture · Desktop Layout · Tablet Layout · Mobile Layout · Visual Hierarchy · Components Used · User Flow · Empty States · Loading States · Error States · Search & Filtering Behavior · Sorting Behavior · Pagination / Infinite Scroll · Accessibility · Responsive Rules · Motion · Edge Cases · Future Improvements

---

## Purpose

Give the shopper **certainty before payment**: exactly what's in the order, at what quantities, for what price — and a frictionless, reversible way to adjust it. The cart reduces the two anxieties that kill conversions here: *"is this the right stuff?"* and *"what will I actually pay?"*

The two most important elements are the **order total** and the **Proceed to checkout** button; both are kept visible at every scroll position (sticky summary on desktop, sticky bottom bar on mobile). The most important *interaction* rule is that edits are **safe and reversible** — quantity changes are instant, and removing an item is optimistic with an **Undo**, never guarded by an "Are you sure?" dialog (design-system rule: optimistic delete + Undo over confirmation dialogs for reversible actions).

**Honesty rule (load-bearing):** the cart never invents money. The subtotal is the real sum of line items; shipping and tax that require an address or a backend calc show **"calculated at checkout"** until known — never a fabricated figure. A wrong number here destroys trust for the whole purchase.

---

## Target Users

| User | Arrives from | Mindset | What they need most |
|---|---|---|---|
| **Ready buyer** | PDP add-to-cart / mini-cart "View cart" | "Confirm and pay" | A clear total + an obvious checkout button |
| **Basket builder** | Multiple PDPs over a session | "Did I get everything right?" | Easy quantity edits, remove, line subtotals |
| **Budget-checker** | Header cart icon | "What's this costing me?" | Prominent, honest total; subtotal breakdown |
| **Returning shopper** | Signed-in, cart persisted | "Pick up where I left off" | Restored cart, flagged price/stock changes |
| **Guest** | Browsing without an account | "Buy without signing up (yet)" | Guest cart that works and survives sign-in (merge) |
| **Deal applier** *(future)* | Any | "Use my code" | Promo field + clear discount reflection |

The cart is **operated, not read** — users scan the list, tweak, and check the total. Per the design system, that's information-design work: surface the summary (total) prominently, make each line's state legible, and keep controls obviously interactive.

---

## Primary User Goals

1. **Verify the order** — every item, variant, quantity, and unit price at a glance.
2. **Adjust safely** — change quantity or remove an item instantly and reversibly.
3. **Understand the cost** — an honest running subtotal and total, with unknowns labeled, not guessed.
4. **Recover from problems** — clear handling when an item's price changed, stock dropped, or it went unavailable.
5. **Proceed with confidence** — one obvious path to checkout, always reachable.
6. **Keep shopping** — an easy route back to browsing without losing the cart.

Goals 2 and 4 shape the interaction model (optimistic edits + Undo, inline change notices). Goals 3 and 5 shape the layout (sticky, prominent summary + CTA).

---

## Information Architecture

**Cart state** is server-owned for signed-in users and persisted locally for guests; both are read into the same client model.

| Concern | Where it lives | Why |
|---|---|---|
| Cart contents (signed-in) | Backend cart, keyed to the user | Persists across devices/sessions; the source of truth |
| Cart contents (guest) | Local persistence (browser) | Browse-first principle — no forced sign-in to build a cart |
| Merge on sign-in | Backend combines guest + saved | The guest's in-progress cart must not be lost at sign-in |
| Header cart badge | Derived from the cart model | Single source; badge and page never disagree |

**Content hierarchy:**

```
Customer shell (shared header + footer)
└─ Cart page
   ├─ Page header            ("Your cart" · N items)
   ├─ Two-region body
   │   ├─ Line items list     (the editable order)
   │   │    └─ [Unavailable / Saved-for-later groups]   (when applicable)
   │   └─ Order summary        (subtotal · shipping* · tax* · total · Checkout)
   └─ Footer
```

There is **no URL state** for the cart beyond the route — the cart is not a filtered view, it's a possession. (This is the deliberate contrast with the catalog, whose entire state is URL-encoded.)

**Line item data** (from the product/variant model): image, name (→ PDP link), variant label, unit price, quantity, computed line subtotal, availability/stock, and — when relevant — a change flag (price changed / low stock / unavailable). **Order summary data:** item count, subtotal (real), shipping (calculated at checkout / free-threshold if a real policy), promo/discount (future module), tax (calculated at checkout), grand total.

---

## Desktop Layout

**≥ 1024px (`lg`+).** Two regions inside `--layout-max`: a wide line-items list left, a **sticky order summary** right.

```
┌───────────────────────────── Header (sticky) ─────────────────────────────┐
├────────────────────────────────────────────────────────────────────────────┤
│  Your cart · 3 items                                                        │
│ ┌───────────────────────────────────────────┐  ┌────────────────────────┐  │
│ │ ┌────┐ AeroBook Pro 14        $1,249       │  │ Order summary          │  │
│ │ │img │ 16GB / 1TB                          │  │ Subtotal      $1,537   │  │
│ │ └────┘ [ − 1 + ]   Remove   Save for later*│  │ Shipping   calc. at    │  │
│ │        ────────────────  line: $1,249      │  │            checkout    │  │
│ │ ┌────┐ SonicPods Max          $159         │  │ Promo code   [____] Add*│  │
│ │ │img │ Black                               │  │ Tax        calc. at    │  │
│ │ └────┘ [ − 1 + ]   Remove   Save for later*│  │            checkout    │  │
│ │        ────────────────  line: $159        │  │ ─────────────────────  │  │
│ │ ┌────┐ GlideMouse S           $129         │  │ Total        $1,537    │  │
│ │ │img │ (2)                                 │  │ ┌────────────────────┐ │  │
│ │ └────┘ [ − 2 + ]   Remove   Save for later*│  │ │ Proceed to checkout│ │  │
│ │        ────────────────  line: $258        │  │ └────────────────────┘ │  │
│ │                                            │  │ 🔒 Secure checkout·returns│ │
│ │ ‹ Continue shopping                        │  │      (SUMMARY — sticky) │  │
│ └───────────────────────────────────────────┘  └────────────────────────┘  │
├────────────────────────────────── Footer ──────────────────────────────────┤
```
*(Save-for-later and Promo = gated future modules; shown for placement, hidden until built.)*

- **Split:** line items ~62–66%, summary ~34–38%. **The summary is sticky** so the total + checkout button stay visible while the user scrolls a long item list — the cart's whole purpose is keeping the total and the action in view.
- **Line item:** thumbnail (→ PDP), name + variant, unit price, quantity stepper, **line subtotal** (tabular numerals), Remove, and Save-for-later (future). Change flags render inline beneath the item.
- **Order summary:** a Card, `--elevation-1`. Rows use tabular numerals and right-aligned values; unknown values read "calculated at checkout." The **total** is the largest number on the page; **Proceed to checkout** is the single primary button. A quiet trust line (secure checkout, returns) and payment marks sit beneath — real policy, no invented stats.
- **Continue shopping** is a low-emphasis link back to the catalog/home.

---

## Tablet Layout

**768–1023px (`md`).** Two-column retained but compact, because the total and CTA benefit from staying beside the list.

- Line items ~60% / summary ~40%; the summary stays sticky. Line-item controls (Remove, Save) may collapse into an overflow "⋯" if space is tight, but the quantity stepper and line subtotal stay visible.
- If width is genuinely constrained (portrait), stack the summary **below** the list and add a **sticky bottom bar** (total + Proceed to checkout) so the action is never lost.
- **Reasoning:** the buy commitment is easier when the running total sits next to the items being edited; the sticky bottom bar is the fallback when stacking is forced.

---

## Mobile Layout

**< 768px (`xs`–`sm`).** Single column; the summary and action move to a persistent bar.

- **Order:** page title + item count → line items (stacked) → order-summary breakdown → (Continue shopping).
- Each **line item** reflows: thumbnail left, details right (name, variant, unit price), with the quantity stepper and line subtotal on their own row; Remove/Save become icon buttons or an overflow menu.
- A **sticky bottom bar** is always present: the **total** + a full-width **Proceed to checkout** button. Tapping the total can expand the full breakdown (subtotal/shipping/tax) in a small sheet.
- **Reasoning:** on a phone, the total and checkout must be one thumb-tap away at all times; the sticky bottom bar is the mobile equivalent of the sticky desktop summary. Putting the breakdown behind a tap on the total keeps the bar compact without hiding the detail.

---

## Visual Hierarchy

Reads in this order; scale/space/color enforce it (max weight 700).

1. **Order total** — the largest, boldest number on the page (in the summary). The budget-checker's answer.
2. **Proceed to checkout** — the one `--color-primary` button; unmistakably the action.
3. **Line items** — product image + name are the primary scan; **line subtotal** and unit price use tabular numerals; the image anchors recognition.
4. **Quantity stepper** — clearly interactive, adjacent to the line subtotal it changes.
5. **Change flags / warnings** — when present, elevated with a semantic status color (warning/danger) + text + icon so they're impossible to miss, but they don't out-shout the total.
6. **Remove / Save-for-later** — present but quiet (they're destructive/secondary); Remove is reversible so it needn't shout.
7. **Continue shopping, trust line, payment marks** — lowest emphasis, structural reassurance.

**Applied rules:** one primary button (checkout); color earned (primary only on total/CTA/active); no gradients; all money is tabular-aligned; warnings pair color with icon + text (never color alone). Whitespace: the summary breathes and is visually distinct (Card + elevation) so the total reads as the destination.

---

## Components Used

Everything maps to the shared library; new components are added there first (mini-cart and checkout reuse them), never inlined.

| Area | Components |
|---|---|
| Shell | Header · Footer (shared) |
| Page header | Section-head (title + item count) |
| Line items | **CartLineItem** *(new: thumbnail · name/variant · unit price · QuantityStepper (reused from PDP) · line subtotal · Remove · Save-for-later*)* · **ItemChangeNotice** *(new: price/stock/unavailable flag)* |
| Grouping | **CartGroup** *(new: "Unavailable" / "Saved for later" sections)* |
| Summary | **OrderSummary** *(new: rows + total)* · **PromoCodeField** *(new, future)* · Button (primary "Proceed to checkout") |
| Sticky action | **StickyCheckoutBar** *(new, tablet/mobile — parallels the PDP's StickyAddToCartBar)* |
| Feedback | Undo **Toast** (design-system) · Alert (error) · Skeleton · Empty state |
| Empty/upsell | Empty-cart state · ProductCard rail (reused, for recommended/recently-viewed) |

**Reasoning:** QuantityStepper is reused from the PDP so quantity editing behaves identically everywhere. CartLineItem, OrderSummary, and StickyCheckoutBar are cart-shaped but reused by the mini-cart and checkout, so they belong in the library. Remove uses the design-system Undo Toast pattern rather than a bespoke confirm dialog.

---

## User Flow

**Primary loop:**

```
Arrive (mini-cart "View cart" / header cart icon)
  → Review line items + total
  → Adjust: change qty  → line subtotal + total update instantly (debounced persist)
            remove item  → item removed optimistically + Undo toast (5–10s)
  → (future) apply promo code → discount reflected in summary
  → Proceed to checkout  → (sign-in gate if checkout requires it) → Checkout
  ─ or ─  Continue shopping → catalog/home (cart preserved)
```

**Detailed steps & reasoning:**
1. **Arrival.** Cart model loads (server for signed-in, local for guest). The header badge and the page render from the same source.
2. **Review.** Items in a stable order (most-recently-added first); any change flags surface at the top of their item.
3. **Quantity change.** Instant optimistic update of line subtotal and grand total; persistence is debounced (~400–600ms) so holding "+" doesn't fire a request per click. Quantity is clamped to available stock with an inline notice if the cap is hit.
4. **Remove.** Optimistic removal + an **Undo toast**; if Undo isn't taken within the window, the removal persists. No confirmation dialog for this reversible action.
5. **Promo** *(future).* Field validates on submit; success reflects a discount line; failure shows a specific inline error ("Code expired"). Gated until the promotion module exists.
6. **Proceed to checkout.** Primary CTA → checkout. If checkout requires authentication and the user is a guest, route through sign-in/guest-checkout (checkout spec decision), carrying the cart. Never silently drop the cart at this boundary.
7. **Continue shopping.** Returns to browsing with the cart intact; Back from checkout restores the cart page.
8. **Sign-in mid-session.** A guest who signs in triggers a **merge**: guest items combine with any saved cart (quantities summed, clamped to stock), with a brief notice if anything was adjusted.

---

## Empty States

The empty cart is the **most-shown state** for new/returning visitors, so it's a designed destination, not a blank page (design-system Empty-state anatomy).

| Situation | Title | Guidance | Primary action | Extra |
|---|---|---|---|---|
| **Never added anything** | "Your cart is empty" | "Browse our catalog and add items you like." | "Start shopping" (→ catalog) | (signed-in) recommended / recently-viewed rail |
| **Removed the last item** | "Your cart is empty" | Same, plus a subtle "Removed by mistake? Undo" if within the Undo window | "Start shopping" | Undo toast still active |
| **All items became unavailable** | "Nothing left in your cart" | "The items you had are no longer available." | "Browse the catalog" | Show what was removed + why |
| **Saved-for-later exists, cart empty** *(future)* | "Your cart is empty" | "But you have saved items." | "Start shopping" | Saved-for-later list shown below |

**Reasoning:** an empty cart is an opportunity, not a dead end — for signed-in users it becomes a discovery surface (recommended/recently-viewed rail reusing ProductCard). The "removed last item" variant honors the Undo window so an accidental removal is recoverable even after the list empties. Copy distinguishes "never had anything" from "had things that vanished," because the second needs an explanation.

---

## Loading States

Skeletons over spinners (design-system rules); distinguish **first load** from **edit**.

- **First load:** skeleton line items (thumbnail block + 2 text lines + a stepper/price row), matching the likely item count, plus an order-summary skeleton (rows + total + button). Header badge renders from cache immediately.
- **Quantity edit:** **no full reload** — the edited line subtotal and the grand total show a subtle inline pending state until the persisted value confirms; the rest of the cart stays interactive. Optimistic values update instantly; a failed persist reverts them.
- **Remove:** optimistic (item animates out immediately); the network call happens in the background; failure re-inserts the item with an error notice.
- **Promo apply** *(future):* the field shows a pending state; the summary recomputes on success.
- **Timing:** delay-show skeletons ~150ms; keep ~300ms minimum. Loading regions carry `aria-busy`; **total changes announce via `aria-live`** so non-visual users hear the new total after every edit.

**Reasoning:** editing must feel instant and local — never blank the whole cart to change one quantity. Optimistic updates with quiet pending indicators keep the loop tight while staying honest if the server disagrees.

---

## Error States

- **Cart fetch fails:** full-region Alert (`role="alert"`) — "Couldn't load your cart. Try again." — with **Retry**. Header/footer still render.
- **Quantity/remove persist fails:** revert the optimistic change and show an inline notice on that item ("Couldn't update — try again") with a retry; the rest of the cart is unaffected.
- **Item conflict at load** (price changed / stock dropped / removed from catalog): **not an error — a flagged notice** (see Edge Cases). The cart auto-adjusts (clamps quantity, uses current price) and clearly says what changed, so the user re-confirms before checkout.
- **Promo invalid/expired** *(future):* specific inline error on the field, never a generic failure.
- **Proceed-to-checkout blocked** (e.g., an item went out of stock at click time): stop the transition, surface which item is the problem inline, and let the user fix it — don't send a broken cart into checkout.
- **Merge conflict at sign-in** (combined quantity exceeds stock): clamp and notify ("Adjusted to available stock").

**Reasoning:** the cart's job is to be *trustworthy at the moment of checkout*, so it treats stale data as a first-class, explained situation rather than a silent surprise at payment. Errors explain what happened and how to fix it (design-system copy rules).

---

## Search & Filtering Behavior

**Not applicable in the catalog sense** — the cart is a short, human-curated list, not a searchable/filterable dataset. There is nothing to facet.

- The **global header search** is present (as on every page) and navigates to the catalog; it does not search within the cart.
- The only "filtering" analog is **grouping**: when items differ in status, the cart separates them into clear groups — **available items** (the checkoutable order), **unavailable items** (flagged, excluded from the total, with remove/save actions), and **saved for later** (future). This isn't a user filter; it's an automatic organization so the total only reflects what's actually purchasable.

**Reasoning:** imposing search/filter UI on a handful of cart lines would be noise. Automatic grouping by availability is the useful, honest equivalent — it makes clear what's included in the total and what needs attention.

---

## Sorting Behavior

**Not user-sortable** — a cart isn't a ranked list, and re-ordering it provides no shopping value.

- **Default order:** most-recently-added first (so the item the user just added from the PDP is at the top and obviously present), preserving add-order beneath.
- **Automatic grouping** overrides raw order: available items first (the order that will be purchased), then flagged/unavailable items, then saved-for-later (future) — so attention lands where action is needed.

**Reasoning:** the only ordering that matters is "did my latest add show up?" (recency) and "what needs my attention?" (grouping). A sort control would be a solution to a problem the cart doesn't have.

---

## Pagination / Infinite Scroll

**No pagination** — carts are small; **all items are shown on one page**. Pagination or infinite scroll would hide items the user must review before paying, which is unacceptable in a cart.

- For a pathologically large cart (dozens of lines), the list simply grows; the sticky summary/bar keeps the total and checkout reachable regardless of length. **List virtualization** for extreme cases is a *Future Improvement*, not v1.
- A **saved-for-later** list (future) may itself paginate with a "load more" if it grows large — consistent with the catalog's load-more decision — but the active cart never does.

**Reasoning:** everything a shopper is about to pay for must be visible and reviewable in one place; deferring cart lines behind pages or scroll thresholds directly undermines the cart's purpose.

---

## Accessibility

Baseline WCAG 2.1 AA (design-system Accessibility section).

- **Structure:** one `h1` ("Your cart"); the item list uses list semantics; the order summary is a labeled region; groups (available/unavailable/saved) are labeled sections.
- **Totals are a live region** (`aria-live="polite"`): every quantity change or removal announces the new total (and affected line subtotal), so non-visual users get the same instant feedback sighted users get.
- **Quantity stepper:** labeled numeric input with −/+ buttons carrying `aria-label`s (e.g., "Increase quantity of AeroBook Pro 14"); min/max enforced and announced when clamped.
- **Remove:** a real button named for its target ("Remove AeroBook Pro 14"); on removal, **focus moves to the next item** (or the summary if it was last) so keyboard users aren't stranded; the **Undo toast is reachable and announced** (`role="status"`).
- **Change notices:** conveyed with text + icon, `role="alert"` for blocking ones (item unavailable), pieced to the relevant line via `aria-describedby`.
- **Proceed to checkout:** a clear, keyboard-operable button; if blocked, focus moves to the problem item with an explanation.
- **Sticky bars** reserve layout space so they never obscure the last line item or a focus ring.
- **Contrast & color-independence:** ≥ 4.5:1 text / ≥ 3:1 UI in both themes; warnings and status pair color with icon/text.
- **Focus:** visible instant focus ring everywhere; logical order (items → controls → summary → checkout).
- **Reduced motion:** removal/collapse and total transitions respect `prefers-reduced-motion` (see Motion).

**Reasoning:** the two highest-impact cart a11y decisions are announcing total/subtotal changes via a live region (otherwise editing is silent to screen readers) and managing focus after a removal (a classic trap where focus is lost to the deleted node).

---

## Responsive Rules

Mobile-first; verified at 320 / 375 / 414 / 768 / 1024 / 1280px. Breakpoints per the design system.

| Concern | `xs`–`sm` (<768) | `md` (768–1023) | `lg`+ (≥1024) |
|---|---|---|---|
| Summary placement | **Sticky bottom bar** (total + checkout); breakdown in a tap-sheet | Sticky right, or bottom bar if stacked | Sticky right column |
| Line item layout | Stacked (thumb + details; stepper/subtotal on own row) | Compact row | Full row |
| Line actions | Icons / overflow menu | Overflow if tight | Inline (Remove · Save) |
| Continue shopping | Link above the sticky bar | Link | Link under the list |

**Global:** no horizontal page scroll at any width; long content wraps or scrolls within its own container. Money is tabular-aligned at all sizes. Touch targets ≥ 44px (stepper, remove, checkout). The sticky bar reserves bottom padding so it never overlaps the last item or the footer. Type/padding interpolate fluidly.

---

## Motion

Short, scoped, reversible (design-system Motion: animate only `transform`/`opacity`; `--dur-fast`/`--dur-base`; `--ease-out`; one signal per element; reduced-motion honored).

| Interaction | Behavior |
|---|---|
| Quantity change | Line subtotal + grand total update with a quick cross-fade of the number (`opacity`), not a spin/odometer. Instant under reduced motion. |
| Remove item | Item fades + collapses out once (`opacity`/`transform`); the Undo toast slides in. Reduced motion → item disappears instantly, toast appears without motion. |
| Undo | Item reappears in place with a quick fade; total re-announces. |
| Add (from mini-cart landing) | The just-added top item may highlight briefly (one signal) so the user spots it. |
| Sticky checkout bar (mobile/tablet) | Slides up once on load / when the inline summary scrolls away (`transform`); reduced motion → appears instantly. |
| Breakdown sheet (mobile) | Slides/fades from the bottom; Escape/tap-out closes. |
| Focus (any control) | Ring appears **instantly** — never transitioned. |

**Banned:** odometer/spinning number tweens on the total (they read as gimmicky and slow the scan), bounce/overshoot, per-item stagger, layout-shifting toasts, animated gradients. **Reasoning:** cart motion should confirm a change happened (a gentle cross-fade on the total) without ever making the shopper wait to see their new total — speed and legibility over flourish.

---

## Edge Cases

Each has a defined behavior.

| Case | Behavior |
|---|---|
| **Quantity exceeds stock** | Clamp to available; inline notice ("Only 3 left"); total recomputes to the clamped qty. |
| **Item price changed since added** | Use the **current** price; flag it ("Price updated") so the user re-confirms; never silently keep a stale price into checkout. |
| **Item became unavailable / removed from catalog** | Move to an "Unavailable" group, exclude from the total, offer Remove / Save-for-later; block checkout until resolved. |
| **Variant out of stock** | Flag the line; prompt to pick another variant (link to PDP) or remove. |
| **Remove last item** | Transition to the empty state; keep the Undo window active. |
| **Guest → sign-in merge** | Sum quantities of matching items, clamp to stock, notify if adjusted; don't lose either cart. |
| **Concurrent edits (multi-tab / multi-device, signed-in)** | Server is source of truth; on conflict, reconcile to server state and notify; avoid clobbering with a stale client. |
| **Rapid stepper clicks** | Debounce persistence; reflect the final value; cancel superseded requests. |
| **Max quantity per item / per order** | Enforce the cap with a clear message; disable "+" at the cap. |
| **Very large cart** | Render all items (no pagination); sticky summary keeps total/checkout reachable; virtualization = future. |
| **Zero-priced / free item** | Display "Free" (not "$0" ambiguity) where genuinely free. |
| **Currency / locale** | Format all money per locale with tabular numerals (reuse the shared formatter). |
| **Checkout requires sign-in (guest)** | Route through sign-in/guest-checkout carrying the cart; never drop it. |
| **Proceed with an unresolved flagged item** | Block, focus the problem item, explain — don't send a broken cart forward. |
| **Back from checkout** | Restore the cart page and scroll position; reflect any changes made in checkout. |
| **Header badge vs page mismatch** | Impossible by design — both derive from one cart model; the badge updates optimistically with edits. |

---

## Future Improvements

Out of scope for v1 — mostly blocked on data or a backend module, listed so they aren't faked.

- **Save for later / wishlist** — move items out of the active cart without losing them; blocked on the wishlist module.
- **Promo / discount codes** — the summary's promo field; blocked on the planned promotion module (never show a code field that does nothing).
- **Shipping estimator** — enter a postal code for a real shipping estimate before checkout.
- **Tax estimate** — show estimated tax pre-checkout once the backend can compute it.
- **Cross-sell / add-ons** — "frequently bought together" / accessories for cart items (reusing ProductCard).
- **Recommended & recently-viewed** on the empty cart (signed-in) — partially specified here; expand with real recommendation data.
- **Gift options** — gift wrap / message at the line or order level.
- **Bulk actions** — select multiple lines to remove/save at once.
- **Stock urgency** — "Only N left" / low-stock countdown, when inventory signals are reliable.
- **Buy-now-pay-later / financing** display in the summary.
- **Persistent cross-device cart** for signed-in users (server cart already enables this; surface it explicitly).
- **List virtualization** for extreme cart sizes.

---

*End of specification. Build order suggestion: (1) shared new components — CartLineItem (reusing QuantityStepper), OrderSummary, StickyCheckoutBar, ItemChangeNotice, CartGroup — since the mini-cart and checkout reuse them; (2) the cart model + header-badge derivation (guest local + signed-in server, with merge-on-sign-in); (3) desktop two-region layout with optimistic quantity edits and Undo-based remove; (4) empty state (+ signed-in discovery rail), loading, and the flagged price/stock/unavailable notices; (5) tablet/mobile sticky bar and responsive reflow; (6) gate promo/save-for-later behind their modules and wire the checkout handoff (carrying the cart, honoring any sign-in gate).*
