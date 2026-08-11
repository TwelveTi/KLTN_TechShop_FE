# Admin · Dashboard — Page Design Spec

**Governed by [`design-system.md`](../design-system.md)** (*"When it's a UI, not a document"* — summary before detail, semantic color ≠ accent, charts built with care). **Reference feel:** Stripe Dashboard / Vercel / Linear overview screens — a calm, glanceable read of store health. Markdown only.
**Route:** `/admin` (the console landing). **Access:** ADMIN only.
**Supersedes** the earlier root-level `admin-dashboard-spec.md` (that file can be retired — see the note at the end of this batch).

**Section note:** this is an *overview*, not a data table, so the table-shaped headings below are adapted honestly — **Table Design → data presentation (KPIs/charts/lists)**, **Bulk Actions → N/A**, etc. Each says why.

---

## Goals

Give an admin, in one glance on landing, the answer to *"is the store healthy right now?"* — revenue, order fulfilment, what's selling, catalog size — and a fast route to act. **Why an overview first:** the console's landing sets the operator's mental model; leading with a summary (not a table) is the Stripe/Vercel pattern that lets someone triage in seconds before diving into a section.

**Honesty rule:** every figure is real backend data. A new store shows **real zeros and empty charts**, never invented activity (the "invented metrics" anti-pattern).

---

## User Tasks

| Task | How the page serves it |
|---|---|
| Read store health at a glance | KPI row (revenue, paid orders, counts) — biggest type on the page |
| Understand fulfilment | Order-status ring + list (delivered rate as a *shape*) |
| See what's selling | Top-products list (revenue/qty) |
| Check "how are we doing lately" | Revenue trend chart + date-range control |
| Refresh to latest | Explicit Refresh (snapshot data) |
| Jump somewhere to act | Sidebar + clickable widgets → the relevant section |

---

## Layout

Uses the shared **admin shell** defined in [`products.md`](./products.md) (sidebar + sticky topbar). Content is a **widget grid**, summary → detail top to bottom:

```
Topbar: Dashboard            [/ search]           [range 30d ▾] ⟳ 👤
┌────────┐┌────────┐┌────────┐┌────────┐        ← KPI row (4-up): Revenue · Paid orders · Products · Customers
│Revenue ││Orders  ││Products││Customers│
│ $1.2M  ││  340   ││  860   ││ 1,240  │
└────────┘└────────┘└────────┘└────────┘
┌───────────────────────────┐┌────────────────────┐   ← trend chart (wide) + order-health ring
│ Sales performance   [30d]  ││ Order health   72% │
│ (line/area chart)          ││ (ring + status list)│
└───────────────────────────┘└────────────────────┘
┌────────────────────────────────────────────────┐   ← top products list
│ Top products   AeroBook 14 — 120 sold · $149,880│
└────────────────────────────────────────────────┘
```

- **KPI row first**, then charts, then lists — strictly summary→detail. **Why:** the operator's first question is "the numbers," answered before any chart demands interpretation.
- Widgets are **clickable to their section** (Orders KPI → Orders; a top product → its editor). **Why:** an overview should be a launchpad, not a dead read.

---

## Table Design → Data presentation

No primary data table here; the equivalents are:
- **KPI MetricCards** — label · big **tabular** value · helper line; semantic tone used sparingly (a KPI isn't "good/bad" by default). **Why big+tabular:** the headline numbers must read first and align.
- **Revenue chart** — line/area with an area fill, faint grid, emphasized endpoint (design-system data-viz care), plus a date-range control. **Why care, not decoration:** a trend the eye can read in a glance is the point.
- **Order-health ring** + status list — fulfilment state as a *shape* before a digit; semantic status colors (separate from the accent), each status labeled with its count.
- **Top-products list** — a compact ranked list (tabular qty/revenue), capped (top 5–10) with "View all → Products". **Why capped + link:** a dashboard summarizes; the full list lives in Products.

---

## Filters

**The date-range control** (7 / 30 / 90 days) is the dashboard's one genuine filter — it scopes the revenue trend (and revenue KPI). **Why only a range:** the real analytical question on an overview is "over what period," not faceting; more filtering belongs in [`analytics.md`](./analytics.md). Reflected in the URL so a range is shareable.

## Search

No in-page search (nothing to search on an overview). The topbar **global search / ⌘K palette** (shared shell) is present for navigation. **Why none here:** a dashboard is read, not queried; adding a search box would imply a dataset that isn't on this page.

## Bulk Actions

**N/A** — there are no selectable rows on an overview. Stated so none are added.

---

## Empty States

| Block | Empty condition | Behavior |
|---|---|---|
| KPI cards | No sales/customers yet | Real **0** with the normal label — honest, not faked |
| Revenue chart | No data in range | Labeled empty chart ("No revenue in this range yet"); range control still usable |
| Order health | No orders | "No orders yet" in place of the ring |
| Top products | No sales | "Top products will appear once orders come in" |

**Why honest zeros:** faking activity on a new store is both dishonest and the exact anti-pattern the design system forbids; a clean zero state also reassures the admin the dashboard is *working*, not broken.

## Loading

Per-widget **skeletons** (KPI card blocks, chart-area block, ring block, list rows), loading in parallel so each resolves independently. **Refresh** keeps the previous values visible under a pending state rather than blanking to skeletons. **Why keep prior values on refresh:** the admin was just reading them; a refresh should feel like an update, not a reload. `aria-busy`; delayed-show thresholds per the design system.

## Errors

Per-widget error isolation: if one endpoint fails, that widget shows an inline error + Retry while the others render. A total failure shows a top banner + Retry with the shell intact. **Why per-widget:** the dashboard aggregates several endpoints; one flaky metric must not blind the admin to the rest.

---

## Responsive Behavior

Sidebar → drawer under `md`. KPI row 4-up → 2×2 → 1–2-up. Chart + ring side-by-side → stacked. Charts simplify (fewer axis labels) on small screens. **Why degrade, not break:** a manager checking revenue from a phone should still get the KPIs and health as a readable stack.

## Accessibility

Landmarks + one `h1` ("Dashboard"). **Charts are not image-only:** the ring exposes "72% delivered" as text, the status list gives every status a labeled number, and the trend offers an accessible summary / associated data table. Color is never the only encoding. KPI values are real text (tabular). Refresh + range are labeled, keyboard-operable, with **instant** focus rings (the current admin lacks these). Reduced motion honored. **Why chart text-alternatives matter:** a ring/line is meaningless to a screen reader — the number and the labeled list are what make the dashboard perceivable.

## Keyboard Navigation

Inherits the shared model ([`products.md`](./products.md)): `/` and `⌘K` for search/palette, sidebar reachable, range/refresh operable, `?` help. No row navigation (no table). **Why lighter here:** an overview is read, not operated row-by-row.

## Motion

One optional **chart draw-in on first load** (line/area animates once; ring fill once), `transform`/`opacity`, `--ease-out`; **no looping/ambient motion**, no bouncing counters, no per-card stagger. Refresh cross-fades values (no odometer). Reduced motion → static. **Why almost none:** a dashboard is watched; constant motion competes with reading the numbers. A single load animation aids comprehension of the trend and then gets out of the way.

---

*Build order: reuse the AdminShell (with focus states + guard) → MetricCard KPI row (real counts/revenue, honest zeros) → RevenueChart (accessible: text alt + data table) with the range control → StatusRing + status list (semantic colors, lifecycle order) → TopProductsList (capped, "view all" → Products) → Refresh with keep-prior-values loading + per-widget error isolation.*
