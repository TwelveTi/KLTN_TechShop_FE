# Modal

Shared conventions, tokens, and the universal 8-state model live in [`README.md`](./README.md); this file states only Modal specifics. **There is one Modal** — it replaces the three divergent dialog implementations flagged in the audit.

# Purpose

Present focused content or a decision **on top of** the current context without navigating away — a form, a detail view, or a confirmation. The Modal exists for moments that require the user's full attention or a deliberate choice.

# Responsibilities

- Trap focus, block the background, and restore focus on close.
- Provide a consistent frame (header, body, footer) and dismissal contract.
- Distinguish **reversible** flows (dismissible) from **irreversible** confirmations (deliberate). It does **not** decide business outcomes — it hosts them.

# Anatomy

`Backdrop (scrim) → Dialog[ header(title + close) · body(content slot) · footer(actions) ]`
- **Backdrop:** scrim at `--z-overlay`; click-outside dismisses non-destructive modals.
- **Dialog:** `--color-surface-raised`, `--radius-lg`, `--elevation-3`, at `--z-modal`.
- **Header:** title (`--text-h3`) + a close (✕) icon Button.
- **Body:** scrollable content slot; body scroll of the page is locked while open.
- **Footer:** trailing-aligned actions — one primary (README: one primary), a secondary/cancel.

# Variants

| Variant | Use | Dismissal |
|---|---|---|
| `dialog` | Forms / detail / arbitrary content | Esc, ✕, click-outside |
| `confirm` | Reversible confirmation | Esc, ✕, cancel |
| `confirm-destructive` | Irreversible action | **No click-outside**; requires typed confirmation |
| `sheet` | Mobile full-screen variant (auto below `sm`) | Esc, ✕, or a Back control |
| `slideOver` | Right-anchored panel for quick view/edit beside a list | Esc, ✕, click-outside |

# Props / Configuration

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | enum(dialog, confirm, confirm-destructive, sheet, slideOver) | dialog | — |
| `title` | text | — | Labels the dialog (`aria-labelledby`) |
| `isOpen` | boolean | — | Visibility |
| `onClose` | event | — | Dismiss handler |
| `size` | enum(sm, md, lg) | md | See Sizes |
| `dismissible` | boolean | true | `false` for destructive/blocking |
| `primaryAction` / `secondaryAction` | content | — | Footer actions (Buttons) |
| `confirmPhrase` | text | — | For `confirm-destructive` (typed-to-confirm) |
| `initialFocus` | ref/selector | first focusable | Where focus lands on open |

# Sizes

| Size | Max width | Use |
|---|---|---|
| `sm` | ~420px | Confirmations |
| `md` | ~560px | Standard dialogs |
| `lg` | ~720px | Content-heavy forms (e.g., admin create) |

`slideOver` uses a fixed panel width (~420–520px) instead. Below `sm` breakpoint, dialogs become full-screen `sheet`s.

# States

- **Default** — open dialog, focus trapped inside.
- **Hover / Focus / Active** — apply to the controls within (Buttons/Inputs), per their docs; the dialog itself shows focus on its interactive parts.
- **Disabled** — a blocking modal (`dismissible:false`) disables background interaction entirely.
- **Loading** — an async action from the footer shows the primary Button's loading state; the dialog stays open until resolution; `aria-busy` on the body if the whole panel is loading content.
- **Empty** — a detail slide-over with no data shows a small empty state in the body.
- **Error** — inline error inside the body (`role="alert"`), never a nested modal; the action can be retried.

# Accessibility

`role="dialog"`, `aria-modal="true"`, `aria-labelledby` the title. **Focus is trapped** while open; on close, focus **returns to the trigger**. `Esc` closes dismissible modals. Background is inert (not reachable by keyboard or SR). `confirm-destructive` requires the typed `confirmPhrase` (prevents accidental irreversible actions).

# Keyboard Behavior

`Esc` closes (dismissible); `Tab`/`Shift+Tab` cycle **within** the dialog only; `Enter` triggers the primary action when focus is on it (never auto-fires a destructive primary). Focus starts at `initialFocus` (first field, or the safe/cancel option for destructive confirms).

# Responsive Rules

Dialogs center within their max width on desktop; **become full-screen sheets below `sm`** (forms stack one-up). `slideOver` becomes a full-screen sheet on mobile too. Long bodies scroll inside the dialog (page never scrolls behind). Footer actions go full-width and stack on narrow sheets.

# Motion

Backdrop fades; dialog fades + small scale/`transform` in (`--dur-base`, `--ease-out`); sheet/slideOver slide from bottom/right (`transform`). Exit reverses at `--dur-fast` `--ease-in`. Reduced-motion → fade only. No bounce.

# Design Rules

- **One Modal implementation** for all overlays; variants configure it.
- Reserve modals for attention/decision; prefer **optimistic + Undo** (Toast) over a confirm dialog for reversible actions.
- Irreversible actions use `confirm-destructive` with typed confirmation — never a one-click "OK".
- One primary action in the footer; destructive primary is `danger` and not the default-focused control.
- No nested modals; errors render inline in the body.

# Do's

- Do return focus to the trigger on close.
- Do lock body scroll while open.
- Do make destructive confirmation deliberate (typed phrase).

# Don'ts

- Don't stack modals.
- Don't use a confirm dialog for a reversible delete (use Undo).
- Don't allow click-outside to dismiss a destructive confirm.
- Don't trap the user without an Esc/close path (except mid-irreversible-commit).

# Usage Examples

- **Admin create/edit** (lg dialog) and **delete confirmation** (`confirm-destructive`) in [`../admin/products.md`](../admin/products.md).
- **Right slide-over** quick view/edit beside the admin table, and the customer edit drawer in [`../admin/customers.md`](../admin/customers.md).
- **Address add/edit sheet** on mobile in [`../pages/checkout.md`](../pages/checkout.md) / [`../pages/profile.md`](../pages/profile.md).

# Future Extensions

- **Multi-step dialog** (wizard) with an internal step indicator.
- **Persistent slide-over** that can dock/undock beside wide admin tables.
- **Non-modal popover dialog** for lightweight, dismiss-on-outside side content.
