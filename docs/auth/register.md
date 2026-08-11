# TechShop Register — Page Design Spec

**Structure mirrors [`pages/home.md`](../pages/home.md)** (+ *Error handling* section). **Governed by [`design-system.md`](../design-system.md).** Markdown only.
**Route:** `/auth` (register mode). **Shares the Auth shell defined in [`login.md`](./login.md)** — shell/layout/responsive/chrome are specified there and only summarized here.

**Focus scorecard:**

| Focus | How the register page delivers it |
|---|---|
| **Trust** | Says what data is for + what happens next (verify email) · minimal required fields · no spam/dark patterns · clear consent |
| **Simplicity** | Only name + email + password required; phone optional; one primary action |
| **Fast completion** | **Live** email-availability + password checklist prevent failed submits; `new-password` autocomplete; one-tap Google |
| **Error handling** | Field-specific errors caught *before* submit; "email taken → sign in" path |
| **Mobile usability** | Scrolling panel (taller form) · ≥16px inputs · ≥44px targets · one-up fields |
| **Accessibility** | Labeled fields, non-noisy live regions, checklist tied to the field, announced errors |

---

## 1. Goals

Let a new visitor create an account with a **valid, unique email** and a **strong password**, with the fewest surprises, then hand off to verify-email → sign-in. Registration prevents the two effort-wasting failures **before** submit: an already-taken/disposable email (caught live) and a password the system will reject (shown as a live checklist, not a post-submit error).

**Key truth shaping the flow:** registration **does not sign the user in** — it creates the account and triggers a verification email. The UI must set that expectation so nobody thinks they're logged in when they aren't.

---

## 2. User journey

- **New customer:** name → email (live "available ✓") → password (ticks the checklist) → Create account → "verify your email, then sign in." *(Fast, no failed submit.)*
- **Typo-prone user:** live email check flags "taken/disposable" and the checklist shows exactly which password rule is unmet — no dead submit. *(Error prevention.)*
- **OAuth-preferring user:** skips the form with "Continue with Google." *(Speed.)*
- **Checkout-driven registrant:** creates an account fast, then returns to the purchase (via `next`).

---

## 3. Design stance (Hallmark framing)

Same shell and restraint as [`login.md`](./login.md) — solid surfaces, no gradient/glow/glass, unified tokens, app-wide theme, **scrolling panel** (the register form is taller and must never be clipped — the audit's viewport-unlock fix). Register-specific stance: the **live-validation feedback earns visual prominence** because it's the anti-frustration mechanism — it's functional, not decoration.

---

## 4. Page layout & shell

Inherits the Auth shell from [`login.md`](./login.md) (§4): two-panel desktop, slim brand band on tablet, single-column mobile, minimal auth chrome, no viewport lock. Register-specific: the form panel is taller (four fields + checklist + consent) and **scrolls** on short viewports; the password checklist renders directly beneath the password field and must not push the submit off-screen without scroll.

---

## 5. Element order & rationale

1. **Mode switch [Sign in | Register]** — "Register" active; wrong-tab arrivals recover in one tap.
2. **Heading** ("Create your TechShop account").
3. **Full name** — first because it's the simplest field to start momentum.
4. **Email (+ live availability)** — early, because catching "taken/disposable" here saves the whole submit.
5. **Password (+ show/hide + live checklist)** — the checklist sits directly under the field so guidance is where the effort is.
6. **Phone (optional)** — clearly marked optional; last of the inputs because it's not required.
7. **Consent** (T&C / Privacy) — immediately above the action, so acceptance is deliberate.
8. **Create account (primary)**, then **"or" → Continue with Google**.

Required fields (name, email, password) come before the optional (phone); the fewest required fields = fastest completion. *(Simplicity.)*

---

## 6. Element-by-element specification

- **Full name:** `autocomplete="name"`, ≥2 chars, persistent label.
- **Email:** `type="email"`, `autocomplete="email"`, **live availability** — debounced ~500ms, runs only on a well-formed email; states: *checking / available ✓ / taken / disposable*. Silent on network failure (don't block on a flaky check).
- **Password:** `type="password"` + show/hide, `autocomplete="new-password"`; a **live rule checklist** (uppercase · lowercase · number · special char · ≥8 chars), each rule flipping valid/invalid as the user types.
- **Phone:** `type="tel"`, `autocomplete="tel"`, optional, lenient validation.
- **Consent:** a checkbox with reachable T&C/Privacy links; blocks submit if unchecked.
- **Create account:** full-width primary, loading state ("Creating account…"), disabled during submit.
- **Google:** same OAuthButton as login.

---

## 7. Visual hierarchy

1. Heading + fields + **Create account** (the one primary fill).
2. **Live feedback** (email state + password checklist) — prominent *at their fields*, semantic success/danger + icon.
3. Mode switch.
4. Google button (secondary, below "or").
5. Consent + optional phone + brand panel — quiet.

Rules: required-ness obvious; success/error pair color + icon + text; headings roman; no gradients. The live feedback is visible because it's what prevents a failed submit.

---

## 8. Responsive behavior

Inherits [`login.md`](./login.md) §8. Register-specific: taller form **scrolls** (never clipped); fields one-up on mobile; the checklist is a tight vertical list that doesn't crowd the submit; full-width buttons; ≥16px inputs (no zoom-on-focus).

---

## 9. Component composition

Shared shell components (AuthShell, ModeSwitch, PasswordInput, OAuthButton) + register-specific: Input (name, email, phone) · **EmailAvailability** (checking/available/taken/disposable) · **PasswordRuleChecklist** (5 rules) · Checkbox (consent) · Button (primary "Create account") · Alert / inline errors.

---

## 10. Empty / initial state

The **pristine form**: all fields empty, no errors, the password checklist showing all rules unmet **as guidance (not errors)**, submit enabled. No blank region to design.

---

## 11. Loading states

- **Email availability:** inline "Checking…" on the field (reserve its line to avoid layout shift); resolves to available/taken/disposable. Non-blocking.
- **Submitting:** "Create account" → spinner + "Creating account…", form disabled (prevents double-submit).
- **OAuth:** "Redirecting to Google…".

---

## 12. Error handling

Field-specific, actionable (`role="alert"` for form-level):

| Failure | Behavior |
|---|---|
| Invalid email format | Inline on the field. |
| Email already taken | Live + on submit: "This email is already registered." + **"Sign in instead"** affordance. |
| Disposable email | "Use a non-disposable email address." |
| Password too weak | Checklist shows the unmet rule(s); submit blocked with a summary. |
| Name too short | Inline ("At least 2 characters"). |
| Phone invalid (if entered) | Inline hint; phone stays optional. |
| Consent unchecked | Block submit; highlight the checkbox. |
| Verification email failed to send | Account may exist; "Account created, but we couldn't send the verification email — resend from your profile." → [`verify-email.md`](./verify-email.md) |
| Server/network | "Something went wrong. Try again." |

The "email taken" case actively offers **sign in** (the likely real intent). *(Trust + error recovery.)*

---

## 13. Micro-interactions

Minimal. Each email-state and password-rule change uses a quick, subtle icon/opacity transition (`--dur-fast`); reduced-motion → instant. **No celebratory animation on a met rule** — a simple check is enough (calm, not gamified). Mode switch → login: quick cross-fade.

---

## 14. Accessibility considerations

- One `h1`; mode switch is a `tablist`; real `<form>`.
- Persistent labels; `autocomplete` tokens (`name`/`email`/`new-password`/`tel`); required-ness programmatic; phone clearly optional.
- **Live regions are non-noisy:** email availability announces politely (`aria-live="polite"`) on resolution, not per keystroke; the password checklist is associated with the field (`aria-describedby`) and its updates are summarized, not announced letter-by-letter.
- Rule states convey via text + icon (not color alone).
- Errors inline (`aria-invalid`/`aria-describedby`); form-level error focus-managed.
- Consent is a labeled control with reachable policy links; full keyboard; instant focus rings; ≥4.5:1 contrast; reduced-motion honored.

The two register-specific a11y risks — a *noisy* live region and *color-only* rule states — are explicitly avoided.

---

## 15. Trust, security & data dependencies

- **Minimal required data** (name/email/password); phone optional; a clear reason for each field. *(Trust.)*
- **Verify-then-use** explained up front (no false "you're in" impression).
- **Consent** is explicit and honest; no pre-checked marketing.
- **Endpoints (existing):** `POST /auth/register`, the debounced `check-email`, and the verification-email trigger; Google OAuth. Reset/resend paths per [`verify-email.md`](./verify-email.md).
- **Graceful degradation:** if the live email check is down, allow submit (server is the final authority); if OAuth is unavailable, hide the Google button.

---

*Build order: reuse the login shell components → register fields + EmailAvailability + PasswordRuleChecklist → the register→verify→login handoff (switch to login mode, prefill email, next-step notice) → consent + specific error matrix → Google OAuth. Keep the panel scrollable and the live regions non-noisy.*
