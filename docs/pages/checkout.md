# TechShop Checkout — Design Specification

**Status:** Implementation-ready · **Version:** 1.0 · **Last updated:** 2026-08-07
**Governed by:** [`design-system.md`](../design-system.md) · **Continues:** [`home.md`](./home.md), [`catalog.md`](./catalog.md), [`product-detail.md`](./product-detail.md), [`cart.md`](./cart.md)
**Routes:** `/checkout` (the flow) · `/checkout/success` and `/checkout/failed` (payment-gateway returns) · confirmation may resolve to `/orders/:id`.

Checkout is the last screen between intent and revenue, and the least forgiving: every point of friction, doubt, or distraction leaks conversions, and every dishonest number destroys trust at the exact moment money changes hands. Its job is narrow and absolute — **collect what's needed to fulfil and pay for the order, with the fewest possible steps and zero surprises, then hand payment off safely.** Every token and component resolves to the design system; every decision states its reasoning; it is written so an engineer can build it without guessing.

**Payment safety (non-negotiable, stated up front).** TechShop's own UI **never collects card or bank credentials.** Card/bank payment is handled by **redirecting to VNPay's hosted payment page**; the in-app methods are that redirect and **Cash on Delivery (COD)**. This is both a PCI-scope decision and a trust decision — sensitive credentials are only ever entered on the payment provider's surface, never in a TechShop form.

**A note on three required sections.** *Search & Filtering*, *Sorting*, and *Pagination* have essentially no role in a focused checkout; each section below states why and maps to the page's only real analog (the address/location picker), rather than forcing a catalog concept onto a payment flow.

---

## Table of contents

Purpose · Target Users · Primary User Goals · Information Architecture · Desktop Layout · Tablet Layout · Mobile Layout · Visual Hierarchy · Components Used · User Flow · Empty States · Loading States · Error States · Search & Filtering Behavior · Sorting Behavior · Pagination / Infinite Scroll · Accessibility · Responsive Rules · Motion · Edge Cases · Future Improvements

---

## Purpose

Turn a reviewed cart into a paid, fulfillable order. The checkout must (1) **collect the fulfilment inputs** — who receives it, where, how it ships — (2) **collect payment intent** — VNPay or COD — (3) **show a final, honest total** with shipping and any tax now that the address is known, and (4) **place the order safely** without double-charging, losing the cart, or surprising the shopper.

Two decisions define the page:
- **A focused shell.** The full shop header/footer (search, cart nav, department bar, marketing footer) is **replaced by a minimal checkout header** (brand + a "secure checkout" signal + support link) and a minimal footer. **Reasoning:** every extra link is an exit; checkout removes distractions and escape hatches so the shopper's attention stays on completing the order. This is a standard, high-impact conversion decision.
- **A stepped, single-page flow.** Checkout is one page with sequential sections — **Contact → Shipping address → Delivery method → Payment → Review** — with an **always-visible order summary**. **Reasoning:** sequencing isolates errors and reduces cognitive load (one decision at a time), while keeping everything on one route so the user perceives progress without full page reloads and can revisit a completed step in place.

---

## Target Users

| User | Arrives from | Mindset | What they need most |
|---|---|---|---|
| **Ready signed-in buyer** | Cart → checkout | "Confirm and pay fast" | Prefilled details, saved address, one clear "Place order" |
| **Guest buyer** | Cart → checkout (not signed in) | "Buy without an account" | Guest checkout with email; not forced to register |
| **First-time buyer** | Cart, new to TechShop | "Is this safe? What's the total?" | Trust signals, an honest total, clear steps |
| **Cautious payer** | Any | "No surprises before I pay" | Final total with shipping/tax; obvious secure-payment handoff |
| **Returning buyer** | Cart, has past orders | "Reuse my saved address" | Saved-address selection; minimal re-entry |

**Guest vs. required sign-in (reasoning):** forced account creation is a top cause of checkout abandonment, so **guest checkout (email + address) is the target**, with sign-in offered as the *faster* path (prefilled data), not a gate. **Backend caveat:** current order endpoints are user-scoped (`GET /orders/me`); if the backend requires an authenticated user to create an order, v1 gates checkout behind sign-in/registration and treats guest checkout as the first Future Improvement. The UI is built to support both; which is active depends on backend capability.

---

## Primary User Goals

1. **Say where it goes** — enter or pick a shipping address quickly (reusing saved addresses when signed in).
2. **Choose how it ships** — pick a real delivery method (or accept the only one).
3. **Choose how to pay** — VNPay (redirect) or COD, understood clearly.
4. **See the final, honest total** — items + shipping + any tax, computed now that the address is known.
5. **Place the order once, safely** — no double charge, no lost cart, no ambiguity about whether it worked.
6. **Get confirmation** — a clear "your order is placed" with an order code and next steps.

Goal 4 requires the address before the total is final — which is why address precedes payment in the step order. Goal 5 drives the idempotency and re-validation rules.

---

## Information Architecture

**Checkout state** is derived from the cart plus the inputs collected in the flow. Unlike the catalog, **it is not URL-encoded** — a half-entered checkout is not a shareable view; it's a transient, sensitive process. Only the gateway-return routes carry status params.

| State | Where it lives | Why |
|---|---|---|
| Cart contents | The cart model (source of truth) | Checkout reviews the cart; it doesn't own the items |
| Contact / email | Checkout session (guest) or account | Needed for order + receipt |
| Shipping address | Saved address (signed-in) or entered form | Fulfilment input |
| Delivery method | Selected in-flow | Affects shipping cost + total |
| Payment method | Selected in-flow (VNPay / COD) | Determines the place-order path |
| Gateway return status | `/checkout/success?…` / `/checkout/failed?…` | Backend redirects back with a status (mirrors the home page's `?verified=` pattern) |

**Step model (sequential, single page):**

```
Minimal checkout header (brand · 🔒 secure · support)
└─ Checkout
   ├─ Progress indicator            (Contact · Shipping · Delivery · Payment · Review)
   ├─ Step 1 · Contact / account    (sign in offer · email for guest)
   ├─ Step 2 · Shipping address     (saved-address picker OR new-address form w/ VN location picker)
   ├─ Step 3 · Delivery method      (options + cost, or single default)
   ├─ Step 4 · Payment method       (VNPay redirect · COD)
   ├─ Step 5 · Review & place order  (final read-only order + Place order)
   └─ Order summary                 (items · subtotal · shipping · tax · total)  — persistent
Minimal footer (secure · policy links)
```

Completed steps collapse to a summary line with an "Edit" affordance; the active step is expanded; future steps are visible but locked until their prerequisites are met.

**Address data** reuses the profile page's model and components: receiver name, phone, province/district/ward (the existing Vietnam location combobox with local + `provinces.open-api.vn` data), address line, and the optional embedded map preview. Saved addresses (signed-in) come from `GET /addresses/me`.

---

## Desktop Layout

**≥ 1024px (`lg`+).** Two regions inside `--layout-max`: the stepped form left, a **sticky order summary** right.

```
┌──────────── TechShop        🔒 Secure checkout            Need help? ───────┐   (minimal header)
├────────────────────────────────────────────────────────────────────────────┤
│  ① Contact ─ ② Shipping ─ ③ Delivery ─ ④ Payment ─ ⑤ Review   ‹progress›     │
│ ┌───────────────────────────────────────────┐  ┌────────────────────────┐  │
│ │ ① Contact                          ✓ Edit  │  │ Order summary          │  │
│ │    you@email.com                           │  │ ┌──┐ AeroBook ×1 $1,249 │  │
│ │ ② Shipping address              (active)   │  │ ┌──┐ Pods    ×1  $159   │  │
│ │    ○ Home — 123 …            [Use this]     │  │ ┌──┐ Mouse   ×2  $258   │  │
│ │    ○ Office — 45 …                          │  │ ─────────────────────  │  │
│ │    ＋ Add a new address                     │  │ Subtotal       $1,666  │  │
│ │      [ name ][ phone ]                      │  │ Shipping         $12   │  │
│ │      [ province ▾ ][ ward ▾ ]  (combobox)   │  │ Tax               $0   │  │
│ │      [ exact address …………… ]                │  │ ─────────────────────  │  │
│ │      (map preview)                          │  │ Total          $1,678  │  │
│ │                          [ Continue ]       │  │ ┌────────────────────┐ │  │
│ │ ③ Delivery method               (locked)   │  │ │    Place order     │ │  │
│ │ ④ Payment                        (locked)   │  │ └────────────────────┘ │  │
│ │ ⑤ Review                         (locked)   │  │ 🔒 Payments via VNPay   │  │
│ └───────────────────────────────────────────┘  │      (SUMMARY — sticky) │  │
├────────────────────────────── minimal footer ──────────────────────────────┤
```

- **Split:** steps ~60–64%, summary ~36–40%. **The summary is sticky** so the total and (on the Review step) the place-order action stay visible throughout — the shopper always knows the cost.
- **Steps** are an accordion of sections: completed steps show a one-line summary + "Edit"; the active step is expanded; locked steps are dimmed until reachable. Each step's own "Continue" advances to the next.
- **Order summary** is a Card, `--elevation-1`: a read-only mini line-item list, then subtotal / shipping / tax / **total** (all tabular numerals, right-aligned). The **Place order** button lives here on the summary (and is mirrored at the end of the Review step) so it's reachable once the flow is complete.
- **Address step** reuses the profile combobox (province/district/ward search) + optional map preview; saved addresses appear as selectable options above "Add a new address."

---

## Tablet Layout

**768–1023px (`md`).** Two-column retained but compact; the summary stays sticky.

- Steps ~58% / summary ~42%. The address form fields may drop from two-up to one-up as width tightens.
- If width is constrained (portrait), stack the summary **above** the steps as a **collapsible summary** (total always shown, details on tap) and add a **sticky bottom bar** with the total + the step's primary action (Continue / Place order).
- **Reasoning:** the running total must stay visible while entering details; the collapsible-summary + sticky bar pattern preserves that when a side column won't fit.

---

## Mobile Layout

**< 768px (`xs`–`sm`).** Single column, steps stacked, summary condensed, action pinned.

- **Top:** a **collapsible order summary** — the **total** always visible, tap to expand the line items + breakdown. **Reasoning:** the total is the shopper's constant question; the detail is on demand so it doesn't push the form down.
- **Steps** stack as full-width accordion sections; only the active step is expanded; completed steps collapse to a summary + Edit.
- **Sticky bottom bar:** the current step's primary action (Continue, then Place order on Review) with the total beside it. Always reachable.
- Address form fields are one-up; the location combobox opens as a full-height searchable list; the map preview is collapsible (it's reassurance, not required).
- **Reasoning:** phones are where checkout friction hurts most — one step at a time, a persistent total, and a thumb-reachable primary action are the three highest-impact mobile decisions.

---

## Visual Hierarchy

Reads in this order; scale/space/color enforce it (max weight 700).

1. **Current step's heading + its primary action** — the one thing to do right now; the active step is visually dominant, others recede.
2. **Order total** — the largest number; the shopper's constant reference (in the summary / collapsible bar).
3. **Place order (final CTA)** — the single `--color-primary` button; appears only when the flow is complete; unmistakable.
4. **Step inputs** — clear labels, generous fields, obvious required-ness; the address combobox and payment choices are prominent within the active step.
5. **Completed-step summaries** — quiet one-liners with an "Edit" link; present but out of the way.
6. **Trust signals** — "🔒 Secure checkout", "Payments via VNPay", return/warranty line; reassuring, not shouting; near the payment step and the place-order button.
7. **Order summary line items** — read-only, compact, muted; verification, not a focal point.

**Applied rules:** one primary action visible at a time (step Continue, then Place order); color earned (primary only on the active action + total); no gradients; all money tabular-aligned; errors use semantic danger with icon + text. The active step gets the whitespace; locked steps are dim. **Reasoning:** a checkout should feel like a short, guided path — dominant "now" step, ever-present total, single obvious action — never a wall of simultaneous fields.

---

## Components Used

Everything maps to the shared library; new components are added there first, never inlined. The checkout heavily reuses cart, profile, and PDP components.

| Area | Components |
|---|---|
| Shell | **CheckoutHeader** *(new, minimal)* · **CheckoutFooter** *(new, minimal)* |
| Progress | **StepProgressIndicator** *(new)* |
| Steps | **CheckoutStep / Accordion** *(new: expanded/complete/locked states)* |
| Contact | Input (email) · sign-in affordance (links to Auth) |
| Address | **SavedAddressPicker** *(reuses profile address data)* · **AddressForm** *(reuses the profile Vietnam location combobox + map preview)* · Radio group |
| Delivery | Radio group (**DeliveryMethodOption** — label + cost + ETA) |
| Payment | Radio group (**PaymentMethodOption** — VNPay · COD) · trust marks |
| Review | Read-only summaries of each step · Button (primary "Place order") |
| Summary | **OrderSummary** *(reused from cart)* · totals with tabular numerals |
| Sticky action | **StickyCheckoutBar** *(reused from cart — here it carries Continue / Place order)* |
| Transitional | **RedirectingState** *(new: full-screen "Redirecting to VNPay")* · Skeleton · Alert (error) |
| Confirmation | **OrderConfirmation** *(new: order code · summary · next steps)* |

**Reasoning:** reusing the cart's OrderSummary and StickyCheckoutBar and the profile's address/location components means checkout inherits proven, consistent UI and the user sees familiar patterns at the most anxious moment. New components are the flow scaffolding (steps, progress, redirect, confirmation) — reusable by any future multi-step flow.

---

## User Flow

**Primary happy path:**

```
Cart → Checkout
  ① Contact:  signed-in → prefilled/skip  ·  guest → enter email (or sign in for speed)
  ② Shipping: pick saved address OR add new (VN location combobox) → Continue
  ③ Delivery: choose method (cost + ETA) → Continue        [shipping cost now known → total finalizes]
  ④ Payment:  choose VNPay or COD → Continue
  ⑤ Review:   read-only order → Place order
       → re-validate cart (stock/price) server-side
       → create order (idempotent)
       → COD:   go straight to Order Confirmation
          VNPay: RedirectingState → VNPay hosted page → return to /checkout/success|failed
       → Order Confirmation (order code, summary, next steps)
```

**Detailed steps & reasoning:**
1. **Entry guard.** Reaching `/checkout` with an empty cart redirects to the cart with a notice (you can't check out nothing). Reaching it with flagged cart items (price/stock changes from the cart spec) forces resolution first.
2. **Contact.** Signed-in users skip or see it prefilled; guests enter an email (for the receipt/order). A prominent "Sign in for faster checkout" option is offered, never forced.
3. **Shipping address.** Signed-in users pick a saved address (default preselected) or add a new one; guests fill the address form. The Vietnam location combobox is reused verbatim from profile. On Continue, the address is validated.
4. **Delivery method.** Real methods with real costs/ETAs; if only one exists, it's preselected and shown (not hidden). **Choosing it finalizes shipping cost → the total updates.**
5. **Payment method.** VNPay (redirect) or COD, each clearly explained ("You'll be redirected to VNPay to pay securely" / "Pay in cash when your order arrives"). No card fields in TechShop.
6. **Review.** A read-only recap of every step + the final total; the last chance to Edit any step. **Place order** is the commit.
7. **Place order.** The button locks immediately (prevents double-submit); the server **re-validates the cart** (stock/price) before creating anything; the order is created with an **idempotency key** so a refresh/retry can't duplicate it.
8. **Payment handoff.** COD → confirmation directly (order = pending payment/COD). VNPay → a full-screen **RedirectingState**, then the hosted VNPay page; on return, `/checkout/success` or `/checkout/failed` reads the backend-verified status.
9. **Confirmation.** Order code, summary, and next steps ("We emailed your receipt", "Track it in My orders"); the cart is now cleared. From here the user can view the order (→ `/orders/:id`) or continue shopping.

---

## Empty States

Checkout has few "empty" states because it's a guarded flow, but each is defined.

| Situation | Behavior |
|---|---|
| **Cart empty at entry** | Redirect to `/cart` with a notice ("Your cart is empty — add items before checkout."). Never render an empty checkout. |
| **No saved addresses (signed-in)** | Skip the picker; show the new-address form directly with a subtle "This will be saved to your account." |
| **No delivery methods available (address not serviceable)** | Block the Delivery step with a clear message ("We don't deliver to this address yet") + let the user edit the address; don't fabricate a method. |
| **Guest, no account** | Proceed as guest (email only); offer sign-in but never require an empty-account setup. |
| **Order summary with a single item** | Render normally; no special-casing. |

**Reasoning:** the most important "empty" case is *empty cart* — checkout is meaningless without items, so it bounces the user back rather than showing a broken shell. Address/delivery emptiness converts into the next honest action (enter address / fix address), never a dead end.

---

## Loading States

Skeletons over spinners where layout is known; explicit transitional states for the high-stakes moments.

- **First load:** skeletons for the step scaffold (labels + field blocks) and the order summary (line rows + total). Saved addresses and delivery methods load into their steps with local skeletons.
- **Step transitions:** advancing a step is in-place (no full reload); a brief inline pending state on the step's Continue button while its input is validated/persisted.
- **Shipping-cost calc:** when the address/method changes the total, the shipping/tax/total values show a subtle pending state until the backend returns the real figures — never a guessed number in the meantime.
- **Place order:** the button enters a **locked loading state** immediately (spinner + preserved width) and **cannot be pressed again** — the primary defense against double orders. A slow order-creation shows "Placing your order…".
- **Payment redirect:** a **full-screen RedirectingState** ("Redirecting to VNPay to complete payment securely — don't close this window") so the user understands the imminent navigation and doesn't abandon.
- **Gateway return:** `/checkout/success|failed` shows a brief "Confirming your payment…" while the backend-verified status resolves, then the confirmation or failure state.
- **Timing:** delay-show skeletons ~150ms, ~300ms min; loading regions `aria-busy`; total changes announce via `aria-live`.

**Reasoning:** the place-order and redirect moments are where a confusing spinner causes real harm (double charge, abandoned payment). They get explicit, worded states — not a generic spinner — and the button-lock is treated as a correctness feature, not a nicety.

---

## Error States

Checkout errors are high-consequence; each has a specific, recoverable behavior. Errors explain what happened and how to fix it (design-system copy rules) — never a vague failure.

- **Field validation** (email format, required address fields, invalid phone, incomplete VN location): inline, per-field, on blur and on step-Continue; focus moves to the first error; the step stays open.
- **Address not serviceable:** shown at the Delivery step (see Empty States) with an edit path.
- **Cart re-validation fails at place-order** (an item went out of stock or changed price): **stop the order**, return the user to a clear message identifying the item, and route back to the cart to resolve — **never charge for an order that can't be fulfilled.**
- **Order creation fails (server/network):** keep the checkout intact, show an Alert with Retry; because creation is idempotent, a retry won't duplicate.
- **Payment failed / cancelled / timed out (VNPay return):** `/checkout/failed` explains the outcome ("Payment was cancelled" / "Payment failed") and offers **Try again** (re-attempt payment for the same pending order, not a new order) or choose another method (e.g., COD). The order exists in a *pending/unpaid* state; it is not lost.
- **Payment pending/async:** if VNPay confirms asynchronously, show an "Order placed — payment confirming" state rather than claiming success prematurely; update when the backend confirms.
- **Session/token expiry mid-checkout (signed-in):** the API client's silent token refresh handles most; if it fails, preserve entered data where possible and prompt a quick re-sign-in, returning to the same step.
- **Double-submit / refresh after placing:** idempotency key + button-lock prevent duplicates; a refresh on the return URL re-reads the existing order, never creates a second.

**Reasoning:** the two catastrophic checkout failures are **double-charging** and **charging for an unfulfillable order** — the spec defends against both explicitly (idempotency, button-lock, place-time re-validation). Payment failures keep the order recoverable so the shopper can retry without rebuilding everything.

---

## Search & Filtering Behavior

**No catalog search or faceting** — checkout is a focused flow, and the full header search is deliberately **removed** (see Purpose: distraction reduction). The only search analog is:

- **Address / location search:** the reused Vietnam location combobox lets the user **search province/district/ward** by typing (accent-insensitive, matching the profile implementation), and signed-in users can quickly scan/select among **saved addresses**. This is the page's sole "filter/search" surface, and it exists to speed data entry, not to browse a dataset.

**Reasoning:** adding a product search to checkout would invite the user to leave the flow. The location combobox is the one place where fast search genuinely helps (Vietnam's province/ward lists are long), so it's kept and optimized.

---

## Sorting Behavior

**Nothing on checkout is user-sortable.**

- **Order summary line items** mirror the cart's order (read-only) — the shopper already curated it; re-sorting adds nothing and would only obscure the review.
- **Saved addresses** are ordered **default-first**, then most-recently-used, so the likely choice is preselected/top.
- **Delivery methods** are ordered cheapest/standard-first (or by ETA), a deliberate presentation, not a user control.

**Reasoning:** checkout is about confirming decisions, not re-organizing lists. The only ordering that matters — default address first, standard delivery first — is a sensible fixed default, not a control to expose.

---

## Pagination / Infinite Scroll

**None.** The entire checkout — every step and the full order summary — is on one page with no pagination or infinite scroll.

- The **order summary shows all items**; for a large order it becomes internally scrollable (its own container) or collapsible, but items are never hidden behind pages — the shopper must be able to review everything they're paying for.
- Saved addresses and delivery methods are short lists shown in full.

**Reasoning:** hiding any part of an order behind pagination before payment is unacceptable; the same principle as the cart. A focused flow also shouldn't introduce navigation that could scatter attention or state.

---

## Accessibility

Baseline WCAG 2.1 AA (design-system Accessibility section). Checkout demands the strictest form and status accessibility on the site.

- **Structure:** one `h1` ("Checkout"); each step is a labeled section/region with an accessible heading; the progress indicator is an accessible list conveying completed/current/upcoming state (`aria-current="step"`).
- **Forms:** every field has a persistent visible label; required fields marked programmatically; errors are inline, tied to fields via `aria-describedby`, with `aria-invalid`; on step-submit, focus moves to the first error; a step-level error summary is offered for multi-error steps.
- **Location combobox:** proper combobox/listbox semantics, keyboard operable, options announced, selection reflected — inherited from the profile implementation.
- **Payment choices:** a labeled radio group; the VNPay option clearly announces the upcoming redirect ("Opens VNPay to complete payment").
- **Totals & shipping:** the total and any recomputed shipping/tax are in an **`aria-live` region** so changes (after choosing a delivery method) are announced.
- **Place order:** a clearly named button; its loading/locked state is conveyed (`aria-busy`/disabled with an accessible message); the **RedirectingState announces the imminent navigation** so screen-reader users aren't dropped onto VNPay without warning.
- **Step navigation & focus:** advancing/editing a step moves focus to that step's heading/first field; collapsed completed steps keep their "Edit" reachable.
- **No unwarned time limits:** if a payment session has a timeout, warn with time to extend (WCAG 2.2.1).
- **Sticky bars** reserve layout space so they never obscure the active field or a focus ring.
- **Contrast & color-independence:** ≥ 4.5:1 text / ≥ 3:1 UI in both themes; validation and status pair color with icon + text.
- **Reduced motion:** step and redirect transitions respect `prefers-reduced-motion`.

**Reasoning:** the highest-impact checkout a11y decisions are **announcing total changes** (the shopper must hear the cost update when delivery is chosen), **robust per-field error + focus management** (checkout has the most fields on the site), and **announcing the payment redirect** (navigating away silently is disorienting and abandonment-prone).

---

## Responsive Rules

Mobile-first; verified at 320 / 375 / 414 / 768 / 1024 / 1280px. Breakpoints per the design system.

| Concern | `xs`–`sm` (<768) | `md` (768–1023) | `lg`+ (≥1024) |
|---|---|---|---|
| Summary placement | Collapsible at top (total always shown) + **sticky bottom bar** | Sticky right, or top-collapsible + bottom bar if stacked | Sticky right column |
| Steps | Full-width accordion, one expanded | Accordion, wider fields | Accordion beside summary |
| Address fields | One-up; combobox full-height | One/two-up | Two-up where sensible |
| Primary action | Sticky bottom bar (Continue → Place order) | Bottom bar or summary button | In summary + Review step |
| Map preview | Collapsible, off by default | Collapsible | Inline |

**Global:** no horizontal page scroll at any width; long summaries scroll within their own container. Money tabular-aligned everywhere. Touch targets ≥ 44px (radios, comboboxes, steppers, Place order). Sticky bars reserve space so they never overlap fields or the footer. The minimal header/footer apply at all sizes.

---

## Motion

Short, scoped, reversible (design-system Motion: animate only `transform`/`opacity`; `--dur-fast`/`--dur-base`; `--ease-out`; one signal; reduced-motion honored).

| Interaction | Behavior |
|---|---|
| Step advance / edit | The next step expands and the previous collapses to its summary — quick, one motion; reduced motion → instant. Focus moves to the newly active step. |
| Total / shipping update | Recomputed values cross-fade (`opacity`) when a delivery method changes; **no odometer/spin** on money. Instant under reduced motion. |
| Field validation error | Error text fades in beneath the field; the field's border changes to danger instantly (no animated ring). |
| Progress indicator | The current-step marker shifts smoothly; never steals focus. |
| Sticky bar | Slides up once on load / when the inline action scrolls away (`transform`); reduced motion → instant. |
| Redirecting to VNPay | Full-screen state fades in with a calm, worded message; no spinner theatrics; the navigation follows promptly. |
| Confirmation | A single restrained success moment (a checkmark draw or gentle fade) — **not** confetti; the order code and next steps are the point. |
| Focus (any control) | Ring appears **instantly** — never transitioned. |

**Banned:** money odometers, bounce/overshoot, celebratory confetti on payment, per-field stagger, layout-shifting toasts, anything that delays the shopper seeing their total or completing payment. **Reasoning:** at the payment moment, motion must reassure and clarify (a calm redirect message, a clear total update) — never entertain or delay. Even the success screen stays restrained: the shopper wants their order number, not a celebration.

---

## Edge Cases

Each has a defined behavior.

| Case | Behavior |
|---|---|
| **Empty cart at entry** | Redirect to `/cart` with a notice. |
| **Cart item out of stock / price changed since cart** | Force resolution before/at place-order; re-validate server-side; if it fails at commit, stop and return to cart with the specific item flagged. |
| **Address not serviceable** | Block delivery step; prompt to edit address; never fabricate a method/rate. |
| **Only one delivery method** | Preselect and show it (not hidden), so the cost is transparent. |
| **Guest email already has an account** | Allow guest checkout; optionally suggest signing in; don't block. |
| **Place order double-click / refresh** | Button locks on first click; idempotency key prevents duplicate orders; refresh re-reads the existing order. |
| **VNPay cancelled / failed / timeout** | `/checkout/failed` explains; order stays pending/unpaid; offer retry-payment (same order) or switch to COD. |
| **VNPay async confirmation** | Show "Order placed — payment confirming"; resolve to paid when the backend verifies; don't claim success early. |
| **Back button during/after redirect** | Returning mid-payment lands on a safe pending/return state, not a broken form; the order isn't duplicated. |
| **Session/token expiry mid-checkout** | Silent refresh; if it fails, preserve data where possible, re-sign-in, return to the same step. |
| **Network loss mid-place-order** | Button stays locked with a retry; idempotency ensures at most one order. |
| **Minimum order / max quantity rules** | Enforced with a clear message before payment. |
| **COD not allowed for this order/region** | Hide/disable COD with a reason; leave VNPay available. |
| **Currency / locale** | Format all money per locale with tabular numerals (shared formatter). |
| **User edits a completed step** | Re-opening a step re-locks downstream steps that depend on it (e.g., changing address re-checks delivery cost). |
| **Order placed, receipt email fails** | Order still succeeds; confirmation notes the receipt may be delayed; never block the confirmation on email. |

---

## Future Improvements

Out of scope for v1 — mostly blocked on backend/modules, listed so they aren't faked.

- **Guest checkout** (if v1 requires sign-in due to user-scoped order endpoints) — the top enhancement.
- **Saved payment methods / faster repeat checkout** and **express/one-click checkout**.
- **Promo / discount codes** at checkout — blocked on the planned promotion module (never show a non-functional field).
- **Additional payment methods** — MoMo, cards via gateway, bank transfer — as the payments module grows.
- **VAT invoice details** ("xuất hóa đơn") — company name/tax code capture, common in Vietnam.
- **Delivery date/time-slot selection** and real-time delivery estimates by address.
- **Multiple shipping destinations / split shipments** for one order.
- **Order notes / gift options / gift message**.
- **Loyalty points / store credit** application at checkout.
- **Address autocomplete / geocoding** beyond the province-ward combobox.
- **Post-purchase upsell** on the confirmation page (recommended accessories), reusing ProductCard.
- **Structured order-confirmation data** (schema.org Order) and richer order tracking.

---

*End of specification. Build order suggestion: (1) shared new scaffolding — CheckoutHeader/Footer, StepProgressIndicator, CheckoutStep accordion, RedirectingState, OrderConfirmation — plus reuse of cart's OrderSummary/StickyCheckoutBar and profile's AddressForm/location combobox; (2) the step state machine (sequential unlock, edit-relock, entry guards) with cart as source of truth; (3) address → delivery (real cost → total finalizes) → payment method selection; (4) the place-order path: button-lock + idempotency + server-side cart re-validation, then COD-direct vs VNPay-redirect with the success/failed return handling; (5) order confirmation + cart clearing; (6) the full error/edge matrix and accessibility (live-region totals, per-field errors, redirect announcement). Guard guest-vs-required-sign-in on backend capability.*
