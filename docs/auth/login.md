# TechShop Login — Page Design Spec

**Structure mirrors [`pages/home.md`](../pages/home.md)** (with an added *Error handling* section, since error handling is a focus). **Governed by [`design-system.md`](../design-system.md).** Markdown only — no code.
**Route:** `/auth` (login is the default mode).

**Focus scorecard** — how this page serves the six priorities:

| Focus | How the login page delivers it |
|---|---|
| **Trust** | Honest, non-enumerating errors · minimal data ask (email + password) · brand consistency · secure-context signal · no dark patterns |
| **Simplicity** | Two fields, one primary action, one OAuth shortcut — nothing else competes |
| **Fast completion** | Password-manager/autofill tokens · Enter-to-submit · one-tap Google · return-to-intended-page after login |
| **Error handling** | Specific, actionable, inline errors with focus management; no generic "login failed" |
| **Mobile usability** | ≥16px inputs (no zoom-on-focus) · ≥44px targets · full-width actions · single column · no viewport lock |
| **Accessibility** | Real labels, autocomplete tokens, announced errors, instant focus rings, full keyboard |

---

## 1. Goals

Get an existing user authenticated in the **fewest possible seconds**, return them to whatever they were doing, and make any failure **immediately understandable**. Login is a checkpoint, not a destination — its success metric is time-to-signed-in for a legitimate user and clarity-of-reason for a blocked one.

**Primary action:** sign in (email + password, or Google). **Secondary:** switch to register; recover access (forgot password / verify email).

---

## 2. User journey

- **Returning customer:** lands → password manager fills both fields → Enter → back to shopping. *(Fast completion.)*
- **OAuth user:** lands → "Continue with Google" → returns signed in. *(Simplicity/speed.)*
- **Checkout returner:** sent here mid-purchase (`?next=/checkout`) → signs in → lands **back on checkout with cart intact**. *(Trust — no lost work.)*
- **Just-registered user:** arrives with email prefilled + a "verify your email, then sign in" notice. *(Continuity.)*
- **Blocked/wrong-credential user:** gets a **specific** reason and a next step, never a dead end. *(Error handling.)*

---

## 3. Design stance (Hallmark framing)

- **Genre:** focused utility surface — the calm, credible school of Stripe/Linear auth. Restraint is the trust signal.
- **Shell:** the shared **two-panel Auth shell** (brand panel + form panel) on desktop; single column on mobile. Defined here and reused by [`register.md`](./register.md), [`forgot-password.md`](./forgot-password.md), [`verify-email.md`](./verify-email.md), [`reset-password.md`](./reset-password.md).
- **Anti-patterns avoided (all audit-flagged):** **no gradient hero, no radial-glow, no glassmorphism, no viewport lock (`100svh; overflow:hidden`), no local theme toggle, no parallel color tokens.** The page uses the app-wide theme and unified tokens.
- **Trust through restraint:** a login form that looks over-designed or asks for more than it needs reads as *less* trustworthy. Two fields, one button, brand-correct, on a solid surface.

---

## 4. Page layout & shell (the shared Auth shell)

**Customer is *not* in the shopping shell here** — the full shop header/footer (search, cart, departments) is replaced by a **minimal auth chrome** (brand mark that links home + a quiet "secure" cue). Fewer exits = more completions and a calmer, more trustworthy surface.

```
Desktop (≥1024px)                          Mobile (<768px)
┌───────────────┬───────────────────┐      ┌───────────────────┐
│ BRAND PANEL   │ FORM PANEL         │      │ brand header (1 ln)│
│ TechShop      │ [Sign in|Register] │      │ [Sign in|Register] │
│ one value line│ Welcome back       │      │ Welcome back       │
│ product image │ Email    [______]  │      │ Email   [________] │
│ (solid surface│ Password [____] 👁  │      │ Password[_____] 👁  │
│  — no gradient│ Forgot password?   │      │ Forgot password?   │
│  no glow)     │ [   Sign in    ]   │      │ [    Sign in    ]  │
│               │ ──── or ────       │      │ ──── or ────       │
│               │ [G Continue Google]│      │ [G Continue Google]│
└───────────────┴───────────────────┘      └───────────────────┘
```

- Brand panel ~45% (desktop only), form panel ~55%; form column ~360–420px, fields full-width.
- The page **grows with content and scrolls** — never clipped (the register/reset forms are taller; the shell must not lock height).
- Surfaces use `--color-surface`; the brand image sits on a solid tinted surface.

---

## 5. Element order & rationale

Top → bottom in the form panel, each justified:

1. **Mode switch [Sign in | Register]** — orients first; a wrong-tab arrival is one tap from correction. *(Simplicity.)*
2. **Heading** ("Welcome back" / "Sign in to TechShop") — confirms where they are.
3. **Email field** — the identifier; first because it's what the password manager anchors on.
4. **Password field (+ show/hide)** — directly under email for natural reading + manager autofill order.
5. **"Forgot password?" link** — placed at the password field, where the need arises. *(Error recovery in reach.)*
6. **Sign in (primary button)** — the one primary action; full-width.
7. **"or" divider → Continue with Google** — the alternative, clearly secondary, below the primary path so it never competes. *(Speed without hijacking the default.)*

**No "remember me" clutter in v1**, no marketing, no extra links — every element earns its place. *(Simplicity/trust.)*

---

## 6. Element-by-element specification

- **Mode switch:** segmented tabs; "Sign in" active; `role="tablist"`. Switching to Register cross-fades the form in place (no navigation loss).
- **Email input:** `type="email"`, `inputmode="email"`, `autocomplete="email"`, persistent visible label, placeholder `user@gmail.com`. Font-size ≥16px so mobile Safari doesn't zoom on focus. *(Mobile usability.)*
- **Password input:** `type="password"` with a show/hide toggle (icon button, `aria-label`, `aria-pressed`), `autocomplete="current-password"`. Enter submits the form. Optional caps-lock hint.
- **Forgot-password link:** routes to [`forgot-password.md`](./forgot-password.md). *(Gated on backend — see §15; hidden if unavailable, never a dead link.)*
- **Primary button "Sign in":** full-width, `--color-primary`, loading state on submit ("Signing in…"), disabled during the request to prevent double-submit.
- **OAuth button "Continue with Google":** outlined/neutral (secondary weight), brand-correct Google mark, full-page redirect to the backend OAuth endpoint; failure returns to `/auth?oauth=error`.
- **Brand panel:** wordmark + one value line + one real product image on a solid surface. Reassurance, not spectacle.

---

## 7. Visual hierarchy

1. **Heading + the two fields + Sign in** — the task; the primary button is the only `--color-primary` fill.
2. **Mode switch** — clear active state.
3. **Google button** — strong but visually secondary (below "or").
4. **Forgot-password link** — quiet, near the password.
5. **Brand panel** — present, non-competing.

Rules: one primary action; email→password→submit reading order; headings roman; error text semantic-danger with icon; generous field spacing so the form reads as "one easy thing." *(Simplicity + trust.)*

---

## 8. Responsive behavior

Verified at 320 / 375 / 414 / 768 / 1024 / 1280px.

| Width | Behavior |
|---|---|
| ≥1024 | Two-panel; brand left, form right. |
| 768–1023 | Brand panel narrows to a slim top band (wordmark + one line); form dominates. |
| <768 | Single column: compact brand header, mode switch, form full-width; buttons full-width; inputs ≥44px tall and ≥16px text (no zoom-on-focus). |

No horizontal scroll; page grows with content (no lock); the submit button is thumb-reachable at the bottom of the form. *(Mobile usability.)*

---

## 9. Component composition

Shared library only: **AuthShell** (brand + form panels) · **AuthModeSwitch** · Input (email) · **PasswordInput** (show/hide) · Button (primary "Sign in") · **OAuthButton** (Google) · Alert / inline field errors. AuthShell, AuthModeSwitch, PasswordInput, and OAuthButton are shared with register/forgot/verify/reset.

---

## 10. Empty / initial state

Login has no data lists — the "empty" state is the **pristine form**: fields empty, no errors, submit enabled. If `?next=` implies a protected destination, an optional one-line context banner orients ("Sign in to continue to checkout"). If the user is **already signed in**, the page redirects to `next`/home rather than showing a form.

---

## 11. Loading states

- **Submitting:** button → spinner + "Signing in…"; form disabled; a brief full-view "Signing you in…" is acceptable if session setup lags.
- **Session restore on entry:** if the app is restoring a session, show a neutral loading beat before deciding form-vs-redirect (avoid flashing the form to an already-authed user).
- **OAuth:** "Redirecting to Google…" before the full-page navigation.

Timing per design system; the button is the single source of "working" feedback.

---

## 12. Error handling

The heart of trust here. Each failure is **distinct, actionable, `role="alert"`, focus-managed**:

| Failure | Message intent | Next step |
|---|---|---|
| Wrong email/password | "Email or password is incorrect." | Re-enter · Forgot password? |
| Email not verified | "Verify your email before signing in." | Resend verification → [`verify-email.md`](./verify-email.md) |
| Account blocked/inactive | "This account isn't active. Contact support." | Support |
| OAuth failed/cancelled | "Google sign-in didn't finish. Try again." | Retry / use email |
| Network/server | "Something went wrong. Please try again." | Retry |
| Rate-limited *(future)* | "Too many attempts — try again shortly." | Wait |

**Security decision (trust):** the wrong-credentials message is **deliberately not split** into "no such email" vs "wrong password" — distinguishing them leaks whether an account exists (enumeration). One combined message protects users.

---

## 13. Micro-interactions

Minimal. Mode switch (Sign in ↔ Register): quick form cross-fade (`opacity`, `--dur-fast`); reduced-motion → instant. Show/hide password: instant icon swap. Submit: spinner (no bounce). Focus rings appear **instantly**. No animated backgrounds, no gradient motion. *(Calm = trustworthy.)*

---

## 14. Accessibility considerations

- One `h1` (sign-in heading); mode switch is a `tablist`/`tab` with `aria-selected`; a real `<form>` with a submit.
- Persistent visible labels (not placeholder-as-label); `autocomplete="email"` / `"current-password"` so password managers work (also a speed win).
- Show/hide toggle is a button with `aria-label` + `aria-pressed`.
- Errors inline via `aria-invalid` + `aria-describedby`; the form-level error is `role="alert"` and receives focus/announcement on failure.
- Full keyboard operation; Enter submits; visible **instant** focus rings ≥3:1; logical order email → password → submit → alternatives.
- Contrast ≥4.5:1 both themes; state never by color alone; reduced-motion honored; ≥44px targets.

---

## 15. Trust, security & data dependencies

- **Data asked:** only email + password (or delegate to Google). Minimal ask = higher trust.
- **Secure context:** served over HTTPS; a quiet lock/secure cue in the auth chrome; no third-party clutter on the auth surface.
- **No dark patterns:** no pre-checked marketing, no forced account nudges, honest error copy, no fake urgency.
- **Endpoints (existing):** `POST /auth/login`, `GET /auth/me`, `POST /auth/refresh`, Google OAuth redirect. Session stored per the app's auth storage; token refresh handled by the shared API client.
- **`next` redirect:** validated to be an internal path only (never redirect off-site).
- **Graceful degradation:** if OAuth is unavailable, hide the Google button rather than show a broken one; if "forgot password" has no backend yet, hide the link (§Error handling / [`forgot-password.md`](./forgot-password.md)).

---

*Build order: AuthShell + ModeSwitch + PasswordInput + OAuthButton on unified tokens (no theme toggle, no viewport lock) → login form + the specific error matrix + focus management → `next` redirect + already-signed-in guard → Google OAuth + `?oauth=error` → gate Forgot-password on backend.*
