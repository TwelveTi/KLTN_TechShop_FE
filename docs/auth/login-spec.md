# TechShop Login — Design Specification

**Status:** Implementation-ready · **Version:** 1.0 · **Last updated:** 2026-08-07
**Governed by:** [`design-system.md`](../design-system.md) · **Pairs with:** [`register-spec.md`](./register-spec.md) · **Continues** the shopper-facing spec set.
**Route:** `/auth` (login mode — the default) · returns from OAuth at `/auth?oauth=error` on failure.

**Shared-shell note (read first).** Login and Register are **two modes of one Auth surface** (the existing `AuthPage`), not separate pages. They share the same two-panel shell, mode switch, OAuth button, and theme. This document specifies the **login mode**; [`register-spec.md`](./register-spec.md) specifies the register mode; anything shell-level appears in both and is called out as shared. Every token/component resolves to the design system; every decision states its reasoning.

**Design-system reconciliation.** The current `AuthPage` carries a **local light/dark theme toggle** and its **own parallel color tokens** — both flagged in the audit. This spec supersedes that: the Auth surface uses the **app-wide theme** (no per-page toggle) and the **unified design-system tokens**. The toggle is removed; theme follows the global setting.

---

## Table of contents

Purpose · Target Users · Primary User Goals · Information Architecture · Desktop Layout · Tablet Layout · Mobile Layout · Visual Hierarchy · Components Used · User Flow · Empty States · Loading States · Error States · Search & Filtering Behavior · Sorting Behavior · Pagination / Infinite Scroll · Accessibility · Responsive Rules · Motion · Edge Cases · Future Improvements

---

## Purpose

Let an existing user prove who they are **quickly and without anxiety**, then return them to whatever they were doing. Login is a gateway, not a destination — its success is measured by how fast a legitimate user gets through it and how clearly a blocked one understands why.

Two rules define it: **minimum friction** (two fields, one primary action, an OAuth shortcut) and **honest, specific failure** (a wrong password, an unverified email, and a blocked account are three different messages, never one generic "login failed").

---

## Target Users

| User | Situation | Needs most |
|---|---|---|
| **Returning customer** | Knows their credentials | Fast email+password → back to shopping |
| **OAuth user** | Signed up / prefers Google | One-tap "Continue with Google" |
| **Just-registered user** | Created an account, must verify email | Clear "verify your email, then sign in" guidance |
| **Checkout returner** | Sent to login mid-purchase | Sign in and land back on checkout with cart intact |
| **Locked-out user** | Wrong password / blocked account | A specific, actionable reason — not a dead end |

---

## Primary User Goals

1. **Sign in fast** — email + password, or Google, with the least typing.
2. **Understand any failure** — know exactly why sign-in didn't work and what to do.
3. **Recover access** — reach password reset / email verification when relevant.
4. **Get where they were going** — return to the intended page (e.g., checkout) after signing in.
5. **Switch to register** — one obvious path if they don't have an account.

Goal 4 drives the **redirect-after-login** decision; Goal 2 drives the error-specificity rules.

---

## Information Architecture

**State is transient and not URL-encoded** (auth is a process, not a shareable view), except the OAuth return status (`?oauth=error`) and an optional `?next=<path>` capturing where to return after success.

```
Auth shell (shared)
├─ Brand panel        (identity + value line + product image)   ← desktop only
└─ Form panel
   ├─ Mode switch       [ Sign in | Register ]     ← shared; "Sign in" active here
   ├─ Heading           "Welcome back" / "Sign in to TechShop"
   ├─ Login form        email · password(show/hide) · submit
   ├─ Recovery links    "Forgot password?"* · "Verify email"*     (*gated on backend)
   ├─ OAuth divider     "or"
   └─ Google button     "Continue with Google"
```

- **`next` redirect:** if login was reached from a protected/intended action, `?next=` records the return path; on success the user lands there (default: home). Never lose the user's place.
- **Already-signed-in:** visiting `/auth` while authenticated redirects to home (or `next`), rather than showing a form to a signed-in user.

---

## Desktop Layout

**≥ 1024px (`lg`+).** Two-panel split, content-height (not locked to the viewport — the audit flagged the current `100svh; overflow:hidden` lock; the page scrolls if needed).

```
┌───────────────────────────────┬──────────────────────────────────────┐
│  BRAND PANEL                   │  FORM PANEL                            │
│  TechShop                      │   [ Sign in │ Register ]  ← switch     │
│                                │                                        │
│  "Smart tech shopping,         │   Welcome back                         │
│   personalized to you."        │   Sign in to TechShop                  │
│                                │                                        │
│  (product image / brand art —  │   Email     [__________________]       │
│   solid surface, no gradient   │   Password  [___________] 👁           │
│   hero, no radial glow)        │             Forgot password?*          │
│                                │   ┌──────────────────────────────┐     │
│                                │   │           Sign in            │     │
│                                │   └──────────────────────────────┘     │
│                                │   ──────────── or ──────────────       │
│                                │   [  G  Continue with Google  ]        │
└───────────────────────────────┴──────────────────────────────────────┘
```

- Split ~50/50 (or brand ~45% / form ~55%). The **brand panel** is identity + a single value line + a real product image on a solid surface — **no gradient hero, no radial-glow, no glassmorphism** (all audit-flagged; all removed).
- The **form panel** holds the mode switch, heading, form, recovery links, OAuth. The form column is narrow (~360–420px) and left- or center-aligned within the panel; fields are full-width.

---

## Tablet Layout

**768–1023px (`md`).** The brand panel narrows or drops to a slim top band (wordmark + one line); the form panel takes the majority. The form stays a single comfortable column. **Reasoning:** the brand panel is reassurance, not function — it yields space to the form as width shrinks.

## Mobile Layout

**< 768px (`xs`–`sm`).** Single column: a compact brand header (wordmark + one line, no large art), then the mode switch, then the form full-width. Inputs are ≥ 44px tall; the submit and Google buttons are full-width. The page scrolls; nothing is clipped. **Reasoning:** on a phone the form is the whole job — the brand panel collapses to a header so the fields and the keyboard own the screen.

---

## Visual Hierarchy

1. **The form heading + the two fields + the "Sign in" button** — the task; the primary button is the one `--color-primary` fill.
2. **Mode switch** — clearly shows "Sign in" is active and "Register" is one tap away.
3. **Google button** — a strong but visually *secondary* alternative (outlined/neutral, brand-correct Google mark), below an "or" divider.
4. **Recovery links** — quiet, near the password field / below the form.
5. **Brand panel** — identity and reassurance; present but not competing with the form.

**Applied rules:** one primary action; email→password→submit reading order; no gradients; headings roman; generous field spacing; error text in semantic danger with icon. **Reasoning:** a login screen should read as "do this one thing"; the Google alternative must be available but must not out-shout the primary email/password path.

---

## Components Used

| Area | Components |
|---|---|
| Shell | **AuthShell** *(shared: brand panel + form panel)* · **AuthModeSwitch** *(shared segmented tabs)* |
| Form | Input (email) · **PasswordInput** *(show/hide toggle)* · Button (primary "Sign in") · Alert / inline field errors |
| OAuth | **OAuthButton** *(Google, brand mark)* · divider |
| Feedback | Alert (form-level error) · success notice · Button loading state |

All from the shared library; the Auth shell and mode switch are shared with Register. The password show/hide toggle is an icon button with an `aria-label`.

---

## User Flow

```
Enter /auth (login mode)   [?next=… optional]
  ├─ Email + password → Sign in
  │     ├─ success → store session → redirect to `next` (or home); header shows the user
  │     ├─ wrong credentials → inline error ("Email or password is incorrect")
  │     ├─ email unverified → specific state + "Resend verification"*
  │     └─ account blocked/inactive → specific message + support path
  ├─ "Continue with Google" → full-page redirect to backend OAuth → return
  │     └─ success → session → redirect ;  failure → /auth?oauth=error → inline error
  ├─ "Forgot password?"* → password-reset flow (gated on backend)
  └─ "Register" tab → switches to register mode (no navigation loss)
```

**Detailed reasoning:**
- **Redirect-after-login:** honoring `next` is what makes login feel like a checkpoint, not a detour — critical for the checkout sign-in gate.
- **OAuth is a full-page redirect** (it can't run through fetch) — the existing behavior; on failure the backend returns to `?oauth=error`, which the page surfaces as an inline error.
- **Registration doesn't sign in** (per the backend): a user arriving from Register lands in login mode with their email prefilled and a "verify your email, then sign in" success notice.

---

## Empty States

Login has no data lists, so "empty" means the **initial form** state: fields empty, no errors, submit enabled. There is no blank/empty region to design — the form is always fully present. (If a `?next=` implies a protected destination, an optional one-line context banner — "Sign in to continue to checkout" — orients the user.)

---

## Loading States

- **Submitting:** the "Sign in" button enters a loading state (spinner + preserved width, label → "Signing in…"), the form disables to prevent double-submit; on success the redirect happens (a brief full-view "Signing you in…" is acceptable if session restore takes time).
- **Session restore on load:** if the app is restoring a session (token refresh), a visiting user may briefly see a neutral loading state before the form (or before an already-signed-in redirect) — never a flash of the form for an already-authenticated user where avoidable.
- **OAuth redirect:** clicking Google shows a brief "Redirecting to Google…" before the full-page navigation.
- Timing per design system; the submit button is the single source of "working" feedback.

---

## Error States

Specificity is the whole point — each failure is distinct, `role="alert"`, actionable:

| Failure | Message (intent) | Action offered |
|---|---|---|
| Wrong email/password | "Email or password is incorrect." | Re-enter; "Forgot password?"* |
| Email not verified | "Please verify your email before signing in." | "Resend verification email"* |
| Account blocked/inactive | "This account is not active. Contact support." | Support link |
| OAuth failed/cancelled | "Google sign-in didn't complete. Try again." | Retry Google / use email |
| Network/server error | "Something went wrong. Please try again." | Retry |
| Rate-limited *(future)* | "Too many attempts. Try again in a moment." | Wait / reset |

**Reasoning:** collapsing these into one generic error is the most common auth anti-pattern — it strands the unverified user and the blocked user alike. (Security note: "wrong email or password" is intentionally *not* split into "no such email" vs "wrong password" — that distinction leaks account existence.)

---

## Search & Filtering Behavior

**Not applicable.** Login has no searchable/filterable content, and the global header search is **absent from the Auth shell** (a focused surface, like checkout — nothing to distract from signing in). Stated explicitly so no one adds a search box here.

## Sorting Behavior

**Not applicable** — there are no lists to sort.

## Pagination / Infinite Scroll

**Not applicable** — a single form on one screen; nothing to paginate.

---

## Accessibility

- **Structure:** one `h1` (the sign-in heading); the mode switch is a `tablist`/`tab` pair with `aria-selected`; the form is a real `form` with a submit button.
- **Fields:** every field has a persistent visible label (not placeholder-as-label); `autocomplete="email"` and `autocomplete="current-password"`; the show/hide toggle is a button with an `aria-label` and `aria-pressed`.
- **Errors:** inline, tied to fields via `aria-describedby` + `aria-invalid`; the form-level error is `role="alert"` and receives focus/announcement on failure.
- **Keyboard:** full keyboard operation; Enter submits; visible instant focus rings; logical order email → password → submit → alternatives.
- **OAuth button** has a clear accessible name ("Continue with Google") and announces the redirect intent.
- **Contrast** ≥ 4.5:1 both themes; state never by color alone. **Reduced motion** honored. **Caps-lock**: an optional non-intrusive hint on the password field.

**Reasoning:** the login form is small but high-stakes for a11y — correct labels, autocomplete tokens (so password managers work), and an announced, focus-managed error are the decisive details.

---

## Responsive Rules

Verified at 320 / 375 / 414 / 768 / 1024 / 1280px. Brand panel: full (lg) → slim (md) → header only (mobile). Form is always a single comfortable column, full-width fields, ≥44px targets. No horizontal scroll; the page grows with content (no viewport lock). Buttons go full-width on mobile.

## Motion

Minimal. Mode-switch between Sign in/Register: a quick cross-fade of the form (`opacity`, `--dur-fast`), reduced-motion → instant. Submit button loading is a spinner (no bounce). No animated backgrounds, no gradient motion, focus rings instant. **Reasoning:** auth should feel immediate and calm; motion here only confirms the mode change and the working state.

---

## Edge Cases

| Case | Behavior |
|---|---|
| Already signed in | Redirect to `next`/home; don't show the form. |
| Unverified email | Specific state + resend*; don't grant a session. |
| Blocked/inactive account | Specific message + support; no session. |
| OAuth cancelled/failed | `?oauth=error` → inline error; email path still available. |
| `?next=` to a protected page | Return there after success; if `next` is invalid/external, fall back to home (never redirect off-site). |
| Double submit | Button locks during the request. |
| Session expires mid-session elsewhere | Handled by the API client's refresh; a hard failure routes back to login with `next`. |
| Password manager autofill | Correct autocomplete tokens ensure autofill works. |
| Very long email/password | Accepted; fields scroll internally; no layout break. |
| Wrong-tab arrival (meant to register) | One tap to Register; entered email carries over. |

---

## Future Improvements

- **Password reset ("Forgot password?")** — currently no backend reset endpoint; the link is gated until it exists (never show a link that goes nowhere).
- **Resend verification** from the login error state (ties to the email-verification backend).
- **"Remember me" / session length** control.
- **Rate-limiting / lockout UX** with clear cooldown messaging.
- **Additional OAuth providers** (e.g., Facebook) as the backend adds them.
- **Passkeys / 2FA** once supported.
- **Magic-link / passwordless** sign-in.

---

*End of specification. Build order: (1) AuthShell + AuthModeSwitch (shared with Register) on the unified tokens, no local theme toggle; (2) login form with PasswordInput, validation, and the specific error matrix; (3) redirect-after-login (`next`) + already-signed-in guard; (4) Google OAuth redirect + `?oauth=error` handling; (5) gate Forgot-password/Resend-verification on backend availability.*
