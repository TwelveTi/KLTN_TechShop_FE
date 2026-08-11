# TechShop Reset Password — Page Design Spec

**Structure mirrors [`pages/home.md`](../pages/home.md)** (+ *Error handling*). **Governed by [`design-system.md`](../design-system.md).** Markdown only.
**Route:** `/auth/reset-password?token=…` (reached from the link emailed by [`forgot-password.md`](./forgot-password.md)). **Shares the Auth shell defined in [`login.md`](./login.md).**
**Backend dependency:** requires reset endpoints — validate token + set new password (e.g., `POST /auth/reset-password`). Not built yet; the page is spec'd ready and the whole flow is gated with forgot-password. See §15.

**Focus scorecard:**

| Focus | How this page delivers it |
|---|---|
| **Trust** | Validates the token first; single-use/expiring token; invalidates other sessions on reset; never reveals account info |
| **Simplicity** | One task: set a new password (with confirm); one primary action |
| **Fast completion** | Autofocus the new-password field; `new-password` autocomplete; live checklist; show/hide |
| **Error handling** | Distinct invalid/expired/used-token states + weak-password + mismatch, each with a fix |
| **Mobile usability** | Single column, ≥16px inputs, ≥44px button, scrolling panel (field + checklist) |
| **Accessibility** | Labeled fields, checklist tied to the field, announced result, focus management |

---

## 1. Goals

Let a user who followed a valid reset link **set a new password** and get back into their account — securely and without friction. The page must first prove the link is legitimate (validate the token), then make choosing a strong password easy (the same live checklist as register), then confirm success and route to sign-in (or straight in).

**Primary action:** set new password. The page is **token-gated** — an invalid/expired/used token never shows the form.

---

## 2. User journey

- **Recovering user:** clicks the email link → token validates → sets a new password (checklist guides strength) → success → signed in / routed to sign-in with a success notice. *(Fast, clear.)*
- **Late user (expired token):** lands → "This reset link has expired" → one tap to **request a new link** ([`forgot-password.md`](./forgot-password.md)). *(Error recovery, not a dead end.)*
- **Reused-link user:** the token was already used → clear message + request-new path. *(Security + clarity.)*
- **Weak-password user:** the checklist blocks a too-weak password before submit; the confirm field catches mismatches. *(Error prevention.)*

---

## 3. Design stance (Hallmark framing)

Same restrained Auth shell as [`login.md`](./login.md), and the **same password UX as [`register.md`](./register.md)** (live rule checklist + show/hide) so a user meets one consistent password experience across the app. The load-bearing decisions here are **security-shaped**: validate the token before anything, treat it as single-use, and invalidate other sessions on success. The **scrolling panel** matters (field + checklist can be tall — never clip).

---

## 4. Page layout & shell

Inherits the Auth shell from [`login.md`](./login.md) §4 (centered card is fine). Three states in one shell:

```
VALIDATING            FORM (token valid)                 INVALID/EXPIRED/USED
┌──────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
│ Checking your│      │ Set a new password         │      │ This reset link has        │
│ reset link…  │      │ New password [______] 👁    │      │ expired.                   │
│  (spinner)   │      │  ✓ 8+ chars ✓ upper …      │      │ Request a new reset link   │
│              │      │ Confirm      [______] 👁    │      │ to continue.               │
│              │      │ [   Set new password   ]   │      │ [ Request new link ]       │
│              │      │ ‹ Back to sign in          │      │ ‹ Back to sign in          │
└──────────────┘      └───────────────────────────┘      └───────────────────────────┘
```

---

## 5. Element order & rationale

1. **Heading** ("Set a new password") — states the task.
2. **New password (+ show/hide + live checklist)** — autofocused on load so the user starts typing immediately. *(Fast completion.)* The checklist sits directly beneath it.
3. **Confirm password** — directly under, to catch typos before submit. *(Error prevention.)*
4. **Set new password (primary)** — the one action.
5. **Back to sign in** — an always-present escape (e.g., if they remembered their password).

The token-validation happens **before** this form ever renders (see §6) — the form only exists for a valid token.

---

## 6. Element-by-element specification

- **Token validation (on load):** the app validates `token` first and resolves to **valid** (show the form), **expired**, **invalid/malformed**, or **used**. A missing/empty token → invalid state. The form never renders for a bad token — no point letting a user type a password that can't be set.
- **New password:** `type="password"` + show/hide (`aria-label`/`aria-pressed`), `autocomplete="new-password"`, **autofocused**; the **live rule checklist** (uppercase · lowercase · number · special char · ≥8 chars) identical to register.
- **Confirm password:** `type="password"` + show/hide; validated to **match** the new password (checked on blur and submit); mismatch shows a specific inline error.
- **Set new password (primary):** full-width; loading state ("Updating…"); disabled until the checklist passes and the fields match; on success, transitions to the success outcome.
- **Success outcome:** confirm ("Your password has been updated"), then either sign the user in (if the backend returns a session) and route to shopping, or route to sign-in with a success notice. **Other sessions are invalidated** (stated to the user for reassurance).
- **Back to sign in:** quiet link.

---

## 7. Visual hierarchy

1. Heading + the two password fields + **Set new password** (the one primary fill).
2. The **live checklist** — prominent at the field (the strength-guidance mechanism).
3. Confirm-match feedback — inline, at the field.
4. Back link — lowest.

One primary action; success/error pair color + icon + text; headings roman; no gradients. The invalid/expired state leads with a clear sentence + the recover path, never a scary error.

---

## 8. Responsive behavior

Inherits [`login.md`](./login.md) §8. Single column; the panel **scrolls** (field + checklist + confirm can be tall — never clipped); inputs ≥16px (no zoom-on-focus); full-width button; ≥44px targets. No horizontal scroll.

---

## 9. Component composition

Shared shell + **PasswordInput** (reused, show/hide) ×2 · **PasswordRuleChecklist** (reused from register) · a **confirm-match** validator · Button (primary "Set new password") · a **TokenGuard** wrapper *(new: validating / valid / expired / invalid / used states)* · Alert · back link. The password field, checklist, and rules are **shared with register** — one password experience everywhere.

---

## 10. Empty / initial state

There is no data list. The initial state is the **"Validating your reset link…"** beat, which resolves to the **form** (valid token) or an **invalid/expired/used** state. The pristine form (once shown) has empty fields, the checklist showing all rules unmet as guidance, and the submit disabled until valid.

---

## 11. Loading states

- **Validating token (on load):** a brief "Checking your reset link…" spinner state; resolve to form or error.
- **Submitting:** the button → "Updating…", form disabled (prevents double-submit); on success, transition to the success outcome (and any auto sign-in/redirect, cancelable).

Timing per design system; loading regions `aria-busy`.

---

## 12. Error handling

Token errors and field errors are distinct and recoverable:

| Failure | Message intent | Next step |
|---|---|---|
| **Expired token** | "This reset link has expired." | **Request a new link** → [`forgot-password.md`](./forgot-password.md) |
| **Invalid / malformed / missing token** | "This reset link isn't valid." | Request a new link |
| **Used token** | "This link has already been used." | Request a new link · Sign in |
| **Weak password** | The checklist shows unmet rule(s); submit stays disabled. | Fix per checklist |
| **Passwords don't match** | Inline on confirm ("Passwords don't match"). | Re-enter |
| **Server/network on submit** | "Couldn't update your password. Try again." | Retry (token still valid within its window) |
| **Token expired *during* the form** | On submit, backend rejects → show expired state → request new link. | Request a new link |

**Reasoning:** every token failure routes to **request a new link** — the single recovery path — so a dead link is never a dead end. Password strength/mismatch are caught pre-submit so the user doesn't waste a submit.

---

## 13. Micro-interactions

Minimal, consistent with register. Each checklist rule flips valid/invalid with a subtle icon/opacity transition (`--dur-fast`); reduced-motion → instant; **no celebration on a met rule**. Confirm-match feedback appears inline on blur. Success: a single calm confirmation (checkmark stroke-draw), then the cancelable redirect. State transitions cross-fade. Focus moves to the outcome heading on success/error.

---

## 14. Accessibility considerations

- One `h1` per state; a real `<form>` (when the token is valid).
- Both password fields have persistent labels + `autocomplete="new-password"`; show/hide toggles are buttons with `aria-label`/`aria-pressed`.
- The **checklist is associated** with the new-password field (`aria-describedby`); rule states convey via text + icon (not color alone); updates are summarized, not announced per keystroke (non-noisy live region).
- The confirm-mismatch error ties to the confirm field (`aria-invalid`/`aria-describedby`).
- Token-error and success outcomes are announced (`role="status"`/`alert`) and **focus moves to the outcome heading**.
- New-password field is **autofocused** on a valid token (speed + a clear starting point for keyboard users).
- Full keyboard; instant focus rings; ≥4.5:1 contrast; reduced-motion honored; ≥44px targets; auto-redirect (if any) is cancelable/announced.

---

## 15. Trust, security & data dependencies

- **Token-first:** validate before rendering the form; never let a user set a password against a dead token.
- **Single-use, time-limited token**, with expiry communicated; expired/used links fail safely into "request a new link."
- **Invalidate other sessions on reset** (backend) and tell the user ("You've been signed out of other devices") — a reassuring security signal.
- **Strong-password enforcement** via the shared checklist; confirm-match prevents lockout-by-typo.
- **No info leakage:** error states never reveal account details; a bad token just says "not valid."
- **Endpoints (required, not yet built):** validate-token + `POST /auth/reset-password` (token + new password). Gated with [`forgot-password.md`](./forgot-password.md); until both exist, the whole reset flow (and the login "Forgot password?" entry) stays hidden.
- **Graceful degradation:** if validation can't run, show a neutral "we couldn't verify this link — request a new one," never a crash or an unguarded form.

---

*Build order (with forgot-password, when endpoints land): reuse the login shell + register's PasswordInput/PasswordRuleChecklist → TokenGuard (validating → valid/expired/invalid/used) so the form only renders for a valid token → new + confirm password with live checklist and match validation → submit → success (invalidate other sessions, optional auto sign-in, cancelable redirect) → route every token failure to "request a new link." Keep the panel scrollable and the live region non-noisy.*
