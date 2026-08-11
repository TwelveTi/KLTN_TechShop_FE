# Table

Shared conventions, tokens, and the universal 8-state model live in [`README.md`](./README.md); this file states only Table specifics. The Table's full behavioural rationale is in the admin flagship [`../admin/products.md`](../admin/products.md) — this documents the reusable component.

# Purpose

Present dense, structured records so an admin can **scan, sort, select, and act** at any scale. The Table is the workhorse of the admin console (products, orders, customers, categories, brands, inventory) and must feel identical across all of them.

# Responsibilities

- Render rows/columns with correct semantics, alignment, and tabular numerals.
- Support sorting, selection, sticky header, per-row actions, and inline quick-edit.
- Handle its own empty / loading / error body states.
- Own **no** data fetching or business rules — it renders rows and emits events (sort, select, edit, act). This is what lets one Table serve six admin pages.

# Anatomy

`Toolbar(optional) → Header row(sortable columns, select-all) → Body(rows) → Footer(pagination/load-more)`
- **Header:** `--color-surface-sunken`, column labels, sort affordance, a select-all checkbox.
- **Row:** hairline-separated, ~52px, hover/focus background, optional leading checkbox + trailing actions.
- **Cell:** text left-aligned; **numbers right-aligned with tabular numerals**; status via [`Badge`](./badge.md); media via small thumbnails.
- **Footer:** [`Pagination`](./pagination.md) / "Load more" + a result/selection count.

# Variants

| Variant | Use |
|---|---|
| `default` | Read + row actions |
| `selectable` | Adds checkboxes + bulk selection |
| `editable` | Adds inline quick-edit cells (status/price/stock) |
| `expandable` | Rows expand (e.g., product → variants in inventory) |
| `cards` | The responsive form: each row becomes a stacked card (<768) |

# Props / Configuration

| Prop | Type | Default | Notes |
|---|---|---|---|
| `columns` | list | — | `{ id, header, align, sortable?, width?, hidden?, cell }` |
| `rows` | list | — | Data records |
| `sort` / `onSort` | object/event | — | `{ columnId, direction }`, stable secondary sort |
| `selectable` | boolean | false | Enables selection |
| `selection` / `onSelect` | set/event | — | Selected ids; supports page-vs-all-matching |
| `onRowOpen` | event | — | Row click / Enter → detail |
| `rowActions` | list | — | Trailing [`Dropdown`](./dropdown.md) `menu` items |
| `editableCells` | list | — | Which cells inline-edit (optimistic) |
| `isLoading` / `error` / `emptyState` | — | — | Body state overrides |
| `density` | enum(comfortable, compact) | comfortable | Row height |

# Sizes

Row height: `comfortable` ~52px (default) / `compact` ~40px (via density menu). Header + cells use `--text-body-sm`; numeric cells tabular. Column widths are content-driven with sensible min-widths (image tracks floored at 0 to prevent blowout).

# States

- **Default** — resting rows.
- **Hover** — row background `--color-surface-sunken`; row actions reveal (also on focus — never hover-only).
- **Focus** — instant ring on the focused row/cell; sortable headers show focus.
- **Active** — row press feedback; selected rows use `--color-primary-soft`.
- **Disabled** — non-actionable rows are muted; a disabled inline cell can't enter edit.
- **Loading** — body shows shape-matched skeleton rows; toolbar/header stay interactive; refinement loads body-only (don't blank controls). `aria-busy`.
- **Empty** — full-width body empty state (icon · title · guidance · action); distinguishes "no data" from "no results (filtered/search)".
- **Error** — full-width body banner (`role="alert"`) + Retry; per-row inline error on a failed inline-edit (revert the cell to its true value).

# Accessibility

Real `<table>` with `<th scope>`; sortable headers expose `aria-sort`; select-all and row checkboxes are labelled; **selection count + result count live in `aria-live`**. Row actions are real buttons named for the row ("Edit AeroBook Pro 14"), keyboard-reachable and not hover-only. Status conveyed via Badge text+icon. Sticky header keeps column meaning anchored.

# Keyboard Behavior

`j`/`k` move row focus; `x` toggles selection; `Shift`+`j/k` extend a range; `Enter` opens the focused row; `e` edits; `Esc` clears selection / exits an inline edit; `⌘/Ctrl+A` selects all **on the page** (with an explicit "select all matching" affordance). Sortable headers sort via `Enter`/`Space`. (Matches the shared admin keyboard model.)

# Responsive Rules

≥1024: full table. `md`: drop low-priority columns into a secondary row line or the detail. <768: **`cards` variant** — each row a stacked card (thumb + identity + key figures + status Badge + a ⋯ [`Dropdown`](./dropdown.md)); selection via a "Select" mode. Any retained table scrolls inside its own container — the page never scrolls sideways.

# Motion

Row hover background shift; sort/filter body cross-fade (signals "results changed"); row removal collapses out + [`Toast`](./toast.md) Undo; inline-edit cell cross-fades to the new value (no odometer). Skeleton shimmer, static under reduced motion. No per-row stagger on load.

# Design Rules

- **One Table** serves every admin list; pages configure columns/actions, not behaviour.
- Numbers are **always** tabular and right-aligned; status is a Badge, never raw coloured text.
- Row is clickable to open **and** the identity cell is a semantic link (speed + keyboard/right-click).
- Bulk scope is explicit (page vs all-matching) to prevent accidental mass actions; irreversible bulk actions require typed confirmation.
- Inline quick-edit is optimistic with exact revert on failure.

# Do's

- Do reveal row actions on hover **and** focus.
- Do keep the toolbar/header interactive during body loading.
- Do report per-item results for bulk/partial failures.

# Don'ts

- Don't convey status by row-tint colour alone.
- Don't silently select all-matching when the header checkbox is used.
- Don't leave a wrong value on a failed inline-edit — revert exactly.
- Don't nest ambiguous interactive controls (row-open vs action click must be distinct — action clicks stop propagation).

# Usage Examples

- **Products / Orders / Customers / Categories / Brands / Inventory** admin lists ([`../admin/products.md`](../admin/products.md) and siblings) — same component, different `columns`/`rowActions`.
- **Analytics** underlying data table (read-only, sortable, exportable) in [`../admin/analytics.md`](../admin/analytics.md).

# Future Extensions

- **Saved views** (column set + sort + filters) and **column reordering/resizing**.
- **Row virtualization** for very large sets.
- **Grouped/tree rows** (category hierarchy) with expanders.
- **CSV export** as a first-class Table action.
