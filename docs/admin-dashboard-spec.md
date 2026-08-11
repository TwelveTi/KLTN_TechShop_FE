# TechShop Admin Dashboard — Design Specification

**Status:** Implementation-ready · **Version:** 1.0 · **Last updated:** 2026-08-07
**Governed by:** [`design-system.md`](./design-system.md) — especially its *"When it's a UI, not a document"* guidance (information design: summary before detail, state in form, semantic color, charts with care).
**Route:** `/admin` (dashboard is the default section of the admin console). Access: **ADMIN role only.**

**Scope note.** The admin console also hosts CRUD sections (Products, Categories, Brands, Users) and planned-module cards. This document specifies the **Dashboard** — the analytics/overview *landing* — and the **admin shell** (sidebar + topbar) it lives in. The CRUD management sections are separate specs (future). Every token/component resolves to the design system; every decision states its reasoning.

**Design-system reconciliation.** The current admin CSS uses ~121 hardcoded hex values and has **no focus states** (both audit-flagged). This spec mandates the unified tokens and full focus/keyboard support — the dashboard is data-dense and admins are frequent keyboard users, so this is not optional.

---

## Table of contents

Purpose · Target Users · Primary User Goals · Information Architecture · Desktop Layout · Tablet Layout · Mobile Layout · Visual Hierarchy · Components Used · User Flow · Empty States · Loading States · Error States · Search & Filtering Behavior · Sorting Behavior · Pagination / Infinite Scroll · Accessibility · Responsive Rules · Motion · Edge Cases · Future Improvements

---

## Purpose

Give an administrator an **at-a-glance read of the store's health** the moment they land, and fast routes to act. The dashboard answers, in order: *How much money? How many orders, and in what states? What's selling? How big is the catalog/customer base?* — then points to the management sections to do something about it.

The governing rule (from the design system): **summary before detail, state encoded in form.** KPIs read first as big numbers; order health reads as a shape (a ring/chart) before a table; what needs attention is visible without reading every figure.

**Honesty rule:** every number is real backend data. Zero states show **0**, not a fabricated figure; a metric with no data shows a labeled empty/zero state, never an invented "+47%".

---

## Target Users

| User | Situation | Needs most |
|---|---|---|
| **Store owner / manager** | Daily health check | Revenue, orders, order-status mix, top products — fast |
| **Operations admin** | Watching fulfilment | Order-status breakdown; a route to orders (when built) |
| **Catalog admin** | Managing inventory | Product/category/brand counts; route to management sections |
| **Any admin returning** | Wants fresh data | An obvious refresh + last-updated sense |
| **Non-admin (blocked)** | Reaches `/admin` | A clear "admin required" message, not a broken page |

The dashboard is **scanned and operated on a desktop** primarily (admin work happens on larger screens), but must remain usable and non-broken on smaller ones.

---

## Primary User Goals

1. **Read store health instantly** — revenue, paid orders, key counts.
2. **Understand order fulfilment** — the mix of order statuses and the delivered rate.
3. **See what's selling** — top products by revenue/quantity.
4. **Refresh confidently** — pull the latest data on demand.
5. **Navigate to act** — reach Products/Categories/Brands/Users management.
6. **Be gated correctly** — only admins get in; others are told why.

Goals 1–3 define the dashboard's content blocks; Goal 6 defines the access model.

---

## Information Architecture

**Admin shell** (persistent) + **dashboard content**:

```
Admin shell
├─ Sidebar        (brand · section nav: Dashboard · Products · Categories · Brands · Users · Planned · Back to shop)
├─ Topbar         (context: "Signed in as …" + section title · admin search* · Refresh · admin identity)
└─ Dashboard content
   ├─ KPI row        (Total customers · Products · Categories(+brands) · Revenue(+paid orders))
   ├─ Revenue trend  (line/area chart over recent days + a range control)
   ├─ Order health   (status ring: delivered % + status list)
   └─ Top products   (ranked list: name · sold qty · revenue)
```

**Data sources** (real): revenue summary (total revenue, total orders, order-status map), daily revenue series (chart), top products, and pagination totals for user/product counts. No URL state is required for the dashboard itself beyond the `/admin` route; an optional date-range param could make a range shareable (future).

**Access control:** `/admin` requires an authenticated **ADMIN**. Non-admins see an "admin role required" state; unauthenticated users see "sign in with an admin account." A session-restoring state precedes both so a real admin isn't wrongly rejected mid-refresh.

---

## Desktop Layout

**≥ 1024px (`lg`+).** The admin shell: a fixed **left sidebar** + a **main region** (sticky topbar over scrolling content).

```
┌──────────┬──────────────────────────────────────────────────────────────┐
│ SIDEBAR  │  Signed in as admin@techshop           [search*] [Refresh] 👤 │  ← topbar (sticky)
│ TechShop │  Dashboard                                                     │
│ Admin    │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                  │
│          │  │Customers│ │Products│ │Categories│ │Revenue │   ← KPI row     │
│ ▸Dashboard│  │  1,240 │ │   860  │ │  24 · 40 │ │ $1.2M  │                  │
│  Products │  └────────┘ └────────┘ └────────┘ └────────┘                  │
│  Categories│ ┌──────────────────────────────┐ ┌────────────────────────┐ │
│  Brands   │  │ Sales performance   [30d ▾]  │ │ Order health           │ │
│  Users    │  │   (line/area chart)          │ │   (ring)  72% delivered │ │
│  Planned  │  │                              │ │   pending 40 · shipped… │ │
│          │  └──────────────────────────────┘ └────────────────────────┘ │
│ Back to   │  ┌──────────────────────────────────────────────────────────┐ │
│  shop     │  │ Top products   AeroBook 14 — 120 sold · $149,880 …        │ │
│          │  └──────────────────────────────────────────────────────────┘ │
└──────────┴──────────────────────────────────────────────────────────────┘
```

- **Sidebar** ~240px, `--color-surface` (admin may use a darker surface variant), the active section marked with `--color-primary`; brand lockup at top; "Back to shop" at the bottom.
- **Topbar** sticky at `--z-sticky`: context line + section title, an admin search*, a **Refresh** button (with loading state), and the admin identity chip.
- **KPI row:** 4 metric cards, equal by default but each is a *tile* (label · big value (tabular) · helper line). Semantic tones are used sparingly and are **not the accent** (a KPI isn't "good/bad" by default).
- **Revenue trend:** a line/area chart card with a **range control** (e.g., 7/30/90 days). The chart follows the design-system data-viz guidance: area fill, faint grid, emphasized endpoint, accessible.
- **Order health:** a status ring (delivered %) + a status list (pending/processing/shipping/delivered/…); semantic colors distinguish states, separate from the brand accent.
- **Top products:** a compact ranked list (or small table) with tabular quantities/revenue.

---

## Tablet Layout

**768–1023px (`md`).** The **sidebar collapses to a drawer** (toggle in the topbar), per the design-system admin shell. KPI cards go 2×2; the revenue chart and order-health stack (chart full-width above the ring); top products full-width. **Reasoning:** at this width a fixed sidebar starves the data; a drawer keeps navigation available while the dashboard uses the full width.

## Mobile Layout

**< 768px (`xs`–`sm`).** Single column, sidebar as a drawer. Order: KPI cards stacked (1-up, or 2-up if compact) → revenue chart (full-width, simplified) → order-health ring + list → top products. The topbar condenses (title + drawer toggle + refresh + identity menu). **Reasoning:** admin work is desktop-first, but a manager checking revenue from a phone must still get the KPIs and health at a glance; the dashboard degrades to a readable stack rather than breaking.

---

## Visual Hierarchy

1. **KPI values** — the biggest type on the page (large, tabular); the labels/helpers are muted. The store's headline numbers read first.
2. **Order-health shape** — the delivered-rate ring communicates fulfilment state *as a shape* before any digit.
3. **Revenue trend** — the chart's line + emphasized endpoint show direction at a glance.
4. **Top products** — ranked, scannable; revenue/qty tabular.
5. **Section title + refresh** — orient and act; quiet.
6. **Sidebar nav** — structural; active state clear.

**Applied rules:** summary before detail (KPIs → charts → lists); **semantic color (good/warning/critical) is separate from the accent** and used only for state (e.g., order statuses, a down-trend); numbers tabular everywhere; charts get real care (fill, faint grid, endpoint) not decoration; no gradients-as-decoration. **Reasoning:** a dashboard's job is to make the important legible in one glance — big KPIs, a status shape, a trend line — and to reserve color for meaning, so an admin can triage without reading every figure.

---

## Components Used

| Area | Components |
|---|---|
| Shell | **AdminShell** *(new: sidebar + main)* · **AdminSidebar** *(section nav)* · **AdminTopbar** *(context · search* · Refresh · identity)* |
| KPIs | **MetricCard** *(new: label · value(tabular) · helper · optional semantic tone)* |
| Charts | **RevenueChart** *(new: line/area, range control, accessible)* · **StatusRing** *(new: delivered %)* · status list |
| Lists | **TopProductsList** *(new)* or a compact Table (design-system table patterns) |
| Controls | Range Select (7/30/90d) · Button (Refresh, loading state) |
| Access | **AdminGuard** states *(admin-required · sign-in-required · restoring)* |
| Feedback | Skeleton · Alert (error) · zero/empty states |

**Reasoning:** the shell (sidebar/topbar) and the data-viz pieces (MetricCard, RevenueChart, StatusRing) are the reusable core of the whole admin console — every future management section sits inside AdminShell. Charts are built with care per the dataviz guidance, not dropped in as decoration.

---

## User Flow

```
Admin → /admin
  ├─ (session restoring) → restoring state
  ├─ not signed in → "Sign in with an admin account"
  ├─ signed in, non-admin → "Admin role required (you're signed in as {role})" + Back to shop
  └─ signed in ADMIN → Dashboard loads (KPIs + chart + ring + top products in parallel)
        ├─ change range (7/30/90d) → revenue chart updates
        ├─ Refresh → re-fetch all dashboard data (button shows loading)
        └─ sidebar → navigate to Products/Categories/Brands/Users management (separate specs)
```

**Detailed reasoning:**
- **Three access states are distinct** (restoring / not-signed-in / signed-in-non-admin) — collapsing them would either reject a real admin mid-restore or fail to tell a non-admin why they're blocked.
- **Refresh is explicit** because dashboard data is a snapshot; an admin wants control over when it re-pulls, and the button's loading state confirms the action (the existing code already has this).
- **The dashboard is a launchpad** — its deepest interactions (edit a product, fulfil an order) live in the management sections it links to.

---

## Empty States

| Block | Zero/empty condition | Behavior |
|---|---|---|
| KPI cards | No sales/customers yet | Show **0** with the normal label/helper — a real zero, clearly, never a fake number. |
| Revenue chart | No revenue data | A labeled empty chart ("No revenue in this range yet") with the range control still usable. |
| Order health | No orders | "No orders yet" in place of the ring; status list omitted/zeroed. |
| Top products | No sales | "No sales data yet — top products will appear once orders come in." |

**Reasoning:** a brand-new store legitimately has zeros; the dashboard must render that honestly and calmly (real 0s + empty charts), because faking activity is both dishonest and the exact "invented metrics" anti-pattern.

---

## Loading States

- **First load:** skeletons for each block — KPI card skeletons, a chart-area skeleton, a ring skeleton, and top-product row skeletons. Blocks load in parallel; each resolves independently.
- **Refresh:** the Refresh button enters a loading state ("Refreshing…"); blocks show a subtle in-place pending state rather than blanking (keep the prior numbers visible until the new ones arrive, so the admin isn't staring at empty cards).
- **Range change:** only the revenue chart shows a pending state; KPIs/ring/top-products are unaffected.
- Timing per design system; loading regions `aria-busy`.

**Reasoning:** on refresh, keeping the previous values visible under a pending state (rather than blanking to skeletons) respects that the admin was just reading them — the update should feel like a refresh, not a reload.

---

## Error States

- **Dashboard data fetch fails:** an inline Alert (`role="alert"`) at the top of the content — "Couldn't load dashboard data." — with **Retry** (re-runs the parallel fetch). The shell (sidebar/topbar) stays so the admin can navigate elsewhere.
- **Partial failure:** if one block's data fails but others succeed, show the error **in that block only** (e.g., the chart shows a retry while KPIs render) — never fail the whole dashboard for one endpoint.
- **Stale data after a failed refresh:** keep the last-good values, surface the refresh error, don't wipe the numbers.
- **Access errors:** the guard states (below) rather than generic errors.

**Reasoning:** an admin dashboard aggregates several endpoints; per-block failure isolation means one flaky metric doesn't blind the admin to everything else.

---

## Search & Filtering Behavior

- **Dashboard filtering = the date-range control** on the revenue trend (7/30/90 days, or a custom range as a future add). This is the dashboard's one genuine "filter," and it scopes the trend chart (and could scope revenue KPIs) to the period. **Reasoning:** "how are we doing lately vs. this month vs. this quarter" is the real analytical question; a range control answers it.
- **Admin topbar search** is scoped to **admin data** (jump to a product/user/category) — currently non-functional in the code; this spec defines it as a **global admin quick-find** (type → matching products/users/categories → go to that record). Until wired, it should be hidden rather than shown as a dead field. It is *not* a catalog/customer-facing search.
- No other faceted filtering on the dashboard (that lives in the management sections' tables).

## Sorting Behavior

- **Top products** are sorted by the metric that defines "top" — **revenue by default**, with an optional toggle to **quantity sold**. A stable secondary sort keeps ties deterministic.
- **Order-status list** follows the fulfilment lifecycle order (pending → processing → shipping → delivered → cancelled/refunded), not alphabetical — the order carries meaning.
- KPIs and the chart aren't sortable (single values / a time series).

**Reasoning:** the only meaningful sort is "top by what?" (revenue vs. quantity); the status list's lifecycle order is information, so it's fixed, not alphabetized.

---

## Pagination / Infinite Scroll

**None on the dashboard.** It's an overview: KPIs are single values, the chart is a bounded series, and **top products is a capped list** (e.g., top 5–10, with a "View all products" link to the management section rather than paginating here). **Reasoning:** a dashboard summarizes; paginating an overview would defeat its purpose. Long lists belong in the management sections' tables (which paginate — their own spec).

---

## Accessibility

- **Structure:** the shell has landmarks (`nav` sidebar with an accessible name, `main` content); one `h1` (the section title, "Dashboard"); KPI/chart/list blocks are labeled regions/headings.
- **Charts are not image-only:** the revenue trend and status ring have **text alternatives** — the ring exposes "72% delivered" as text and the status list gives every status a labeled number; the chart provides an accessible summary (and ideally an associated data table) so a screen-reader user gets the same information. **Color is never the only encoding** (statuses carry labels + values).
- **KPI values** are readable text (tabular), not baked into images.
- **Controls:** Refresh and the range Select are labeled, keyboard-operable, with visible **instant focus rings** (the current admin has none — this fixes it). The admin search (when present) follows the combobox pattern.
- **Sidebar nav:** a keyboard-navigable list with the current section as `aria-current`.
- **Contrast** ≥ 4.5:1 text / ≥ 3:1 UI in both themes, including chart lines/fills and status colors; **reduced motion** honored (chart draw-in is optional and disabled under reduce).

**Reasoning:** the two dashboard-specific a11y obligations are **accessible charts** (text alternatives + non-color encoding — a ring/line is meaningless to a screen reader otherwise) and **restoring the missing focus states** across the admin console.

---

## Responsive Rules

Verified at 320 / 375 / 414 / 768 / 1024 / 1280px. Sidebar: fixed (lg) → drawer (md/mobile). KPI row: 4-up (lg) → 2×2 (md) → 1–2-up (mobile). Chart + ring: side-by-side (lg) → stacked (md/mobile), chart full-width. Charts stay legible or simplify on small screens (fewer axis labels). No horizontal page scroll; wide tables (top products, if tabular) scroll within their container; ≥44px targets. **Reasoning:** admin is desktop-first but the dashboard must degrade to a readable single-column stack, never a squeezed multi-column mess.

---

## Motion

Restrained and information-serving. One optional orchestrated **chart draw-in on first load** (line/area animates once, `transform`/`opacity`, `--ease-out`); the ring may animate its fill once. **No looping/ambient motion**, no bouncing counters, no per-card stagger beyond a single gentle load. Refresh updates values with a quick cross-fade (no odometer spin). Reduced motion → everything static/instant. Focus rings instant. **Reasoning:** a dashboard is watched, not entertained; a single load animation aids comprehension of the trend, but constant motion would distract from reading the numbers.

---

## Edge Cases

| Case | Behavior |
|---|---|
| Non-admin reaches `/admin` | "Admin role required (signed in as {role})" + Back to shop; no data fetched. |
| Unauthenticated | "Sign in with an admin account." |
| Session restoring | Restoring state first; don't reject a real admin mid-restore. |
| Brand-new store (all zeros) | Honest zeros + empty charts; never fabricated activity. |
| Chart with 1 or 0 data points | Render a single point/flat state gracefully; empty → labeled empty chart. |
| One endpoint fails | Per-block error + retry; other blocks render. |
| Very large numbers | Tabular, locale-formatted, abbreviated where sensible ($1.2M) with the exact value on hover/title. |
| Stale after failed refresh | Keep last-good values + surface the refresh error. |
| Timezone/date boundaries | Daily buckets computed in a defined timezone; axis labels consistent. |
| Range with no data | Empty chart + "no data in this range"; range control still usable. |
| Slow refresh | Button stays in loading; prior values remain visible. |
| Admin token expires | API client refresh; hard failure routes to admin sign-in. |

---

## Future Improvements

- **Wire the admin quick-find search** (products/users/categories) — currently a dead field; hide until functional.
- **Custom date ranges + comparison** ("vs. previous period"), and **export** (CSV) of dashboard data.
- **More KPIs** as backends land: conversion, average order value, refunds, low-stock alerts.
- **Order-status drill-down** → the orders management section (when built) directly from the ring/list.
- **Real-time / auto-refresh** option (with a clear indicator) instead of manual-only.
- **Low-stock / out-of-stock widgets** driven by inventory.
- **Revenue by category/brand** breakdowns.
- **Role-scoped dashboards** (ops vs. catalog vs. owner views).
- **Alerts/notifications** for anomalies (spikes, drops) — real thresholds, never invented.

---

*End of specification. Build order: (1) AdminShell (sidebar + sticky topbar) on unified tokens with full focus states + the three AdminGuard access states; (2) MetricCard KPI row wired to real counts/revenue (tabular, honest zeros); (3) RevenueChart (accessible: text alt + data table) with the range control; (4) StatusRing + status list (semantic colors, lifecycle order, text alternatives); (5) TopProductsList (sortable by revenue/qty, capped, "view all" link); (6) Refresh with keep-prior-values loading, per-block error isolation, and the empty/zero states.*
