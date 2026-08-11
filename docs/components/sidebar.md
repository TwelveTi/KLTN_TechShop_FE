# Sidebar

Shared conventions, tokens, and the universal 8-state model live in [`README.md`](./README.md); this file states only Sidebar specifics. The Sidebar is the vertical **section navigation** for section-heavy areas — the admin console and the profile/account area.

# Purpose

Give a section-heavy area a persistent, scannable list of its sections with a clear "you are here," so the user is one click from anywhere within that area. It anchors the admin console and the account area the way the [`Navbar`](./navbar.md) anchors the app.

# Responsibilities

- List an area's sections with a visible **active** state and stable order.
- Collapse to a drawer on small screens without losing reachability.
- Provide identity/summary at the top and an exit at the bottom (e.g., "Back to shop").
- Own navigation *structure*, not routing logic (it emits the target; the app routes).

# Anatomy

`[ header (brand/summary) · nav items (icon + label, active marker) · footer (exit/secondary) ]`, full-height, `--color-surface`, hairline right border.
- **Header:** admin brand lockup, or the profile [`Avatar`](./avatar.md)+name summary.
- **Nav items:** icon (one set) + label; the active item marked with `--color-primary` (text + a rail/indicator). Optional grouping with quiet labels.
- **Footer:** "Back to shop" (admin) / sign-out or secondary links.

# Variants

| Variant | Use |
|---|---|
| `admin` | Admin console section nav (Dashboard · Orders · Products · Inventory · Categories · Brands · Customers · Analytics · Settings · Back to shop) |
| `profile` | Account sections (My account · Orders · Addresses · Notifications · Security) with a user summary header |
| `drawer` | The responsive form of either, slid in over a scrim on small screens |

# Props / Configuration

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | enum(admin, profile, drawer) | admin | — |
| `items` | list | — | `{ id, label, icon, href, badge? }` (badge for counts) |
| `activeId` | text | — | Current section (`aria-current`) |
| `header` | content | — | Brand lockup or user summary |
| `footer` | content | — | Back-to-shop / secondary |
| `collapsed` | boolean | false | Icon-only rail (desktop density option) |
| `isOpen` / `onClose` | boolean/event | — | Drawer control (mobile) |

# Sizes

Fixed width ~240–260px (expanded); optional collapsed icon-rail ~64px (desktop density). Item height ~40px (≥44px effective touch). Labels `--text-body-sm`/`--weight-medium`; active item `--weight-semibold` + primary.

# States

- **Default** — items at rest; active item marked.
- **Hover** — item background `--color-surface-sunken` (one signal).
- **Focus** — instant focus ring on the item.
- **Active (current section)** — persistent `--color-primary` marker (`aria-current="page"`) — distinct from hover/press.
- **Disabled** — a gated/coming-soon section is muted and non-navigable with a small "soon" hint.
- **Loading** — item-count badges may lazy-load; the nav itself renders immediately (no skeleton for a known static list).
- **Empty** — n/a (the section list is fixed).
- **Error** — n/a on the nav; a failed count badge simply doesn't render.

# Accessibility

`nav` landmark with an accessible name ("Admin sections" / "Account sections"); items are real links; the current item uses `aria-current="page"`. As a `drawer`, it's a focus-trapped dialog (Esc closes, focus returns to the toggle). Icons are decorative (label carries meaning). Active state is conveyed by more than colour (weight + indicator + `aria-current`).

# Keyboard Behavior

Tab through items in order; `Enter` activates. The drawer opens from a [`Navbar`](./navbar.md) toggle and closes on `Esc` (focus returns to the toggle). A collapsed icon-rail exposes labels via tooltip on hover **and** focus. No arrow-key roving required (it's a simple link list), though it may be added for long navs.

# Responsive Rules

≥lg: fixed, always visible (admin); the profile sidebar likewise on wide screens. `md` and below: becomes a **`drawer`** toggled from the Navbar (admin) or a **horizontal tab strip / select** (profile), reclaiming width for content. The drawer overlays a scrim; the page beneath is inert while open. No horizontal page scroll.

# Motion

Drawer slides in from the left + scrim fade (`transform`/`opacity`, `--dur-base`, `--ease-out`); exit reverses. Active-marker moves with a subtle transition when navigating (never steals focus). Collapse/expand of the rail animates width via `transform` where possible; reduced-motion → instant.

# Design Rules

- **One active item**, always visibly marked (weight + indicator + `aria-current`).
- Stable section order across sessions (muscle memory).
- Quiet chrome — hairline border, `--color-surface`, no heavy shadow; the content area is the focus, not the nav.
- Gated/coming-soon sections are shown muted with a "soon" hint (honest), not hidden or fake-linked.
- One Sidebar component; `admin`/`profile` are configurations.

# Do's

- Do keep the current section obvious and the order fixed.
- Do provide an exit (Back to shop) in the admin footer.
- Do collapse to a drawer (not a squeezed rail) on mobile.

# Don'ts

- Don't convey the active item by colour alone.
- Don't reorder sections dynamically.
- Don't trap focus except when it's a drawer.
- Don't link to unbuilt sections as if live — mark them "soon."

# Usage Examples

- **Admin console** section nav across [`../admin/products.md`](../admin/products.md) and all admin siblings (drawer under md).
- **Profile/account** section nav in [`../pages/profile.md`](../pages/profile.md) (Avatar summary header; tab-strip on mobile).

# Future Extensions

- **Collapsible icon-rail** as a persisted desktop density preference.
- **Nested/section groups** with expand/collapse for a larger admin.
- **Badge counts** on nav items (e.g., unfulfilled Orders) once those data exist.
