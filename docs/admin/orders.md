# Admin · Orders — Page Design Spec

**Governed by [`design-system.md`](../design-system.md).** **Reuses the admin shell, table system, filter/search model, bulk pattern, keyboard model, and motion defined in [`products.md`](./products.md)** — only the order-specific specializations are detailed here. **Reference feel:** Stripe Dashboard *Payments/Orders* + Linear list. Markdown only.
**Route:** `/admin/orders` · order detail `/admin/orders/:id`. **Access:** ADMIN only.
**Backend status:** the Orders/fulfilment admin module is **planned, not yet built** (it's in the console's "planned modules"). This spec is ready for when it lands; until then the section is gated (shown as a planned-module placeholder, never a fake table).

---

## Goals

Let an admin **process orders** — see what came in, what's paid, what needs shipping — and move each order through its lifecycle without leaving the list. **Why:** order processing is a repetitive, status-driven operational task; the win is fast triage by state and one-click status transitions, exactly the Stripe payments/orders model.

**Key difference from Products:** orders are **created by checkout, not by admins**, and are **never hard-deleted** — they're read and transitioned (and cancelled/refunded). So there is **no "New" button** and **no delete**; the primary actions are *status transitions* and *refunds*.

---

## User Tasks

| Task | How served |
|---|---|
| See new/unfulfilled orders | Default sort newest-first; fulfilment-status filter |
| Check payment state | Payment-status column (Paid / Pending / Failed / Refunded) |
| Open an order to process | Row → order detail (items, address, payment, timeline) |
| Advance fulfilment | Inline / detail status transition (Processing → Shipping → Delivered) |
| Handle cancellations & refunds | Detail actions (refund via VNPay reconciliation) |
| Find an order | Search by order code or customer |
| Bulk-advance / export | Multi-select → set fulfilment status, export |

---

## Layout

Shared admin shell + table (see [`products.md`](./products.md)). Differences: **no "New" button** in the topbar (orders originate from checkout); the context row leads with fulfilment-status **filter chips shown as tabs** (All · Pending payment · Paid · Processing · Shipping · Delivered · Cancelled · Refunded) because status is *the* triage axis for orders. **Order detail** is a full page (`/admin/orders/:id`) — richer than a slide-over (items, shipping address, payment/VNPay record, a status **timeline**, actions). **Why a full page for detail:** an order has enough (line items, addresses, payment history, timeline, refund controls) that a drawer would cramp it; and a shareable order URL is useful for support.

## Table Design

Columns (tabular numerals on money/counts; status as pills; ~52px rows):

| Column | Content | Notes |
|---|---|---|
| ☐ | select | bulk |
| Order | order code (link) + item count beneath | two-line identity |
| Customer | name / email | link to the customer |
| Date | created, relative (exact on hover) | sortable, default sort |
| Total | order total | **right, tabular** |
| Payment | pill: Paid · Pending · Failed · Refunded | semantic color + label |
| Fulfilment | pill: Processing · Shipping · Delivered · Cancelled | the transition axis |
| ⋯ | actions: open · mark shipped · cancel* · refund* | focus/hover reveal |

**Why two status columns:** payment state and fulfilment state are independent (an order can be Paid + Processing, or Refunded + Cancelled); collapsing them hides the exact thing an operator triages on. **No inline delete;** cancellation/refund are deliberate detail actions with confirmation. **Why:** money-moving/irreversible operations must not be a one-click inline slip.

## Filters

Order-specific tokens: **Payment status**, **Fulfilment status**, **Date range**, **Payment method** (VNPay / COD), **Amount range**. URL-encoded, live-applied. **Why date range front-and-center:** order work is time-bounded ("today's orders", "this week's unshipped").

## Search

Shared topbar `/` search, scoped to **order code and customer name/email** (accent-insensitive), debounced, composes with filters. **Why those fields:** an operator looks up an order by its code (from the customer) or by who placed it.

## Bulk Actions

Multi-select → **set fulfilment status** (e.g., mark a batch Shipping), **export**, **print packing slips** (future). **No bulk delete** (orders aren't deleted); **bulk refund is intentionally not offered** (money movement is per-order, confirmed). Optimistic + Undo for reversible status changes; refunds always per-order with confirmation and a clear result. **Why restrict bulk here:** batching a fulfilment status is safe and useful; batching irreversible money operations invites costly mistakes.

## Empty States

| Situation | Title · guidance · action |
|---|---|
| No orders yet | "No orders yet" · "Orders placed in the store will appear here." · — (nothing to create) |
| No results (filtered) | "No orders match these filters" · "Try a different status or date range." · Clear filters |
| Module not built | Planned-module placeholder ("Orders admin is coming") — never a fake table |

**Why no create-CTA on empty:** unlike Products, an admin can't create an order — the empty state explains where orders come from instead of offering a dead button.

## Loading / Errors

Same patterns as [`products.md`](./products.md): shape-matched table skeletons; table-body-only skeleton on filter change; per-row error on a failed status transition (revert + retry); a top banner + Retry on list-fetch failure; **refund/transition failures are surfaced explicitly with the order's current true state** (money operations must never leave ambiguous UI). Partial bulk results reported per-item.

## Responsive Behavior

Same as Products: full table (≥1024) → drop low-priority columns (`md`) → stacked order cards (<768) showing code, customer, total, both status pills, and a ⋯ menu. Order detail is a full page at all sizes (stacks its sections on mobile).

## Accessibility

Shared table a11y. Both status pills convey state via text+icon (not color). Status transitions and refunds announce their result (`aria-live`); refund confirmation is a focus-trapped dialog. The order timeline is a semantic ordered list. Instant focus rings. **Why extra care on transitions:** an operator must *hear/see* that "mark shipped" or a refund actually succeeded.

## Keyboard Navigation

Shared model (`/`, `j/k`, `x`, `Enter` to open, `Esc`, `⌘K`, `?`). Order-specific: within an order, quick keys for the common transition (e.g., `s` = mark shipped) are an enhancement. **Why:** fulfilment is repetitive; a transition shortcut compounds over a shift.

## Motion

Shared restrained set. Status-pill change cross-fades to the new state (no celebration). Timeline entries appear without stagger. Reduced motion honored. **Why:** processing dozens of orders, the operator needs instant confirmation, not flourish.

---

*Build order (when the orders API lands): reuse the admin shell + table → order columns with dual status pills → status-tab filters + date range + `/` search → order detail route (items · address · payment/VNPay · timeline · transition & refund actions with confirmation) → bulk fulfilment-status + export → gate everything behind the module; show a planned-module placeholder until then.*
