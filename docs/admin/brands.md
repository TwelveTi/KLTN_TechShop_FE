# Admin · Brands — Page Design Spec

**Governed by [`design-system.md`](../design-system.md).** **Reuses the admin shell, table, filter/search, bulk, keyboard, and motion from [`products.md`](./products.md).** **Reference feel:** Stripe/GitHub reference tables. Markdown only.
**Route:** `/admin/brands`. **Access:** ADMIN only. **Backend status:** maps to the **existing brands CRUD** (name, slug, isActive). Brand **logo** upload is future.

---

## Goals

Let an admin **maintain the brand list** — add, rename, activate/deactivate — fast. Brands are small, low-churn reference data that products reference and the storefront filters by, so the page mirrors [`categories.md`](./categories.md): lightweight, in-place, quick. **Why the parallel with categories:** they're the same shape of problem (small reference taxonomy), so they share the same solution — consistency across the two makes the admin instantly at home in either.

## User Tasks

Add a brand · rename / edit · toggle active · remove unused · find one · (future) upload a logo.

## Layout

Shared admin shell + table, **"New brand"** in the topbar, **create/edit in a right slide-over** (name, description, slug (auto/editable), active toggle, logo *(future)*). **Why slide-over:** the form is small; a repeatable add/edit loop with the list visible is the fastest shape.

## Table Design

| Column | Content | Notes |
|---|---|---|
| ☐ | select | bulk |
| Brand | name (link) (+ logo when available) | edit on click |
| Slug | url slug | mono; storefront path |
| Products | count for this brand *(future)* | **right, tabular** |
| Status | pill: Active · Inactive | semantic |
| Updated | relative | sortable |
| ⋯ | edit · activate/deactivate · delete* | reveal on focus/hover |

**Inline Active/Inactive toggle** (same rationale as categories: the most frequent action is storefront visibility). Slug in mono as a technical identifier.

## Filters

**Status** (Active / Inactive), URL-encoded. The only axis a small brand list needs.

## Search

Shared `/` search over **name** (and slug), instant.

## Bulk Actions

Multi-select → **activate / deactivate**, **delete** (guarded — **blocked when the brand has products**; offer deactivate or reassign). Optimistic + Undo for reversible changes. **Why guard delete:** deleting a brand referenced by live products would orphan them; deactivate is the safe equivalent.

## Empty States

| Situation | Title · guidance · action |
|---|---|
| No brands | "No brands yet" · "Add the brands you carry." · New brand |
| No results | "No brands match" · "Clear the search or status filter." · Clear |

## Loading / Errors

Shared: skeleton rows; table-body skeleton on filter; per-row revert+retry on a failed toggle; **delete-conflict → explain + offer deactivate/reassign**; top banner + Retry on fetch failure.

## Responsive Behavior

Full table (≥1024) → drop Slug/Updated to a second line (`md`) → stacked cards (<768) with name, status, product count, ⋯. Slide-over → full-screen sheet on mobile.

## Accessibility

Shared table a11y; status via text+icon; toggle/delete confirmations announced + focus-trapped; logo (when present) has meaningful alt or is decorative with empty alt beside the name. Instant focus rings.

## Keyboard Navigation

Shared model (`/`, `j/k`, `x`, `Enter`, `e`, `Esc`, `⌘K`, `?`).

## Motion

Shared restrained set; toggle cross-fade; slide-over from right; no stagger.

## Future

- **Logo upload** (Cloudinary, like product images) — adds a logo cell + preview in the editor.
- **Per-brand product counts** and "view products by this brand" → Products filtered.
- **Merge brands** (reassign products).

---

*Build order: reuse admin shell + table on the brands API → columns (name/slug/status) + inline toggle → status filter + `/` search → slide-over create/edit → guarded delete + light bulk activate/deactivate → defer logo upload / counts / merge. Keep parity with categories so the two feel identical.*
