# Admin · Inventory — Page Design Spec

**Governed by [`design-system.md`](../design-system.md).** **Reuses the admin shell, table, filter/search, bulk, keyboard, and motion from [`products.md`](./products.md).** **Reference feel:** Linear/Stripe operational lists — triage-first. Markdown only.
**Route:** `/admin/inventory`. **Access:** ADMIN only.
**Backend status:** there's **no dedicated inventory module**; this page is **derived from product & variant `stockQuantity`**. Stock **adjustments** write back to the product/variant. Low-stock **thresholds** and stock-movement **history** are future (need new backend fields/endpoints) and gated.

---

## Goals

Answer one operational question fast — **"what's running out?"** — and let the admin **fix stock levels in place**. Inventory is a triage surface: the default view surfaces problems (low/out), and the primary action is a quick quantity adjustment. **Why a separate page from Products:** Products is about the catalog record (name, price, media); Inventory is about a single number under time pressure. Splitting them lets Inventory default to a stock-triage sort/filter that Products shouldn't, and gives warehouse-minded users a focused tool — the same reason Stripe separates *Products* from *Balances*.

## User Tasks

| Task | How served |
|---|---|
| See what's low or out | **Default view = low & out first**; stock-level filter |
| Adjust a stock count | Inline stock edit (optimistic) — the core action |
| Find an item | `/` search by name/SKU |
| Handle variants | Rows expand to per-variant stock |
| Restock in bulk | Multi-select → bulk adjust *(future)* / export |
| Understand a change | Stock-movement history *(future)* |

## Layout

Shared admin shell + table. **No "New" button** (inventory items are products/variants created in Products). The context row defaults to a **stock-level tab set** (All · In stock · Low · Out) with **Low & Out surfaced first** by default sort. **Why default to problems:** the whole value of an inventory view is landing on what needs action; a plain alphabetical list would bury the two rows that matter.

## Table Design

| Column | Content | Notes |
|---|---|---|
| ☐ | select | bulk |
| Item | product (or product · variant) name + SKU | variants expandable |
| Category / Brand | (compact) | context for triage |
| Stock | current `stockQuantity` — **inline-editable** | **right, tabular** |
| Threshold | low-stock threshold *(future)* | **right, tabular** |
| Status | pill: In stock · Low · Out of stock | semantic; the triage signal |
| Updated | relative | sortable |
| ⋯ | adjust stock · open in Products · history* | reveal |

- **Inline stock edit is the marquee interaction:** click the Stock cell → type/step the new count → **optimistic** write-back. **Why inline + optimistic:** adjusting a count is the entire job; anything more than "click, type, done" is friction repeated hundreds of times.
- **Variant rows:** a product with variants expands to per-variant stock (each independently adjustable), because stock lives at the variant level. **Why expandable, not separate rows always:** keeps the list scannable at the product level, drills in only when needed.
- **Status derives from stock vs threshold** (Out = 0, Low = ≤ threshold, else In stock) with color+icon. **Why derived + glanceable:** the operator scans the Status column to triage, then edits the Stock cell to fix.

## Filters

**Stock level** (In stock / Low / Out), **Category**, **Brand**. URL-encoded. **Why stock-level leads:** it's the triage axis; category/brand scope a restock pass to one area.

## Search

Shared `/` search over **name and SKU**, instant, composes with filters. **Why SKU matters here:** warehouse staff often work from the SKU on the shelf/label.

## Bulk Actions

Multi-select → **export** (a restock report), and **bulk stock adjustment** *(future)* (set/increment a batch). **No delete** (you don't delete inventory rows — you deactivate the product in Products). Optimistic + Undo on bulk adjust. **Why export now, bulk-adjust later:** export is trivially useful for a restock run today; safe bulk quantity writes need the backend endpoint and careful confirmation.

## Empty States

| Situation | Title · guidance · action |
|---|---|
| No products/stock tracked | "Nothing to track yet" · "Add products to manage their stock." · Go to Products |
| No low/out items (filtered to Low/Out) | "You're fully stocked" · "No items are low or out right now." · — (a *good* empty state) |
| No results (search) | "No item matches '{q}'" · "Search by name or SKU." · Clear |

**Why celebrate the "no low/out" empty state:** here, empty is *success* — the operator wants to see "nothing needs restocking." The copy affirms that rather than reading as a void.

## Loading / Errors

Shared patterns: skeleton rows; table-body skeleton on filter; **inline stock-edit failure reverts the cell to its true value and shows a per-row error** (a wrong stock number is worse than no change — the revert must be exact); top banner + Retry on fetch failure. Optimistic bulk adjust reports per-item results.

## Responsive Behavior

Full table (≥1024) → drop Category/Brand/Updated to a second line (`md`) → stacked cards (<768): item + SKU, big stock number (editable), status pill, ⋯. Inline edit falls back to a small sheet on touch.

## Accessibility

Shared table a11y. Status conveys via text+icon (never color-only — critical when the whole page is a red/amber/green triage). Stock edit is a labeled numeric control; adjustments announce the new value (`aria-live`). Variant expansion is a proper disclosure. Instant focus rings.

## Keyboard Navigation

Shared model plus stock-focused accelerators: `j/k` to move, `Enter`/`e` to edit the focused row's stock, type-to-set, `Esc` to cancel. **Why:** a restock pass down a low-stock list should be all-keyboard — arrow, edit, type, next.

## Motion

Shared restrained set; stock-cell cross-fade to the new value on save; status pill updates when a change crosses a threshold; reduced motion honored. No celebration. **Why:** confirmation must be instant and unmistakable (the number changed, the status may have flipped) without theatrics.

## Future

- **Low-stock thresholds** (per product/variant) driving the Low status and alerts.
- **Stock-movement history** (who changed what, when, why) — an audit trail per item.
- **Bulk stock adjustments** and **CSV import** for restock runs.
- **Low-stock alerts/notifications** and a dashboard widget.

---

*Build order (derived on today's stock fields): reuse admin shell + table → stock-triage columns with inline-editable Stock and derived Status → stock-level tabs + category/brand filters + `/`+SKU search → variant expansion with per-variant edit → export + (later) bulk adjust → exact revert on failed edit → defer thresholds/history/import. Default the view to Low & Out first.*
