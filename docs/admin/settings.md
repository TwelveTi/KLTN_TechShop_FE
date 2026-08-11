# Admin · Settings — Page Design Spec

**Governed by [`design-system.md`](../design-system.md)** (Forms + Accessibility sections). **Reuses the admin shell, keyboard, and motion from [`products.md`](./products.md).** **Reference feel:** Stripe / Vercel / GitHub settings — sectioned, form-driven, safe. Markdown only.
**Route:** `/admin/settings` (with sub-sections). **Access:** ADMIN only (some areas owner-only).
**Backend status:** a store-settings module is **not built**; this spec is forward-looking and gated. Only settings backed by real endpoints render live; the rest show "coming soon," never dead controls.

**Section note:** settings is grouped **forms**, not a table — so **Table Design → settings groups**, **Filters / Search / Bulk Actions → N/A** (each says why).

---

## Goals

Let an admin **configure the store safely** — profile, payments, shipping, tax, notifications, team — with changes that are **deliberate, reversible where possible, and never leak secrets**. **Why "safe" is the goal, not "fast":** settings are low-frequency, high-consequence; a mis-saved payment key or tax rate has store-wide blast radius. The design optimizes for clarity and confirmation over speed — the opposite bias from the Products table.

**Security stance (load-bearing):** secret values (payment API keys, webhook secrets) are **write-only** — the UI **never displays or echoes a stored secret**. It shows a masked indicator ("•••• configured · updated 3d ago") and lets the admin *replace* it, not read it. **Why:** rendering a secret back into the page (or letting it be copied) is an exfiltration risk; write-only fields are the standard, and they also make "is it set?" clear without exposing the value.

## User Tasks

Edit store profile · configure payment methods (VNPay/COD) · set shipping options · set tax rules · manage notification templates · manage team/roles · perform rare destructive ops (danger zone).

## Layout

Shared admin shell. A **two-column settings layout**: a **left sub-nav** of setting groups + a **right form panel** for the active group (Stripe/GitHub settings pattern):

```
Sidebar │ Settings
        │ ┌──────────────┐  ┌──────────────────────────────────┐
        │ │ Store profile│  │ Store profile                     │
        │ │ Payments     │  │ Store name  [__________________]  │
        │ │ Shipping     │  │ Support email [________________]  │
        │ │ Tax          │  │ Currency   [ VND ▾ ]              │
        │ │ Notifications│  │ Logo       [ upload ]             │
        │ │ Team & roles │  │                    [ Save ]       │
        │ │ Danger zone  │  └──────────────────────────────────┘
        │ └──────────────┘
```

- **Grouped sub-nav** so each screen is one coherent set of fields. **Why grouping:** a single mega-form is unscannable and error-prone; groups let the admin find and change one thing with confidence.
- **Per-group Save** with a clear dirty-state ("Unsaved changes") and a save/discard bar. **Why explicit save (not autosave) here:** settings changes are consequential and often interdependent (a tax rule, a payment key); the admin should commit deliberately and be warned before navigating away with unsaved edits.

## Table Design → settings groups

No data table. The equivalents:
- **Store profile:** name, support email, currency, logo.
- **Payments:** enable VNPay / COD; **VNPay credentials as write-only masked fields** (never echoed); a test/verify action.
- **Shipping:** methods + rates (real values only; no invented fees).
- **Tax:** rate(s)/rules.
- **Notifications:** email templates & toggles.
- **Team & roles:** admin users + role assignment (links to [`customers.md`](./customers.md) for the account list; role changes are high-privilege, confirmed).
- **Danger zone:** rare destructive/irreversible actions, visually separated, each with typed confirmation.

**Why a danger zone (GitHub pattern):** isolating irreversible actions (and gating them behind typed confirmation) prevents an accidental click during routine settings edits — the consequences (data loss, disabling payments) are too high for a normal button.

## Filters / Search / Bulk Actions

**All N/A** — settings is a finite set of grouped forms, not a queryable/selectable list. The topbar `/`+⌘K remain for navigation (and could jump to a settings group). Stated explicitly so none are added.

## Empty States

Settings groups are never "empty" — they show current values or sensible defaults. The relevant states are **"not configured yet"** (e.g., payments not set up → a setup prompt) and **"module coming soon"** for gated groups. **Why a setup prompt, not a blank form:** a first-run admin needs to be *led* into configuring payments, not shown an inscrutable empty form.

## Loading

Per-group form **skeleton** on first load; a group's Save shows a button loading state; masked-secret fields render their "configured/updated" indicator once loaded (never the value). `aria-busy`. **Why per-group:** each group loads/saves independently so one slow section doesn't block the others.

## Errors

- **Save failure:** inline, field-specific where possible; the form retains the admin's input; a group-level error banner for non-field failures. **Never lose typed input on a failed save.**
- **Validation:** inline, on the field, with a clear fix (e.g., invalid tax rate, malformed email).
- **Payment verify failure:** explicit ("Couldn't verify VNPay credentials") without echoing the secret.
- **Permission error:** if a non-owner hits an owner-only group, explain and hide the controls rather than failing on save.

**Why preserve input on error:** re-typing a settings form after a failed save is maddening and error-prone; the form must hold state through a retry.

## Responsive Behavior

Sidebar → drawer under `md`; the settings sub-nav becomes a **top select / horizontal strip** and the form panel goes full-width; single-column fields on mobile; the save/discard bar sticks to the bottom on small screens so Save stays reachable. **Why:** settings are occasionally edited on the go; the form must be usable one-column with Save always in reach.

## Accessibility

- Grouped forms with a `tablist`/nav for groups; one `h1` per group; every field a persistent visible label.
- **Secret fields** are labeled write-only, announce their masked/configured state (not a value), and never place a secret in the DOM as readable text.
- Save/dirty state announced (`aria-live`); unsaved-changes warning on navigation is keyboard-dismissible.
- Danger-zone confirmations are focus-trapped dialogs with typed confirmation.
- Instant focus rings; full keyboard; ≥4.5:1 contrast; reduced motion. **Why the secret-field a11y detail:** a screen reader must convey "a key is configured" without ever reading the key aloud.

## Keyboard Navigation

Shared nav model (`/`, `⌘K`, `?`); groups reachable via keyboard; forms fully operable; `⌘/Ctrl+S` saves the active group (with the same confirmation/validation as the button). **Why ⌘S:** matches the "editing a document" mental model settings evoke, and speeds the deliberate save.

## Motion

Minimal. Group switch cross-fades the form panel (reduced-motion → instant); the save/discard bar slides in when the form is dirty; **no celebratory animation on save** (a quiet "Saved" confirmation is enough); danger-zone confirmations appear without flourish. **Why sober motion:** settings should feel careful and considered; playful motion undercuts the gravity of what's being changed.

## Future

- The **store-settings backend** (the hard dependency) — profile, payments, shipping, tax, notifications persistence.
- **VNPay credential management** with test/verify (write-only), and additional payment methods.
- **Team & roles** with granular permissions and an **audit log** of settings changes (who changed what, when).
- **Tax rules by region**, **shipping zones/rates**, **notification template editing**.

---

*Build order (when the settings backend exists): reuse admin shell → grouped settings layout (sub-nav + form panel) with per-group explicit Save + dirty-state guard → Store profile first (simplest) → Payments with **write-only masked** VNPay fields + verify → Shipping/Tax/Notifications → Team & roles (confirmed, high-privilege) → Danger zone (typed confirmation) → preserve input on error, gate unbuilt groups as "coming soon." Never echo a stored secret.*
