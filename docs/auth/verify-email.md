# TechShop Verify Email — Page Design Spec

**Structure mirrors [`pages/home.md`](../pages/home.md)** (+ *Error handling*). **Governed by [`design-system.md`](../design-system.md).** Markdown only.
**Routes:** `/auth/verify-email` (the "please verify / resend" prompt) and `/auth/verify-email?token=…` (the landing when a user clicks the link in their email). **Shares the Auth shell defined in [`login.md`](./login.md).**
**Backend context:** registration already triggers a verification email, and the current app handles verification returns on the home page via a `?verified=success|already|error` query param + toast. This spec proposes a **dedicated verify surface** (clearer, resend-capable) while staying **compatible** with that existing return pattern (see §15). A **resend** endpoint is currently a placeholder — resend is gated until it exists.

**Focus scorecard:**

| Focus | How this page delivers it |
|---|---|
| **Trust** | Explains *why* verify (security + order notifications); honest states; no forced gate on browsing |
| **Simplicity** | Two jobs only — confirm the result of a link, or resend one |
| **Fast completion** | Link is one click; resend is one tap (with cooldown); auto-redirect after success |
| **Error handling** | Distinct expired / invalid / already-verified / success states, each with a clear next step |
| **Mobile usability** | Single column, large tap targets, readable status |
| **Accessibility** | Status announced, focus managed, links/buttons real, instant focus rings |

---

## 1. Goals

Confirm ownership of an email address, and make recovering from a bad/expired link trivial. The page serves two distinct moments:

- **The prompt** (`/auth/verify-email`, no token): tell an unverified user their email needs verifying, and let them **resend** the link.
- **The landing** (`?token=…`): the user clicked the link — confirm the result (**verified / already verified / expired / invalid**) and route them onward.

**Primary action** depends on state: *prompt* → resend; *success* → continue (sign in / go shopping); *expired/invalid* → resend a fresh link.

**Non-goal:** verification does **not** block browsing (browse-first). It's encouraged and gates *notifications/trust*, not shopping.

---

## 2. User journey

- **Just-registered user:** after register, arrives at the prompt ("We emailed a link to {email} — verify to secure your account") → opens the email → clicks the link → lands on the success state → is signed in / routed to shopping. *(Fast, clear.)*
- **Delayed user:** the link expired → landing shows "This link has expired" → one tap **resend** → new email. *(Error recovery.)*
- **Already-verified user:** clicks an old link → friendly "Your email is already verified — you're all set" → continue. *(No confusion.)*
- **Unverified signed-in user:** sees the verify prompt (also surfaced in [`pages/profile.md`](../pages/profile.md)) and can resend. *(Trust nudge, not a wall.)*

---

## 3. Design stance (Hallmark framing)

Same restrained Auth shell as [`login.md`](./login.md). This page is **status-driven**: it's mostly a clear message + one action, so the craft is in the **copy and the state machine**, not decoration. Success is a single calm confirmation (a checkmark draw, not confetti). The stance on gating is a trust decision: **verification is encouraged, never a barrier to browsing** — pressuring users to verify before they can look around erodes trust.

---

## 4. Page layout & shell

Inherits the Auth shell from [`login.md`](./login.md) §4 — a centered card is appropriate for this single-message page. One shell, several states:

```
PROMPT (no token)              SUCCESS (?token ok)         EXPIRED/INVALID (?token bad)
┌─────────────────────┐        ┌─────────────────────┐     ┌─────────────────────┐
│ Verify your email   │        │ ✓ Email verified    │     │ Link expired        │
│ We sent a link to   │        │ You're all set.     │     │ This link is no      │
│ name@email.com.     │        │ Redirecting you to  │     │ longer valid.        │
│ [ Resend link ]*    │        │ TechShop…           │     │ [ Resend link ]*     │
│ ‹ Back to sign in   │        │ [ Continue ]        │     │ ‹ Back to sign in    │
└─────────────────────┘        └─────────────────────┘     └─────────────────────┘
```

---

## 5. Element order & rationale

1. **Status heading** — the single most important thing (what happened). State-specific.
2. **Explanation line** — the email address (prompt), the reassurance (success), or the reason + fix (expired/invalid). *(Trust/clarity.)*
3. **Primary action** — state-dependent: Resend (prompt/expired), Continue (success).
4. **Back to sign in** — always present.

The order is "tell them the outcome, then give the next step" — the fastest path out of a status page.

---

## 6. Element-by-element specification

- **Landing verification (`?token`):** on load, the app verifies the token and resolves to one of: **success** (email confirmed; if the backend also returns a session, the user is signed in and auto-redirected after a brief beat; otherwise route to sign-in with a success notice), **already-verified** (friendly confirmation), **expired**, or **invalid/used**.
- **Prompt (no token):** shows the target email (from the just-registered flow or the signed-in user) and a **Resend** button.
- **Resend button:** one tap; shows a **cooldown** (e.g., 30–60s) after each send to prevent spam; disabled during the request. *(Gated on the resend endpoint — see §15.)*
- **Continue (success):** routes to shopping/home (or completes `next`); also an automatic redirect after a short, cancelable delay.
- **Back to sign in:** quiet link to `/auth`.

---

## 7. Visual hierarchy

1. The **status heading** (verified / expired / etc.) — dominant.
2. The one **primary action** for that state.
3. The explanation line — quiet context.
4. Back link — lowest.

One primary action per state; success uses a restrained checkmark + calm copy (not a celebration); expired/invalid uses a neutral/warning tone, never alarming. Headings roman; no gradients.

---

## 8. Responsive behavior

Inherits [`login.md`](./login.md) §8. Centered single column on all sizes (a status card doesn't need the two-panel split); ≥44px action buttons; text wraps comfortably; no horizontal scroll.

---

## 9. Component composition

Shared shell + a **VerifyStatusPanel** *(new: renders the state — prompt / success / already / expired / invalid)* · Button (Resend, with cooldown; Continue) · Alert (for hard errors) · back link · a small success check mark (SVG stroke draw).

---

## 10. Empty / initial state

There's no data list. The **initial state** is either the prompt (no token) or a brief **"Verifying…"** state while the token is checked (see Loading). The page always resolves to a definite status — never a blank.

---

## 11. Loading states

- **Landing (`?token`):** a short **"Verifying your email…"** state while the token is validated, then resolve to the outcome. Delay-showing is unnecessary here — verifying is the expected work — but keep it brief and calm.
- **Resend:** button → "Sending…", then cooldown timer.
- **Auto-redirect after success:** a short, visible, **cancelable** countdown ("Redirecting to TechShop…") so a fast user can click Continue immediately and a cautious one isn't yanked away.

---

## 12. Error handling

State-specific and recoverable — each dead link has a clear fix:

| Situation | Message intent | Next step |
|---|---|---|
| **Success** | "Email verified — you're all set." | Continue (auto-redirect, cancelable) |
| **Already verified** | "Your email is already verified." | Continue / Sign in |
| **Expired link** | "This link has expired." | **Resend link** |
| **Invalid / used link** | "This link is no longer valid." | Resend link · Back to sign in |
| **Resend failed (network)** | "Couldn't resend right now. Try again." | Retry |
| **Resend unavailable (no endpoint yet)** | Hide Resend; show guidance to re-register or contact support | — |

**Reasoning:** the most common real failure is an expired/old link — so every non-success state routes straight to **resend**, turning a dead end into a one-tap recovery. "Already verified" is treated as success-adjacent (friendly), never an error.

---

## 13. Micro-interactions

Minimal. Success: a single **checkmark stroke-draw** (SVG `stroke-dasharray`, one shot) — the one tasteful confirmation moment; reduced-motion → static check. Verifying: a calm inline spinner (delayed/steady, no flashing). Resend cooldown: a quiet countdown. State transitions cross-fade. Focus moves to the status heading on resolution.

---

## 14. Accessibility considerations

- One `h1` per state (the status heading); the resolved status is announced (`role="status"`/`aria-live`) and **focus moves to the heading** so non-visual users hear the outcome.
- The "Verifying…" state is announced (`aria-busy`); the success/expired result replaces it and is announced.
- Success is conveyed by text + icon (not the green check alone).
- Resend and Continue are real buttons with clear names; Back is a real link; the auto-redirect countdown is announced and **cancelable/pausable** (never yanks a screen-reader user mid-read).
- Full keyboard; instant focus rings; ≥4.5:1 contrast; reduced-motion honored; ≥44px targets.

**Reasoning:** an auto-redirect that fires without warning is an accessibility and trust failure — it's cancelable and announced.

---

## 15. Trust, security & data dependencies

- **Verification is encouraged, not a gate** on browsing — trust, not coercion.
- **Why-verify** is stated (account security + reliable order notifications) so users understand the ask.
- **Token:** single-use, time-limited (expiry surfaced to the user); expired/used links fail safely into a resend path.
- **Endpoints:** registration's verification-email trigger exists; the **return** is handled today via the home page `?verified=success|already|error` toast — this dedicated route **supersedes** that for clarity but should remain **compatible** (either the backend redirects to `/auth/verify-email?...`, or the home `?verified=` handler is kept as a fallback). A **resend** endpoint is a **placeholder today**; until it ships, hide the Resend button and show alternative guidance (§12).
- **Graceful degradation:** if verification can't be checked, show a neutral "we couldn't verify right now — try the link again or resend," never a hard crash.

---

*Build order: reuse the login shell → the VerifyStatusPanel state machine (verifying → success / already / expired / invalid) with focus-managed, announced results → the token-landing (`?token`) resolution + cancelable auto-redirect on success → the no-token prompt with Resend (gated on the resend endpoint; cooldown) → reconcile with the existing home `?verified=` return (redirect here or keep as fallback). Never gate browsing on verification.*
