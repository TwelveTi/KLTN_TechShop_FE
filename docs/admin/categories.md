# Admin · Categories — Page Design Spec

**Governed by [`design-system.md`](../design-system.md).** **Reuses the admin shell, table, filter/search, bulk, keyboard, and motion from [`products.md`](./products.md).** **Reference feel:** Stripe/GitHub settings-style reference tables — quiet, quick. Markdown only.
**Route:** `/admin/categories`. **Access:** ADMIN only. **Backend status:** maps to the **existing categories CRUD** (name, slug, isActive). Category **hierarchy/nesting** is future (the model is flat today).

---

## Goals

Let an admin **maintain the category taxonomy** — add, rename, activate/deactivate — quickly, because categories are small, low-churn reference data that everything else (products, storefront nav, filters) depends on. **Why treat it as lightweight:** categories number in the dozens, not thousands; the design optimizes for fast in-place edits over heavy tooling.

## User Tasks

Add a category · rename / edit description · toggle active · deactivate/delete unused · find one · (future) reorder / nest.

## Layout

Shared admin shell + table, with a **"New category"** button in the topbar. Because the set is small, **create/edit is a right slide-over** (name, description, slug (auto from name, editable), active toggle, parent *(future)*) — no full page needed. **Why a slide-over:** the form is tiny; keeping the list visible behind it makes add/edit a fast, repeatable loop.

## Table Design

| Column | Content | Notes |
|---|---|---|
| ☐ | select | bulk |
| Name | category name (link) | edit on click |
| Slug | url slug | mono; the storefront path |
| Products | count in this category *(future)* | **right, tabular** |
| Status | pill: Active · Inactive | semantic |
| Updated | relative | sortable |
| ⋯ | edit · activate/deactivate · delete* | reveal on focus/hover |

**Inline toggle** for Active/Inactive. **Why:** the most common category action is turning one on/off for the storefront; inline beats a modal. **Slug shown in mono** because it's a technical identifier (matches the storefront route) — showing it prevents surprise when a rename would change the URL.

## Filters

**Status** (Active / Inactive). That's the only axis that matters for a small taxonomy. URL-encoded.

## Search

Shared `/` search over **name** (and slug). Instant. **Why:** even a modest list is faster to filter than to scan once it passes ~20 items.

## Bulk Actions

Multi-select → **activate / deactivate**, **delete** (guarded). **Delete is blocked when a category has products** — offer *deactivate* instead, or reassign products first. **Why guard:** deleting a category out from under live products would orphan them; deactivate hides it from the storefront without breaking references.

## Empty States

| Situation | Title · guidance · action |
|---|---|
| No categories | "No categories yet" · "Add categories to organize your catalog." · New category |
| No results | "No categories match" · "Try clearing the search or status filter." · Clear |

## Loading / Errors

Shared: skeleton rows; table-body skeleton on filter; per-row revert+retry on a failed toggle; **delete-conflict → explain + offer deactivate/reassign**. Top banner + Retry on fetch failure.

## Responsive Behavior

Full table (≥1024) → drop Slug/Updated into a second line (`md`) → stacked cards (<768) with name, status pill, product count, ⋯ menu. Slide-over → full-screen sheet on mobile.

## Accessibility

Shared table a11y; status via text+icon; toggle + delete confirmations announced/focus-trapped; slug is readable, associated text (not decorative). Instant focus rings.

## Keyboard Navigation

Shared model (`/`, `j/k`, `x`, `Enter`, `e`, `Esc`, `⌘K`, `?`).

## Motion

Shared restrained set; toggle cross-fade; slide-over from right; no stagger.

## Future

- **Hierarchy / nesting** (parent categories) with drag-reorder — needs a tree model in the backend; the table would gain an indent/expander column.
- **Per-category product counts** (needs the join) and quick "view products in this category" → Products filtered.
- **Merge categories** (reassign products) as a first-class action.

---

*Build order: reuse admin shell + table on the categories API → columns (name/slug/status) + inline active toggle → status filter + `/` search → slide-over create/edit (name/description/slug/active) → guarded delete (block-if-has-products → deactivate) + light bulk activate/deactivate → defer hierarchy/counts/merge.*
