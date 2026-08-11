# TechShop Forgot Password — Page Design Spec

**Structure mirrors [`pages/home.md`](../pages/home.md)** (+ *Error handling*). **Governed by [`design-system.md`](../design-system.md).** Markdown only.
**Route:** `/auth/forgot-password` (reached from the "Forgot password?" link on [`login.md`](./login.md)). **Shares the Auth shell defined in [`login.md`](./login.md).**
**Backend dependency:** requires a password-reset **request** endpoint (e.g., `POST /auth/forgot-password`). This endpoint does not exist yet — the page is spec'd ready; until the endpoint ships, the "Forgot password?" entry link stays hidden (never a dead link). See §15.

**Focus scorecard:**

| Focus | How this page delivers it |
|---|---|
| **Trust** | **Anti-enumeration**: identical success response whether or not the email exists — never leaks account existence |
| **Simplicity** | One field (email), one action, one job |
| **Fast completion** | Prefill the email from login if it was typed; `email` autocomplete; Enter-to-submit |
| **Error handling** | Only *real* errors surface (network/rate-limit); "no such account" is **never** an error shown to the user |
| **Mobile usability** | Single column, ≥16px input, ≥44px button, thumb-reachable |
| **Accessibility** | Labeled field, announced success, focus management, instant focus ring |

---

## 1. Goals

Let a user who's forgotten their password **request a reset link** by email — safely and reassuringly — then get out of the way. The page's whole job is: capture an email, send a reset link if an account exists, and tell the user to check their inbox **without revealing whether that email is registered.**

**Primary action:** send reset link. **Secondary:** back to sign in.

---

## 2. User journey

- **Locked-out user:** login → "Forgot password?" → this page (email may be prefilled from what they just typed) → submit → "If an account exists for that email, we've sent a reset link. Check your inbox." → they open the email → [`reset-password.md`](./reset-password.md).
- **Mistyped-email user:** submits a non-existent/typo email → sees the **same** reassuring message (no "no such account"), realizes from the missing email, and can try another. *(Anti-enumeration; no dead end.)*
- **Impatient user:** can resend after a short cooldown; a "back to sign in" link is always present.

---

## 3. Design stance (Hallmark framing)

Same restrained Auth shell as [`login.md`](./login.md). This page is the smallest surface in the set — **one field** — so restraint is total: a heading, a line of explanation, an email field, a button, a back link. The one non-obvious, load-bearing decision is a **security stance**, not a visual one (see §12): the response is intentionally identical for existing and non-existing emails.

---

## 4. Page layout & shell

Inherits the Auth shell from [`login.md`](./login.md) §4. On desktop the brand panel may be simplified or dropped for this utility step (a narrower centered card is acceptable); on mobile it's a single centered column. Two visual states occupy the same shell:

```
FORM STATE                              SUCCESS STATE (same shell)
┌───────────────────────────┐          ┌───────────────────────────┐
│ Reset your password       │          │ Check your inbox           │
│ Enter your account email  │          │ If an account exists for   │
│ and we'll send a reset    │          │ name@email.com, we've sent │
│ link.                     │          │ a reset link. It expires   │
│ Email  [________________] │          │ in {N} minutes.            │
│ [    Send reset link    ] │          │ [ Resend ] (after cooldown)│
│ ‹ Back to sign in         │          │ ‹ Back to sign in          │
└───────────────────────────┘          └───────────────────────────┘
```

---

## 5. Element order & rationale

1. **Heading** ("Reset your password") — states the purpose immediately.
2. **One-line explanation** — sets the expectation ("we'll email you a link"). *(Trust.)*
3. **Email field** — the only input; prefilled from login if available. *(Speed.)*
4. **Send reset link (primary)** — the one action.
5. **Back to sign in** — an always-present escape, since the user may remember their password mid-way.

After submit, the form is **replaced in place** by the success message (see §6) — no navigation, so the user's context is preserved.

---

## 6. Element-by-element specification

- **Email input:** `type="email"`, `autocomplete="email"`, ≥16px, persistent label; prefilled with the email typed on login if present.
- **Send reset link:** full-width primary; loading state ("Sending…"); disabled during the request; on success, transitions the view to the success state.
- **Success message:** the reassuring, **non-committal** copy ("If an account exists for {email}, we've sent a reset link"), the link's **expiry window** stated (sets expectation for the reset step), and a **Resend** action gated behind a cooldown (e.g., 30–60s) to prevent spam.
- **Back to sign in:** a quiet link to `/auth`.

---

## 7. Visual hierarchy

1. Heading + email + Send (form state) / the reassurance line (success state).
2. The explanation/expiry line — quiet but present (trust context).
3. Back-to-sign-in link — lowest emphasis.

One primary action; calm, minimal; headings roman; no gradients. The success state leads with a clear, human sentence, not a green checkmark alone.

---

## 8. Responsive behavior

Inherits [`login.md`](./login.md) §8. Single-column and centered on mobile; the field is ≥16px (no zoom-on-focus), the button full-width and thumb-reachable; the success message wraps comfortably. No horizontal scroll.

---

## 9. Component composition

Shared shell + Input (email) · Button (primary "Send reset link") · a **RequestSentPanel** *(new: success/reassurance state with Resend + cooldown)* · Alert (real errors only) · back link.

---

## 10. Empty / initial state

The initial **form state** (email empty or prefilled, no errors, submit enabled). There's no data list; the "empty" state *is* the form.

---

## 11. Loading states

- **Submitting:** button → "Sending…", disabled; on completion, swap to the success state.
- **Resend:** the Resend button shows a cooldown timer, then re-enables; resending shows a brief "Sending…" again.

Timing per design system; the transition to success is a gentle cross-fade.

---

## 12. Error handling

**The defining decision: "email not found" is never surfaced as an error.** Whether or not the email is registered, the user sees the **same success message.** This prevents account-enumeration (an attacker can't use this form to discover which emails have accounts) and is the page's core trust feature.

Only *genuine* errors surface:

| Failure | Behavior |
|---|---|
| Invalid email format | Inline field validation ("Enter a valid email"). |
| Network/server error | Alert ("Couldn't send right now. Please try again.") + retry — this is a real failure, distinct from "email not found." |
| Rate-limited (too many requests) | "You've requested this a few times — please wait a moment before trying again." |
| Malformed/empty submit | Standard field validation. |

**Reasoning:** the whole security value of this flow collapses if the UI ever says "no account with that email." The only honest, safe response is the uniform one — and it doubles as friendlier UX (the user checks their inbox rather than being told they typed the wrong address).

---

## 13. Micro-interactions

Minimal. Form → success: a gentle cross-fade (`opacity`, `--dur-base`), reduced-motion → instant. Resend cooldown is a quiet countdown on the button. No celebratory animation. Focus moves to the success heading on transition so screen-reader users hear the outcome.

---

## 14. Accessibility considerations

- One `h1` per state (form heading / success heading); a real `<form>`.
- Email field: persistent label, `autocomplete="email"`, `type="email"`.
- On success, the message is announced (`role="status"`/`aria-live`) **and** focus moves to the success heading, so non-visual users learn the result.
- Real errors are `role="alert"` and focus-managed; format errors tie to the field (`aria-invalid`/`aria-describedby`).
- Back-to-sign-in is a real link; full keyboard; instant focus rings; ≥4.5:1 contrast; reduced-motion honored; ≥44px targets.

---

## 15. Trust, security & data dependencies

- **Anti-enumeration (core):** identical response for existing/non-existing emails (§12).
- **Minimal data:** one email; nothing else.
- **Link expiry** is stated to the user and enforced by the backend; the reset token is single-use (see [`reset-password.md`](./reset-password.md)).
- **Rate limiting** on the request endpoint (backend) with friendly client messaging.
- **Endpoint (required, not yet built):** `POST /auth/forgot-password` (accepts email, always 200-style success, emails a tokenized link). Until it exists, the "Forgot password?" entry link on login stays **hidden**.
- **Graceful degradation:** if the endpoint is unavailable, the entry point is hidden rather than routing users to a page that can't work.

---

*Build order (when the endpoint lands): reuse the login shell → one email field + Send → the uniform success/RequestSentPanel with expiry + Resend cooldown → the anti-enumeration guarantee (never surface "not found") → real-error handling + accessibility (announce success, move focus). Reveal the login "Forgot password?" link only once the backend endpoint exists.*
