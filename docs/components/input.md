# Input

Shared conventions, tokens, and the universal 8-state model live in [`README.md`](./README.md); this file states only Input specifics. Input is the field primitive; specialized inputs (Checkbox, Radio, Switch, Select, Textarea) share its Field wrapper and states.

# Purpose

Capture a single value from the user — text, email, password, number, or a choice — inside a consistent, accessible field wrapper. Inputs are the workhorse of every form (auth, profile, checkout, admin) and must feel identical everywhere.

# Responsibilities

- Present a labelled field with optional help and inline error, tied together for assistive tech.
- Own the field states (README) — including `error` and `disabled`/`readonly`.
- Expose value + change events; own **no** validation logic itself (the form decides validity; the Input renders the result). This keeps it reusable across every form.

# Anatomy

`Label → [ leadingIcon? · control · trailingSlot? ] → help / error`
- **Label** above the control (persistent, never placeholder-as-label).
- **Control** (the text field / select / etc.), `--color-surface`, `--color-border-strong`, `--radius-sm`.
- **Trailing slot** for affordances (password show/hide toggle, unit, clear, spinner).
- **Help text** (muted) and/or **inline error** (danger) beneath, linked via `aria-describedby`.

# Variants

| Variant | Notes |
|---|---|
| `text` / `email` / `tel` / `number` / `password` | Single-line; `password` gets a show/hide toggle |
| `textarea` | Multi-line, auto-grow within a max |
| `select` | Native-backed single choice (styled trigger) |
| `checkbox` / `radio` / `switch` | Boolean/choice controls sharing the Field wrapper (label clickable, ≥44px target) |
| `combobox` | Searchable select — see [`SearchBar`](./search-bar.md) for the full pattern |

# Props / Configuration

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | enum(text,email,tel,number,password,textarea,select,checkbox,radio,switch) | text | — |
| `label` | text | — | Required (visually or `aria-label`) |
| `value` / `onChange` | text/event | — | Controlled value |
| `placeholder` | text | — | Hint, **not** a label substitute |
| `helpText` | text | — | Muted guidance below |
| `error` | text | — | Inline error message (sets error state) |
| `required` / `optional` | boolean | — | Marked consistently |
| `disabled` / `readonly` | boolean | false | Distinct visuals (readonly still readable/selectable) |
| `leadingIcon` / `trailingSlot` | icon/content | — | Affordances |
| `size` | enum(sm, md) | md | See Sizes |
| `autoComplete` | text | — | Correct token so password managers work |
| `inputMode` | text | — | Mobile keyboard hint |

# Sizes

| Size | Height | Use |
|---|---|---|
| `sm` | 36px | Dense admin forms/filters |
| `md` | 40–44px | Default (comfortable, touch-friendly) |

Text renders ≥16px on mobile (no zoom-on-focus). Radius `--radius-sm`.

# States

- **Default** — surface + `--color-border-strong`.
- **Hover** — subtle border emphasis.
- **Focus** — instant `--color-focus` ring + `--shadow-focus`; label/field association clear.
- **Active** — n/a beyond focus for text; checkbox/radio/switch show the checked transition.
- **Disabled** — muted, not editable; **readonly** distinct (readable, e.g., email on profile).
- **Loading** — trailing spinner (e.g., async availability check) without blocking typing; `aria-busy` on the field's status region.
- **Empty** — pristine field (placeholder visible); not an error.
- **Error** — `--color-danger` border + inline message + icon, `aria-invalid`, `aria-describedby` → message.

# Accessibility

Persistent visible label (or `aria-label`); `aria-invalid`+`aria-describedby` on error; help text linked. Correct `autoComplete`/`inputMode`. Checkbox/radio grouped in a `fieldset`/`legend`; switch exposes on/off state. Live-validation feedback (e.g., email availability, password rules) is announced **politely and summarized**, never per keystroke (README a11y).

# Keyboard Behavior

Standard text editing; `Tab` in/out; `Enter` submits the form (single-line). Select/checkbox/radio use native keys (arrows within a radio group, Space to toggle). Password show/hide toggle is a focusable button (`Enter`/`Space`).

# Responsive Rules

Labels above the field at all widths; full-width fields in single-column mobile forms; ≥16px text; ≥44px targets for checkbox/radio/switch (including label). Field groups stack one-up on mobile.

# Motion

Border/ring change is **instant on focus** (README). Error message fades in (`opacity`, `--dur-fast`); the border switches to danger without animation. Checkbox/switch use a quick `transform` toggle; reduced-motion → instant.

# Design Rules

- **Label above, always.** No floating labels, no placeholder-as-label.
- Placeholder is `--color-muted`, illustrative, and never carries required information.
- Required/optional marking is consistent across a form.
- Error copy says **what's wrong and how to fix it** (design-system copy rules).
- The Input renders validity; the **form** decides it — the Input stays logic-free and reusable.

# Do's

- Do link help/error via `aria-describedby`.
- Do use the right `type`/`inputMode`/`autoComplete` (also a speed win for password managers).
- Do reserve the error line's space to avoid layout shift when it appears.

# Don'ts

- Don't use placeholder as the label.
- Don't announce every keystroke of a live check (noisy live region).
- Don't bake validation rules into the Input.
- Don't shrink mobile text below 16px.

# Usage Examples

- **Auth:** email + password (with show/hide) in [`../auth/login.md`](../auth/login.md); the register field set with live email + password-rule feedback in [`register.md`](../auth/register.md).
- **Checkout/Profile:** the address fields + VN location combobox in [`../pages/checkout.md`](../pages/checkout.md) / [`../pages/profile.md`](../pages/profile.md).
- **Admin:** filter and editor fields in [`../admin/products.md`](../admin/products.md); write-only masked secret fields in [`../admin/settings.md`](../admin/settings.md).

# Future Extensions

- **Field-level async validation slot** standardized (availability, uniqueness).
- **Input masking** (phone, currency) and **combobox with server search** promoted from SearchBar.
- **Multi-value token input** (tags) reusing Badge for the tokens.
