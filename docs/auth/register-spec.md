# TechShop Register — Design Specification

**Status:** Implementation-ready · **Version:** 1.0 · **Last updated:** 2026-08-07
**Governed by:** [`design-system.md`](../design-system.md) · **Pairs with:** [`login-spec.md`](./login-spec.md)
**Route:** `/auth` (register mode).

**Shared-shell note.** Register is the second **mode** of the one Auth surface described in [`login-spec.md`](./login-spec.md) — same two-panel shell, mode switch, OAuth button, unified tokens, and app-wide theme (no local toggle). This document specifies only what's **register-specific**: the extra fields, the **live email-availability check**, the **live password-requirement checklist**, and the **register-then-verify** flow. Shell-level behavior is defined once in the login spec and not repeated.

---

## Table of contents

Purpose · Target Users · Primary User Goals · Information Architecture · Desktop Layout · Tablet Layout · Mobile Layout · Visual Hierarchy · Components Used · User Flow · Empty States · Loading States · Error States · Search & Filtering Behavior · Sorting Behavior · Pagination / Infinite Scroll · Accessibility · Responsive Rules · Motion · Edge Cases · Future Improvements

---

## Purpose

Let a new visitor create an account with a **valid, unique email** and a **strong password**, with as little friction and as few surprises as possible — then hand them off to verify their email and sign in. Registration's job is to prevent the two failures that waste the user's effort: submitting an email that's already taken/disposable (caught *before* submit, live) and choosing a password the system will reject (shown as a *live checklist*, not a post-submit error).

**Key backend truth that shapes the flow:** registration **does not sign the user in**. It creates the account and triggers an email verification; the user must verify, then sign in. The UI must set this expectation clearly so no one thinks they're logged in when they aren't.

---

## Target Users

| User | Situation | Needs most |
|---|---|---|
| **New customer** | First purchase intent | Quick account creation; clear password rules |
| **Cautious signer-up** | Wary of spam / commitment | Understand what's required and what happens next |
| **OAuth-preferring user** | Doesn't want a password | "Continue with Google" as a one-tap path |
| **Typo-prone user** | Mistypes email / weak password | Live email check + live password checklist prevent dead submits |
| **Checkout-driven registrant** | Sent from checkout to make an account | Fast creation, then back to the purchase |

---

## Primary User Goals

1. **Create an account quickly** — the fewest required fields.
2. **Avoid a rejected submit** — know *before* pressing the button that the email is available and the password is strong enough.
3. **Understand what happens next** — that they must verify their email, then sign in.
4. **Use Google instead** — skip password creation entirely.
5. **Switch to sign-in** — one tap if they already have an account.

Goals 2 and 3 are the register-specific heart: live validation prevents wasted submits; the post-register message prevents the "am I logged in?" confusion.

---

## Information Architecture

```
Auth shell (shared)  — register mode
└─ Form panel
   ├─ Mode switch        [ Sign in | Register ]     ← "Register" active
   ├─ Heading            "Start with TechShop" / "Create your account"
   ├─ Register form
   │    ├─ Full name        (required, ≥2 chars)
   │    ├─ Email            (required, valid, unique → live check)
   │    ├─ Password         (required, meets rules → live checklist)  · show/hide
   │    └─ Phone            (optional)
   ├─ Consent               T&C / Privacy acknowledgement*
   ├─ Submit                "Create account"
   ├─ OAuth divider "or"
   └─ Google button         "Continue with Google"
```

Fields mirror the backend account model (full name, email, password, optional phone). **Required vs optional is explicit** (phone is clearly optional). The live email-availability state and the password checklist are attached to their fields.

---

## Desktop / Tablet / Mobile Layout

Layout is inherited from the shared Auth shell (see [`login-spec.md`](./login-spec.md) → Desktop/Tablet/Mobile): two-panel on desktop, slim brand band on tablet, single-column with a compact brand header on mobile; content-height (no viewport lock); full-width fields; ≥44px targets.

**Register-specific layout notes:**
- The register form is **taller** than login (four fields + checklist + consent). The form panel **scrolls** if the viewport is short — this is exactly the case the audit's "unlock the viewport" fix was for; never clip the form.
- The **password requirement checklist** renders directly beneath the password field and updates live; it must not push the submit button off-screen on small viewports (the panel scrolls; the checklist is compact).
- On mobile, fields are one-per-row; the checklist is a tight vertical list.

---

## Visual Hierarchy

1. **Form heading + fields + "Create account"** — the task; primary button is the one `--color-primary` fill.
2. **Live feedback** — the email-availability line and the password checklist are prominent *at their fields* (they're the anti-frustration mechanism), using semantic success/danger + icon.
3. **Mode switch** — "Register" active, "Sign in" one tap away.
4. **Google button** — strong secondary alternative below "or".
5. **Consent + phone(optional) + brand panel** — quiet; clearly lower priority.

**Applied rules:** one primary action; required-ness obvious; success/error states pair color with icon + text; headings roman; no gradients. **Reasoning:** the live-validation feedback earns visual prominence because it's what prevents a failed submit — it's functional, not decorative.

---

## Components Used

Shared with login (AuthShell, AuthModeSwitch, PasswordInput, OAuthButton) plus register-specific:

| Area | Components |
|---|---|
| Fields | Input (full name, email, phone) · PasswordInput |
| Live email | **EmailAvailability** *(new: checking / available / taken / disposable states)* |
| Live password | **PasswordRuleChecklist** *(new: the 5 rules, each valid/invalid)* |
| Consent | Checkbox (T&C / Privacy) with links* |
| Submit / OAuth | Button (primary "Create account") · OAuthButton (Google) |
| Feedback | Alert / inline errors · success notice |

The 5 password rules (uppercase · lowercase · number · special character · ≥8 chars) and the debounced email check already exist in the codebase; this formalizes them as named components on the unified tokens.

---

## User Flow

```
Enter /auth → Register tab
  ├─ Type email → (debounced ~500ms) live check → available ✓ / taken / disposable ✗
  ├─ Type password → live checklist updates each rule ✓/✗
  ├─ Fill name (+ optional phone) → accept consent* → Create account
  │     ├─ success → account created, NOT signed in
  │     │     → switch to LOGIN mode, email prefilled,
  │     │       success notice: "Account created. We emailed a verification link to {email}.
  │     │       Verify it, then sign in."
  │     └─ failure → specific inline error (email taken / weak password / server)
  └─ "Continue with Google" → OAuth redirect (may create the account) → return
```

**Detailed reasoning:**
- **Live email check** (debounced, runs only on a well-formed email) prevents the most common wasted submit; it stays silent on network errors (don't block the user for a flaky check).
- **Live password checklist** turns password rules from a post-submit error into a guided, satisfying "tick the boxes" — the user never guesses why a password was rejected.
- **Register → verify → login** is made explicit by switching to login mode with the email prefilled and a clear next-step message, because the backend intentionally doesn't create a session on register.

---

## Empty States

Like login, register has no data lists — "empty" is the **pristine form**: all fields empty, no errors, the password checklist showing all rules unmet (as guidance, not as errors), submit enabled (validation happens on submit and live). There's no blank region to design.

---

## Loading States

- **Email availability:** a small inline "Checking…" state on the email field while the debounced request runs; resolves to available/taken/disposable. Non-blocking.
- **Submitting:** "Create account" enters a loading state (spinner + "Creating account…"), form disables to prevent double-submit.
- **OAuth:** "Redirecting to Google…" before the full-page navigation.
- Timing per design system; the email-check loader must not cause layout shift (reserve its line).

---

## Error States

Field-specific and actionable (`role="alert"` for the form-level case):

| Failure | Behavior |
|---|---|
| Invalid email format | Inline on the email field ("Enter a valid email, e.g. user@gmail.com"). |
| Email already taken | Live + on submit: "This email is already registered." + a "Sign in instead" affordance. |
| Disposable email blocked | "Please use a non-disposable email address." |
| Password fails rules | The checklist shows exactly which rules are unmet; submit is blocked with a summary. |
| Name too short | Inline ("Full name must be at least 2 characters"). |
| Phone invalid (if entered) | Inline format hint; phone stays optional. |
| Consent not accepted* | Block submit; highlight the consent checkbox. |
| Verification email send fails | Account may still be created; message: "Account created, but we couldn't send the verification email — you can resend it from your profile." |
| Server/network | "Something went wrong. Please try again." + retry. |

**Reasoning:** every error points at the field and the fix; the "email taken" case actively offers the sign-in path (the likely real intent).

---

## Search & Filtering Behavior

**Not applicable** — no searchable content; the header search is absent from the Auth shell (focused surface). Stated so none is added.

## Sorting Behavior

**Not applicable** — no lists.

## Pagination / Infinite Scroll

**Not applicable** — one form. (If more fields are ever added, they stay on one scrolling panel — registration is never split into paginated steps at this scale.)

---

## Accessibility

- **Structure:** one `h1`; the mode switch is a `tablist`; a real `form` with a submit.
- **Fields:** persistent visible labels; `autocomplete` tokens (`name`, `email`, `new-password`, `tel`); required fields marked programmatically; phone clearly optional.
- **Live email state** is announced politely (`aria-live`) so non-visual users hear "email available/taken" without it being noisy.
- **Password checklist** is associated with the password field (`aria-describedby`); each rule's met/unmet state is conveyed by text + icon, not color alone; the live updates are announced succinctly (or summarized) — not one announcement per keystroke.
- **Errors:** inline, `aria-invalid` + `aria-describedby`; form-level error focus-managed.
- **Consent** checkbox is a labeled control with the T&C/Privacy links reachable.
- **Keyboard/contrast/reduced-motion:** full keyboard operation, instant focus rings, ≥4.5:1 contrast both themes, reduced-motion honored.

**Reasoning:** the two register-specific a11y risks are a *noisy* live region (announcing every keystroke of the checklist/email check) and color-only rule states — both explicitly avoided.

---

## Responsive Rules

Inherits the Auth shell responsiveness. Register-specific: the taller form **scrolls** on short viewports (never clipped — the audit fix); the password checklist is compact and never pushes the submit off-screen without scroll; fields one-up on mobile; full-width buttons.

## Motion

Minimal, per the shared shell. Register-specific: the email-availability and each password-rule state change with a quick, subtle icon/opacity transition (`--dur-fast`), reduced-motion → instant; no celebratory animation on a met rule (a simple check is enough). Mode-switch to login is a quick cross-fade. **Reasoning:** live feedback should feel responsive and calm, not gamified.

---

## Edge Cases

| Case | Behavior |
|---|---|
| Email taken | Live + submit error + "Sign in instead". |
| Disposable email | Blocked with reason. |
| Live check network failure | Silent; allow submit (server is the final authority). |
| Weak password | Checklist shows unmet rules; submit blocked. |
| Whitespace-only name | Trimmed; rejected if <2 chars. |
| Optional phone left blank | Accepted (optional). |
| OAuth account collision | Backend resolves; UI surfaces a clear result (signed in via Google, or "email already registered — sign in"). |
| Double submit | Button locks. |
| Register while already signed in | Redirect to home (don't show register to an authed user). |
| Verification email delayed/failed | Account created; offer resend (from profile); don't claim signed-in. |
| Very long inputs | Accepted; no layout break. |
| Arrived meaning to sign in | One tap to Sign in; email carries over. |

---

## Future Improvements

- **Sign-in on successful register** (if the backend later returns a session) — would drop the verify-then-login round trip; currently intentionally not done.
- **Inline email verification** (enter a code) instead of a link round-trip.
- **Password strength meter** (beyond the pass/fail checklist) for extra guidance.
- **Additional OAuth providers**; **passkeys/passwordless** signup.
- **Progressive profiling** — collect phone/preferences later, not at signup, to shorten the form further.
- **Referral / promo capture** at signup once those modules exist.

---

*End of specification. Build order: (1) reuse the AuthShell/ModeSwitch/PasswordInput/OAuthButton from login; (2) register fields + EmailAvailability (debounced) + PasswordRuleChecklist (the 5 rules); (3) the register→verify→login handoff (switch to login, prefill email, next-step notice); (4) consent + the specific error matrix; (5) Google OAuth path. Keep the panel scrollable (no viewport lock) and the live regions non-noisy.*
