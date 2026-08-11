# Button

Shared conventions, tokens, and the universal 8-state model live in [`README.md`](./README.md); this file states only Button specifics.

# Purpose

Trigger a single action. The Button is the primary way users commit intent across TechShop — submitting a form, opening a flow, performing a row action. It carries meaning through variant (importance) and label (the exact action).

# Responsibilities

- Communicate an action's importance (primary / secondary / ghost / danger) and its exact effect (verb-first label).
- Own all interactive states (README 8-state model) including loading.
- Never own navigation semantics — a control that *goes somewhere* is a link styled as a button, not a Button with an onClick that routes. (Reusability + correct semantics.)

# Anatomy

`[ leadingIcon?  label  trailingIcon? ]` inside a token-styled container.
- Optional leading/trailing icon (single icon set, `currentColor`).
- Label (required unless `iconOnly`, which then requires `aria-label`).
- A loading indicator that **replaces the leading icon slot** (label stays) so width is preserved.

# Variants

| Variant | Fill | Use |
|---|---|---|
| `primary` | `--color-primary` on `--color-on-primary` | The one main action in a view |
| `secondary` | `--color-surface` + `--color-border-strong`, `--color-text` | Secondary actions |
| `ghost` | transparent, `--color-primary` text | Tertiary / toolbar / table-row actions |
| `danger` | `--color-danger` fill, white text | Destructive confirm actions |

Modifiers: `iconOnly` (square, `aria-label` required), `fullWidth` (mobile CTAs, form submits).

# Props / Configuration

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | enum(primary, secondary, ghost, danger) | `secondary` | Importance |
| `size` | enum(sm, md, lg) | `md` | See Sizes |
| `label` | text | — | Verb-first; required unless `iconOnly` |
| `leadingIcon` / `trailingIcon` | icon | — | From the one icon set |
| `iconOnly` | boolean | false | Requires `ariaLabel` |
| `isLoading` | boolean | false | Shows spinner, disables, preserves width |
| `disabled` | boolean | false | Non-actionable |
| `fullWidth` | boolean | false | Stretches to container |
| `ariaLabel` | text | — | Required for `iconOnly` |
| `onPress` | event | — | Action callback |
| `type` | enum(button, submit) | button | `submit` inside forms |

# Sizes

| Size | Height | Use |
|---|---|---|
| `sm` | 32px | Dense contexts (table rows, toolbars) |
| `md` | 40px | Default |
| `lg` | 48px | Prominent CTAs, mobile full-width |

Radius `--radius-sm`; label `--weight-semibold`; horizontal padding scales with size on the 4-pt scale.

# States

- **Default** — variant fill/border from tokens.
- **Hover** — `primary`→`--color-primary-hover`; others shift background one step. One signal, `--dur-fast`.
- **Focus** — instant `--color-focus` ring (README).
- **Active** — 1px translate down; no bounce.
- **Disabled** — reduced emphasis, not actionable, cursor not-allowed; tooltip reason where non-obvious.
- **Loading** — spinner in the leading slot, label persists (or a `…` progressive label), width preserved, `aria-busy`, interaction blocked.
- **Empty** — n/a.
- **Error** — n/a on the Button itself; the surrounding form/flow reports errors (see Toast/Input).

# Accessibility

Real `<button>`. `iconOnly` requires `aria-label`. `isLoading` sets `aria-busy` and keeps an accessible name. Disabled state is programmatically conveyed. Follows the README a11y baseline (instant focus, ≥3:1, keyboard).

# Keyboard Behavior

`Enter`/`Space` activate; `Tab` moves to/from it. Inside a form, a `submit` Button responds to `Enter` from the fields. No custom key handling beyond the README baseline.

# Responsive Rules

Labels never wrap to two lines — shorten ("Get started free"→"Start free") or set `nowrap`. `fullWidth` for mobile form submits/CTAs. Targets ≥44px on touch (sm's 32px height gets padding to meet the target on coarse pointers).

# Motion

Hover colour shift + active 1px translate only (README). Loading spinner is a steady rotate (no flashing). No hover-scale, no bounce.

# Design Rules

- **One primary Button visible per view** (composition rule).
- Labels are **verb-first and specific** ("Save profile", "Create product"); the resulting toast echoes the same verb ("Saved").
- `danger` only for genuinely destructive actions; pair irreversible ones with typed confirmation (Modal).
- Icons come from the single icon set and inherit `currentColor`.

# Do's

- Do use `ghost` for low-emphasis/table-row actions to keep density calm.
- Do keep width stable during loading.
- Do use `fullWidth` primary on mobile checkout/auth CTAs.

# Don'ts

- Don't put two primary Buttons in one view.
- Don't use a Button for navigation — use a link.
- Don't celebrate a visible change with a toast; success is silent (README).
- Don't let a label wrap; don't ship an `iconOnly` Button without `aria-label`.

# Usage Examples

- **Primary submit:** the "Sign in" / "Create account" action in [`../auth/login.md`](../auth/login.md) & [`register.md`](../auth/register.md) (fullWidth, lg on mobile).
- **Ghost row action:** Edit/Delete in the admin [`Table`](./table.md) rows ([`../admin/products.md`](../admin/products.md)).
- **Danger:** the confirm action inside a delete [`Modal`](./modal.md).
- **Secondary:** "Continue shopping" beside the primary "Proceed to checkout" in [`../pages/cart.md`](../pages/cart.md).

# Future Extensions

- **Split button** (primary action + dropdown of related actions) for admin toolbars.
- **Button group / segmented control** for mutually-exclusive quick choices.
- **Toggle button** with `aria-pressed` (e.g., the wishlist heart, currently its own control).
