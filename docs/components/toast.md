# Toast

Shared conventions, tokens, and the universal 8-state model live in [`README.md`](./README.md); this file states only Toast specifics. **There is one Toast system** (the existing component, rewired onto shared tokens).

# Purpose

Deliver a brief, **non-blocking** notification about something the user can't otherwise see — a failure, the result of an async/background action, or a reversible action's **Undo**. The Toast never interrupts; it informs and gets out of the way.

# Responsibilities

- Announce transient outcomes without stealing focus or blocking the UI.
- Host an optional action (usually **Undo**) for reversible operations.
- Stack and auto-dismiss predictably, without layout shift.
- Own **no** business logic — callers raise a toast; the Toast displays and times it.

# Anatomy

`[ icon · title? · message · action? · close ]` in a corner-pinned container.
- **Icon:** semantic (success/info/error) from the one icon set.
- **Title (optional)** + **message** (concise).
- **Action (optional):** a single control, typically "Undo" (or "Retry").
- **Close (✕):** manual dismiss.

# Variants

| Variant | Use | Accent |
|---|---|---|
| `error` | Failures the user must know about | `--color-danger` |
| `info` | Neutral async result / notice | `--color-primary` |
| `success` | **Rare** — only for changes the user can't see | `--color-success` |
| `undo` | Reversible action confirmation + Undo action | neutral/info |

# Props / Configuration

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | enum(error, info, success, undo) | info | — |
| `title` | text | — | Optional |
| `message` | text | — | Required; specific and actionable |
| `action` | content | — | One action (Undo/Retry) |
| `duration` | number(ms) | ~5000 | Errors may persist longer / until dismissed |
| `dismissible` | boolean | true | Manual close |
| `onDismiss` / `onAction` | event | — | Callbacks |

# Sizes

Single size; width `min(360px, calc(100vw − 2·gutter))`; stacks vertically at a viewport corner with fixed gaps. Message `--text-body-sm`; title `--weight-semibold`.

# States

- **Default** — visible, counting down to auto-dismiss.
- **Hover** — pauses the auto-dismiss timer (so the user can read/act); resumes on leave.
- **Focus** — focusing the toast (or its action) also pauses dismissal; instant ring on the action/close.
- **Active** — the action's press feedback (Button behaviour).
- **Disabled** — n/a.
- **Loading** — n/a (a toast reports a result; a pending action stays on its source control).
- **Empty / Error** — n/a (the Toast *is* the message surface).

# Accessibility

Container is a live region: `role="status"` + `aria-live="polite"` for info/success/undo; `role="alert"` + `aria-live="assertive"` for errors. Toasts **do not steal focus**; the Undo/Retry action is keyboard-reachable while visible. Auto-dismiss **pauses on hover and focus** (so keyboard/AT users can act). Icons are decorative (`aria-hidden`); the message carries the meaning.

# Keyboard Behavior

Toasts don't grab focus, but are reachable (e.g., a shortcut or Tab into the live region's action). `Esc` dismisses the focused toast; `Enter`/`Space` triggers its action. The Undo action must remain actionable for the full (paused-on-focus) duration.

# Responsive Rules

Pins to a consistent corner (top-right desktop); on mobile spans near-full width with side gutters, top or bottom per app convention. Never overlaps a sticky bottom bar (e.g., mobile checkout) — it offsets above it. No horizontal overflow.

# Motion

Enter: fade + small slide/`transform` in; exit: fade out. **Existing toasts don't move when a new one arrives** (stack at fixed positions — no layout shift). `--dur-fast`/`--dur-base`, `--ease-out`. Reduced-motion → fade only.

# Design Rules

- **Silent success is the default** — a change the user can already see gets **no** toast. Success toasts are reserved for invisible/background results.
- Prefer **optimistic + Undo** over confirmation dialogs for reversible actions; the Undo toast is that pattern's surface.
- Errors are specific and actionable (what happened + how to recover), and may offer **Retry**.
- One action per toast; never a form or multiple choices (that's a Modal).

# Do's

- Do pause dismissal on hover/focus.
- Do stack without shifting existing toasts.
- Do use `assertive` only for errors; `polite` otherwise.

# Don'ts

- Don't celebrate visible actions ("Saved!" when the change is on screen).
- Don't put critical decisions in a toast (use a Modal).
- Don't let a new toast reflow the page.
- Don't auto-dismiss an error the user hasn't seen — persist or require dismissal.

# Usage Examples

- **Undo** after removing a cart line / wishlist item / admin table row ([`../pages/cart.md`](../pages/cart.md), [`../pages/wishlist.md`](../pages/wishlist.md), [`../admin/products.md`](../admin/products.md)).
- **Error + Retry** on a failed inline-edit or fetch across admin.
- **Info** for a background result (e.g., "Images uploaded"); the email-verification notice on the storefront.

# Future Extensions

- **Toast queue with a cap** + "N more" collapsing when many arrive.
- **Promise toast** (loading → success/error) for long background jobs.
- **Per-region anchoring** (e.g., a form-local toast) where a global corner is too far from context.
