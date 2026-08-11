# Admin · Analytics — Page Design Spec

**Governed by [`design-system.md`](../design-system.md)** (data-viz guidance: accessible charts, semantic color ≠ accent, care not decoration). **Reuses the admin shell, keyboard, and motion from [`products.md`](./products.md).** **Reference feel:** Stripe *Sightseer/Analytics*, Vercel Analytics. Markdown only.
**Route:** `/admin/analytics`. **Access:** ADMIN only.
**Backend status:** built today from **revenue summary, daily revenue, and top products**. Deeper cuts (by category/brand, conversion, AOV, cohorts, funnels) are **future** and gated — never fabricated.

**Section note:** analytics is charts + a supporting data table, not a CRUD list — so **Bulk Actions → N/A**, **Search → light**, and **Table Design → the underlying report table**. Each says why.

---

## Goals

Let an admin **understand trends and answer "why/how much" questions** more deeply than the dashboard's glance — over chosen periods, broken down by dimension, with the numbers behind the charts available and exportable. **Why separate from the dashboard:** the dashboard answers "is it healthy *now*" in one screen; analytics is where you *interrogate* — change the range, switch the dimension, read the underlying rows. Merging them would make the dashboard heavy and the analysis shallow.

## User Tasks

Pick a period · compare to a previous period *(future)* · see revenue/orders over time · break down by category/brand *(future)* · read the underlying numbers · export a report.

## Layout

Shared admin shell. Content = a **controls row** (date range · granularity · dimension · export) over a **chart grid**, with an **underlying data table** beneath the primary chart:

```
Topbar: Analytics                                   [ range 30d ▾ ]  ⟳ 👤
[ Range: last 30 days ] [ Granularity: day ] [ Dimension: — ]      [ Export ]
┌──────────────────────────────┐┌────────────────────┐
│ Revenue over time (area)      ││ Orders over time   │
└──────────────────────────────┘└────────────────────┘
┌───────────────────────────────────────────────────┐
│ Underlying data (date · revenue · orders · AOV)    │  ← the numbers behind the chart
└───────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────┐
│ Top products (revenue / qty)                       │
└───────────────────────────────────────────────────┘
```

**Why chart-then-table:** the chart gives shape; the table gives exact values and export. Showing both respects the two ways people use analytics (spot the trend, then quote the number).

## Table Design → underlying report table

A real, **sortable** table of the series behind the primary chart (e.g., date · revenue · orders · AOV), tabular numerals, right-aligned figures, exportable to CSV. **Why a table under the chart:** charts hide precise values; analysts need the exact figure and a copy/export path. Sorting lets them find the peak/trough day fast. No row selection/bulk — these are read-only facts.

## Filters

- **Date range** (7 / 30 / 90 / custom) — the primary control.
- **Granularity** (day / week / month) — matched sensibly to the range.
- **Dimension breakdown** (overall · by category · by brand) *(future — needs the join)*.
- **Compare to previous period** *(future)*.

All URL-encoded so a specific analysis is shareable/bookmarkable. **Why range+granularity are the core:** almost every analytics question is "over this period, at this resolution"; the rest are enhancements layered on that spine.

## Search

**Light / mostly N/A** — analytics isn't a searchable record set. The topbar `/`+⌘K remain for navigation. (A future dimension breakdown could gain an in-table filter.) Stated so no product-search box is bolted on.

## Bulk Actions

**N/A** — the tables are read-only facts, not editable records. Stated explicitly.

## Empty States

| Situation | Behavior |
|---|---|
| No data in range | Labeled empty chart + empty table ("No activity in this range"); controls stay usable |
| New store (no sales) | Honest zeros / empty series — never invented trends |
| Future dimension not yet available | The breakdown control shows a "coming soon" state, not fake segments |

**Why honest empties:** analytics that invents a trend is worse than useless — it's misleading. Empty is a valid, truthful answer.

## Loading

Per-chart and per-table **skeletons**; changing range/granularity re-fetches with a skeleton over the affected widgets only (controls stay live); prior values may persist under a pending state on a refresh. `aria-busy`; thresholds per the design system. **Why widget-scoped:** the operator keeps their controls and context while a single chart refreshes.

## Errors

Per-widget error + Retry (one failed series doesn't blank the page); export failure surfaced with retry; a top banner only if the whole fetch fails. **Why isolate:** partial data is still useful; don't discard a working revenue chart because the orders series failed.

## Responsive Behavior

Sidebar → drawer under `md`. Chart grid stacks to one column; the underlying table scrolls inside its own container (never the page); charts simplify axis labels on small screens. Controls wrap/stack. **Why:** a manager reviewing trends on a phone gets a readable vertical stack, not a squeezed grid.

## Accessibility

**The central obligation:** charts are **not image-only**. Every chart has a text summary and its **underlying data table is the accessible representation** (already on the page — a double win). Series use non-color encodings (labels, direct labels, patterns) in addition to color; contrast ≥3:1 for lines/fills. Controls (range/granularity/dimension/export) are labeled and keyboard-operable with instant focus rings. Value changes announce via `aria-live`. **Why this is the make-or-break:** to a screen-reader user a chart is an empty image unless the numbers are exposed — the on-page data table makes the whole analysis perceivable.

## Keyboard Navigation

Shared model for nav (`/`, `⌘K`, `?`); the controls (range/granularity/dimension/export) are tabbable and operable; the data table supports header-sort via keyboard. No row selection. **Why lighter:** analytics is read and adjusted, not operated row-by-row.

## Motion

One **draw-in per chart on load/refresh** (`transform`/`opacity`, `--ease-out`), never looping; value/label updates cross-fade; **no odometers, no ambient motion**. Reduced motion → static. **Why minimal:** analysis requires reading precise values; motion that animates numbers or lingers actively impedes the task.

## Future

- **Dimension breakdowns** (category/brand/customer segment), **period comparison**, **AOV/conversion/refund-rate** metrics.
- **Cohorts / retention / funnels** once event data exists.
- **Scheduled email reports** and **saved analyses**.
- **Drill-through** from a chart point into the matching orders/products.

---

*Build order (on today's revenue/top-products data): reuse admin shell → range + granularity controls (URL-encoded) → revenue & orders time-series charts (accessible: text summary + on-page data table) → sortable underlying data table + CSV export → top-products widget → per-widget skeleton/error isolation → gate dimension breakdowns, comparison, and advanced metrics behind their data. Never fabricate a trend.*
