# Admin · Customers — Page Design Spec

**Governed by [`design-system.md`](../design-system.md).** **Reuses the admin shell, table, filter/search, bulk, keyboard, and motion from [`products.md`](./products.md)** — customer-specific specializations only. **Reference feel:** Stripe *Customers* + GitHub users list. Markdown only.
**Route:** `/admin/customers` · detail `/admin/customers/:id`. **Access:** ADMIN only.
**Backend status:** maps to the **existing users CRUD** (`/admin/users`, with `role` CUSTOMER/ADMIN and `status` ACTIVE/INACTIVE/BLOCKED). Order/address rollups per customer are **future** (orders module) and gated.

---

## Goals

Let an admin **find and manage the people using the store** — look someone up, check their status, block/reactivate, edit an account, and (later) see their orders. **Why:** support and moderation are the core customer-admin tasks; the win is fast lookup by name/email and safe status control.

**Privacy stance (load-bearing):** this page shows **real personal data**. It surfaces only what's needed for the task, never exposes passwords, and treats account actions (block, role change, delete) as deliberate. **Why:** an admin console handling PII must be conservative by default — over-exposure is a trust and compliance risk.

---

## User Tasks

| Task | How served |
|---|---|
| Look up a customer | `/` search by name/email |
| Check account status | Status column (Active / Inactive / Blocked) |
| Block / reactivate | Inline status change (confirmed for Block) |
| Edit an account | Row → slide-over (email, name, role, status) |
| Distinguish admins vs customers | Role column + role filter |
| Create an account | "New user" (admins can create) |
| See a customer's orders/addresses | Detail page *(future)* |

## Layout

Shared admin shell + table. Topbar has a **"New user"** button (admins may create accounts). **Detail** is a slide-over for quick edits (email, name, role, status), expanding to a full page `/admin/customers/:id` once order/address history exists. **Why slide-over now, page later:** today's editable fields fit a drawer (fast, context kept); when orders/addresses/timeline arrive, they earn a full page.

## Table Design

| Column | Content | Notes |
|---|---|---|
| ☐ | select | bulk |
| Customer | name (link) + email beneath | two-line identity |
| Role | pill: Customer · Admin | role filter; admins visually distinct |
| Status | pill: Active · Inactive · Blocked | semantic color + label |
| Orders | count *(future)* | **right, tabular** when available |
| Joined | created date, relative | sortable |
| Verified | email-verified check | trust signal |
| ⋯ | edit · block/activate · delete* | focus/hover reveal |

**Inline quick-action:** Block / Activate directly from the row (Block is confirmed). **Why inline:** status control is the most frequent moderation action; a modal for every block would slow support. **Delete is guarded** (rare, sensitive) — soft-deactivate is preferred over hard delete.

## Filters

**Role** (Customer / Admin), **Status** (Active / Inactive / Blocked), **Verified** (yes/no), **Joined** date range. URL-encoded. **Why role+status:** the two axes moderation actually works on ("show blocked", "show admins").

## Search

Shared `/` search over **name and email** (accent-insensitive), debounced, composes with filters. **Why name+email:** support lookups start from one or the other.

## Bulk Actions

Multi-select → **set status** (Block / Activate / Deactivate), **export**. **Bulk delete is not offered** (deleting people is too consequential to batch); **bulk role change is guarded/confirmed** (granting Admin is high-privilege). Optimistic + Undo for reversible status changes. **Why the restrictions:** the blast radius of a mistaken bulk block/delete on real accounts is severe — the UI makes scope and privilege explicit.

## Empty States

| Situation | Title · guidance · action |
|---|---|
| No customers | "No customers yet" · "Accounts will appear as people register." · New user |
| No results (filtered) | "No customers match these filters" · "Try a different role or status." · Clear filters |
| No results (search) | "No customer matches '{q}'" · "Search by full name or email." · Clear |

## Loading / Errors

Shared patterns: table skeletons; table-body-only skeleton on filter change; per-row revert + retry on a failed status change; top banner + Retry on fetch failure. **Delete/role-change conflicts** (e.g., can't delete the last admin, or an account tied to orders) are explained with a safe alternative (deactivate). **Why:** the honest response to a blocked destructive action is an alternative, not a raw error.

## Responsive Behavior

Full table (≥1024) → drop Joined/Verified into the row's second line (`md`) → stacked customer cards (<768) with name/email, role + status pills, and a ⋯ menu.

## Accessibility

Shared table a11y. Role/status/verified convey via text+icon (not color). Status changes announce (`aria-live`). Block/delete confirmations are focus-trapped dialogs. **PII is not read out gratuitously** — accessible names are scoped ("Block Maya Okonkwo"), and sensitive fields aren't duplicated into decorative labels. Instant focus rings.

## Keyboard Navigation

Shared model (`/`, `j/k`, `x`, `Enter`, `e`, `Esc`, `⌘K`, `?`). **Why the same model everywhere:** one muscle memory across all admin lists is itself a usability win — an operator shouldn't relearn navigation per section.

## Motion

Shared restrained set: row hover, slide-over from the right, status-pill cross-fade, bulk-bar slide-up, reduced-motion honored. No celebration on a block/activate (a state change, not an achievement).

---

*Build order: reuse admin shell + table on the existing users API (framed as Customers) → columns with role/status/verified pills → role/status/verified/joined filters + `/` search → slide-over edit (email/name/role/status) + New user → inline Block/Activate (confirmed) + guarded bulk status/export → gate order/address rollups and the full detail page until the orders module exists. Privacy-conservative throughout.*
