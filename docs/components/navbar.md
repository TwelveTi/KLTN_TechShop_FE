# Navbar

Shared conventions, tokens, and the universal 8-state model live in [`README.md`](./README.md); this file states only Navbar specifics. "Navbar" is the top navigation bar — the storefront **Header** and the admin **Topbar** are two configurations of one component.

# Purpose

Give users a persistent, always-reachable control strip for the current app context — brand/home, primary navigation or context, search, and account/actions. It orients users and keeps the session's key controls one reach away at any scroll depth.

# Responsibilities

- Anchor identity (brand → home) and the highest-frequency controls (search, cart, account / refresh).
- Stay out of the way — quiet chrome, hairline separation, minimal height.
- Adapt to context (storefront vs admin vs focused auth/checkout) without becoming a different component.

# Anatomy

`[ brand · (context/nav) · search · actions · account ]`, sticky, hairline bottom border.
- **Brand:** wordmark/logo linking home.
- **Context/nav slot:** storefront department entry or admin page title.
- **Search:** the [`SearchBar`](./search-bar.md) (storefront) or admin quick-find; `/` focuses it.
- **Actions:** storefront cart + notifications ([`Badge`](./badge.md) counts); admin refresh + primary action.
- **Account:** [`Avatar`](./avatar.md) → [`Dropdown`](./dropdown.md), or Sign in / Register Buttons when signed out.

# Variants

| Variant | Context | Notes |
|---|---|---|
| `storefront` | Customer pages | Brand · search · cart/notifications · account; sits above the department bar |
| `admin` | Admin console | Page title · quick-find · refresh · primary action · admin identity |
| `focused` | Auth / checkout | **Minimal** — brand + a "secure"/support cue only; no search/cart nav (reduces exits) |

# Props / Configuration

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | enum(storefront, admin, focused) | storefront | — |
| `brandHref` | text | `/` | Home link |
| `contextSlot` | content | — | Title (admin) / nav entry (storefront) |
| `showSearch` | boolean | variant-based | Storefront/admin true; focused false |
| `actions` | content | — | Cart/notifications or refresh/primary |
| `account` | content | — | Avatar+Dropdown or auth Buttons |
| `sticky` | boolean | true | Pins on scroll at `--z-sticky` |

# Sizes

Single height band ~64–72px (desktop), condensing on mobile. `--color-surface`, hairline `--color-border` bottom, `--elevation-1`. Search occupies the flexible middle; brand and account anchor the ends.

# States

- **Default** — resting bar; brand + controls visible.
- **Hover / Focus / Active** — apply to the *controls within* (Buttons, SearchBar, account Avatar/Dropdown), per their docs; the bar itself doesn't hover.
- **Disabled** — n/a for the bar; individual actions may disable (e.g., admin Refresh while loading).
- **Loading** — session-restore may show a compact placeholder in the account slot (not a flash of "Sign in" for a returning user); admin Refresh shows its own loading.
- **Empty** — n/a (the bar always has brand + at least one control).
- **Error** — n/a on the bar; failures surface via [`Toast`](./toast.md) or the page body.

# Accessibility

The bar is a `banner`/`header` landmark containing a `nav` with an accessible name; one bar per page. The account menu is a proper [`Dropdown`](./dropdown.md) (expanded state, Esc, focus return). Cart/notification counts are announced (`aria-live`) when they change. Icon-only actions carry `aria-label`. Search has a real label ([`SearchBar`](./search-bar.md)).

# Keyboard Behavior

Fully tabbable in visual order (brand → context → search → actions → account). `/` focuses search (app shortcut). The account Dropdown opens with `Enter`/`Space`/`ArrowDown`, closes on `Esc` (focus returns to the Avatar trigger). No key traps.

# Responsive Rules

- **storefront:** ≥md full bar; <md search collapses to an icon that expands (or drops to a second row), actions group, account condenses to the Avatar/Dropdown. The department bar (a separate strip) handles category nav below.
- **admin:** the [`Sidebar`](./sidebar.md) collapses to a drawer under md via a toggle placed in this bar.
- **focused:** already minimal at all sizes.
Clickable items never wrap; nav items may drop to a menu under a threshold. Sticky at all sizes.

# Motion

Sticky bar may gain a subtle shadow/border on scroll (state change, not animation-heavy). Menu open/close per Dropdown. **No hide-on-scroll-down/show-on-scroll-up jitter.** Reduced-motion honoured. (README banned tells apply.)

# Design Rules

- **Quiet chrome:** minimal height, hairline border, no gradient, no heavy shadow.
- The **focused** variant deliberately strips search/cart/nav during auth & checkout to cut exits and raise completion.
- Brand always links home; the account menu holds account/role actions (My profile, Orders, Admin, Sign out).
- One Navbar component; variants configure it — never a bespoke header per section.

# Do's

- Do keep search reachable via `/` at any scroll depth.
- Do condense gracefully on mobile (icon/expand, grouped actions).
- Do use the focused variant on auth/checkout.

# Don'ts

- Don't ship a different header per page.
- Don't show the full shop nav during checkout (use focused).
- Don't let nav labels wrap to two lines.
- Don't flash "Sign in" to a user whose session is still restoring.

# Usage Examples

- **Storefront Header** across [`../pages/home.md`](../pages/home.md), catalog, PDP, cart (brand · [`SearchBar`](./search-bar.md) · cart [`Badge`](./badge.md) · account [`Avatar`](./avatar.md)/[`Dropdown`](./dropdown.md)).
- **Admin Topbar** in [`../admin/products.md`](../admin/products.md) (title · quick-find · refresh · New · identity).
- **Focused** bar in [`../auth/login.md`](../auth/login.md) and [`../pages/checkout.md`](../pages/checkout.md).

# Future Extensions

- **Mega-menu** department navigation for a large catalog.
- **Global command palette** (⌘K) launched from the bar.
- **Notification center** panel behind the bell.
