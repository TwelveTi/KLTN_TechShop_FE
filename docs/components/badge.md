# Badge

Shared conventions, tokens, and the universal 8-state model live in [`README.md`](./README.md); this file states only Badge specifics. Badge covers the status pill, the label/tag chip, and the count indicator.

# Purpose

Communicate a **status, category, or count** in a compact, glanceable form. Badges let the eye triage a list — an order's payment state, a product's Draft/Active status, a cart count — without reading full sentences.

# Responsibilities

- Encode state/label legibly using **shape + text + colour together** (never colour alone).
- Stay decorative-only: a Badge conveys, it doesn't act. (An interactive, removable chip is the `removable` variant used by filter tokens.)

# Anatomy

`[ dot/icon? · label ]` in a pill container.
- Optional leading **dot** or **icon** (semantic).
- **Label** text (`--text-caption`, `--weight-medium`), or a **count** number (tabular).
- Optional trailing **✕** (only in the `removable` variant).

# Variants

| Variant | Use | Colour |
|---|---|---|
| `status` | Lifecycle/state (Active, Paid, Shipping, Out of stock) | semantic soft-bg + strong-text |
| `neutral` | Category/brand/generic tag | neutral surface + text |
| `accent` | A single brand highlight (use sparingly) | `--color-primary-soft` + primary text |
| `count` | Numeric indicator (cart items, filter count) | neutral or danger (unread) |
| `removable` | Interactive filter/selection token | neutral + trailing ✕ |

Status tones map to semantics: success (Active/Paid/Delivered), warning (Low stock/Pending), danger (Out of stock/Failed/Blocked), neutral (Draft/Inactive), info (Processing).

# Props / Configuration

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | enum(status, neutral, accent, count, removable) | neutral | — |
| `tone` | enum(neutral, success, warning, danger, info) | neutral | For `status`/`count` |
| `label` | text | — | Or `count` |
| `count` | number | — | For `count` (tabular) |
| `icon` / `dot` | icon/boolean | — | Leading semantic marker |
| `onRemove` | event | — | For `removable` (renders ✕) |

# Sizes

| Size | Height | Use |
|---|---|---|
| `sm` | ~18–20px | Inline in table cells, counts |
| `md` | ~24px | Default, filter tokens |

Radius `--radius-pill`; `count` badges are circular/oval and min-width to stay legible at 1–3 digits ("99+" caps overflow).

# States

- **Default** — soft background + strong text per tone.
- **Hover / Focus / Active** — **n/a for static badges** (non-interactive). The **`removable`** variant's ✕ is a focusable Button: hover/focus/active per Button; instant focus ring.
- **Disabled** — n/a.
- **Loading** — n/a (a status is either known or the row shows a skeleton).
- **Empty** — n/a (no badge renders when there's nothing to show — e.g., a 0 cart count hides rather than showing "0").
- **Error** — n/a (a badge *represents* an error state via `danger` tone; it doesn't have its own error state).

# Accessibility

State is conveyed by **text (and icon), not colour alone** — the label always names the state. Status badges are plain text to AT (no special role needed). A `count` used as an unread/notification indicator has an accessible label ("3 unread"); a purely decorative dot is `aria-hidden` with the meaning in adjacent text. `removable` ✕ carries `aria-label` ("Remove filter: Acme").

# Keyboard Behavior

Static badges are not focusable. The `removable` ✕ is keyboard-focusable and activates with `Enter`/`Space`. Otherwise none.

# Responsive Rules

Badges don't reflow internally; they wrap as inline content. In tight cells they truncate the label with an accessible full value (title). Filter-token badges wrap to their own row above a table/grid on narrow screens.

# Motion

Appear/disappear with a quick fade (`opacity`, `--dur-fast`); a status change cross-fades to the new tone/label. `removable` removal fades out. No pulsing/looping (a "live" pulsing dot is banned as noise). Reduced-motion → instant.

# Design Rules

- **Never colour-only** — the label carries the meaning; colour reinforces.
- Map tones to the **semantic** palette, never the accent (accent is a brand highlight, not a status).
- Keep labels short (one or two words); a badge is not a sentence.
- Don't render a `count` of 0 — hide it.
- Status vocabulary is consistent app-wide (e.g., product status = Draft/Active/Inactive/Out of stock everywhere).

# Do's

- Do pair a dot/icon with text for fastest scanning in tables.
- Do reuse the same tone→meaning mapping across pages.
- Do cap long counts ("99+").

# Don'ts

- Don't use the accent hue for a status.
- Don't make a static badge look clickable.
- Don't encode critical state in colour alone.
- Don't animate a badge to draw attention (use a Toast for events).

# Usage Examples

- **Product/order/customer status** pills in the admin [`Table`](./table.md).
- **Active-filter tokens** (`removable`) above catalog/admin lists ([`../pages/catalog.md`](../pages/catalog.md)).
- **Cart count** on the [`Navbar`](./navbar.md) cart icon (`count`, hides at 0); **badges** on [`ProductCard`](./product-card.md) (real data-driven flags only).

# Future Extensions

- **Progress/step badge** (e.g., "2 of 5") for multi-step flows.
- **Trend badge** (▲/▼ with a value) for analytics deltas.
- **Avatar-stack count** ("+3") pairing with [`Avatar`](./avatar.md).
