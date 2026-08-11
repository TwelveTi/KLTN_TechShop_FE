# TechShop Profile / Account — Design Specification

**Status:** Implementation-ready · **Version:** 1.0 · **Last updated:** 2026-08-07
**Governed by:** [`design-system.md`](../design-system.md) · **Reuses** components from [`checkout.md`](./checkout.md) (address form + Vietnam location combobox) and the shared shell.
**Routes:** `/profile` (account) · `/profile/orders` · `/profile/addresses` · `/profile/notifications` · `/profile/security`.

The profile is the signed-in user's **account home** — a small dashboard of tabbed sections for managing who they are, where things ship, what they've bought, and how they're notified. It is operated, not read: each tab does one job. Every token/component resolves to the design system; every decision states its reasoning.

---

## Table of contents

Purpose · Target Users · Primary User Goals · Information Architecture · Desktop Layout · Tablet Layout · Mobile Layout · Visual Hierarchy · Components Used · User Flow · Empty States · Loading States · Error States · Search & Filtering Behavior · Sorting Behavior · Pagination / Infinite Scroll · Accessibility · Responsive Rules · Motion · Edge Cases · Future Improvements

---

## Purpose

Give a signed-in user **direct, confident control** over their account: edit personal details and avatar, verify their email, manage delivery addresses, review order history, set notification preferences, and manage security. Each section is a focused task surface; the profile's job is to make each task obvious, safe, and reversible where possible.

The one page-level rule: **the profile is gated to authenticated users.** A signed-out visitor sees a clear sign-in prompt, not a broken/empty account.

---

## Target Users

| User | Situation | Needs most |
|---|---|---|
| **Order tracker** | Wants to see order status | The Orders tab: status filters + search, clear order cards |
| **Address manager** | Setting up / editing delivery | Add/edit/delete addresses; the VN location picker; a default |
| **Profile editor** | Update name/phone/avatar | A simple form + avatar upload with clear limits |
| **Unverified user** | Hasn't confirmed email | A prominent verify-email prompt + resend |
| **Security-minded user** | Change password / manage sessions | A security tab (some items gated on backend) |
| **Signed-out visitor** | Landed on `/profile` | A clear "sign in to manage your account" prompt |

---

## Primary User Goals

1. **See and edit my details** — name, phone, gender, birthday, avatar; email shown read-only.
2. **Verify my email** — understand status and resend if needed.
3. **Track my orders** — filter by status, search, and read order details.
4. **Manage addresses** — add/edit/delete, set a default, using the VN location picker.
5. **Control notifications** — toggle the categories I care about.
6. **Manage security** — change password / sessions (as the backend supports).

The Orders tab is the most-visited and most data-rich, so it gets the fullest treatment (filters, search, sorting, pagination).

---

## Information Architecture

**Tab is URL-encoded** (`/profile/<tab>`) so a tab is deep-linkable and Back/Forward works; within-tab controls (order filter/search) may also reflect in the URL for shareable/restorable order views.

```
Customer shell (shared header + footer)   — signed in
└─ Profile
   ├─ Account summary        (avatar · name · email)                — sidebar top
   ├─ Section nav            (tabs: Account · Orders · Addresses · Notifications · Security)
   └─ Active panel
       ├─ Account       (form: name · email[read-only] · phone · gender · birthday · avatar · email-verify card)
       ├─ Orders        (status filter tabs · search · order list)
       ├─ Addresses     (list of address cards · add/edit modal w/ VN location picker + map)
       ├─ Notifications (preference toggles)
       └─ Security      (change password* · sessions* · 2FA*)
```

Tabs: **Account · Orders · Addresses · Notifications · Security.** The account summary (avatar + name + email) is persistent context. `(*)` items are gated on backend availability.

---

## Desktop Layout

**≥ 1024px (`lg`+).** Two-region: a **left sidebar** (account summary + section nav) and a **main panel** for the active section.

```
┌───────────────────────────── Header (sticky) ─────────────────────────────┐
├────────────────────────────────────────────────────────────────────────────┤
│ ┌───────────────┐  ┌──────────────────────────────────────────────────┐    │
│ │  (avatar)      │  │  My account                                       │    │
│ │  Alex Nguyen   │  │  ┌───────────────────────────┐  ┌──────────────┐  │    │
│ │  alex@…        │  │  │ Full name [__________]     │  │ (avatar lg)  │  │    │
│ │                │  │  │ Email     [alex@…] (locked)│  │ Choose photo │  │    │
│ │ ○ Account      │  │  │ ┌ Email not verified  ! ┐  │  │ ≤1MB JPG/PNG │  │    │
│ │ ○ Orders       │  │  │ │ Verify email          │  │  └──────────────┘  │    │
│ │ ○ Addresses    │  │  │ Phone     [__________]     │                    │    │
│ │ ○ Notifications│  │  │ Gender    ○ M ○ F ○ Other  │                    │    │
│ │ ○ Security     │  │  │ Birthday  [ dd/mm/yyyy ]   │                    │    │
│ └───────────────┘  │  │ [ Save profile ]           │                    │    │
│                     │  └───────────────────────────┘                     │    │
│                     └──────────────────────────────────────────────────┘    │
├────────────────────────────────── Footer ──────────────────────────────────┤
```

- Sidebar ~260px, `--color-surface`, `--radius-md`; the active tab is clearly marked (`--color-primary`). Main panel ~flex, `--color-surface`, generous padding.
- **Account tab:** a two-column form (fields left, avatar panel right); email is read-only and visually distinct; an **email-verification card** (verified → green "Verified on {date}"; unverified → warning + "Verify email").
- **Orders tab:** status filter tabs (All / Waiting payment / Processing / Shipping / Completed / Cancelled / Refunded) with counts, an order-search field, and a list of detailed order cards.
- **Addresses tab:** a list of address cards (receiver, phone, full address, Default badge) with Update / Delete / Set-default actions, and an **Add address** button opening a modal with the VN province/ward combobox + map preview.
- **Notifications / Security:** simple preference panels.

---

## Tablet Layout

**768–1023px (`md`).** The sidebar becomes a **horizontal tab strip** above the panel (or a narrow rail), reclaiming width for content. Forms and order cards stay comfortable; the address modal is a centered dialog. **Reasoning:** at this width a persistent left rail squeezes the working panel; a top tab strip keeps navigation one tap away without stealing space.

## Mobile Layout

**< 768px (`xs`–`sm`).** Single column: the account summary compact at top, the section nav as a **horizontal scrollable tab strip** (or a select), then the active panel full-width.
- Account form fields are one-up; the avatar panel stacks above/below the form.
- Order status filters scroll horizontally; order cards stack; the order-search field is full-width.
- The **address add/edit modal becomes a full-screen sheet** (dialog) with the location combobox as a full-height list and the map preview collapsible.
- **Reasoning:** account management on a phone is one-task-at-a-time; the full-screen address sheet mirrors the checkout address pattern the user already knows.

---

## Visual Hierarchy

1. **Active section heading + its primary action** (Save profile / Add address / the order list) — the task at hand.
2. **Account summary** (avatar + name) — persistent identity, quiet.
3. **Email-verification prompt** when unverified — elevated with a warning treatment because it gates trust/notifications; it must be noticed.
4. **Section nav** — clear active state; secondary to the panel content.
5. **Order/address cards** — scannable; **order totals and prices use tabular numerals**; status shown as a chip (color + label).
6. **Helper text / meta** — muted.

**Applied rules:** one primary action per panel; status as chips (color + text, never color alone); prices/totals tabular; destructive actions (delete address) are reversible or confirmed; no gradients. **Reasoning:** an account area should feel calm and in-control — the only thing that "shouts" is an unverified-email prompt, because it's the one thing the user should act on.

---

## Components Used

| Area | Components |
|---|---|
| Shell | Header · Footer (shared) |
| Structure | **ProfileSidebar / SectionNav** *(new: tabs, active state)* · **AccountSummary** *(new: avatar + name + email)* |
| Account | Input · Radio group (gender) · Date input (birthday) · read-only field (email) · **AvatarUpload** *(new: preview + file constraints)* · **EmailVerifyCard** *(new)* · Button (primary "Save profile") |
| Orders | **OrderStatusTabs** *(new, with counts)* · Input (order search) · **OrderCard** *(new: items, totals, status, dates)* · Empty state · Skeleton |
| Addresses | **AddressCard** *(new)* · **AddressFormModal** *(reused from checkout: VN location combobox + map)* · Button · confirm/Undo for delete |
| Notifications | Checkbox/Switch list |
| Security | Button (change password* / sessions*) · gated placeholders |
| Feedback | Notice / Alert · Toast (Undo for delete) · Skeleton |

**Reasoning:** the address form + Vietnam location combobox are **shared with checkout** — one implementation for the highest-friction data entry on the site. Order and address cards are new but reusable across the account area.

---

## User Flow

```
Signed-in user → /profile
  ├─ Account: edit name/phone/gender/birthday → Save → success notice
  │           upload avatar (type/size checked) → success ; unverified → Verify email → resend*
  ├─ Orders: pick status filter / search → read order cards → (open order detail*)
  ├─ Addresses: Add → modal (name/phone/VN location/exact address/type/default) → save → list updates
  │             Set default / Update / Delete(→ Undo)
  ├─ Notifications: toggle preferences → saved
  └─ Security: change password* / manage sessions* (gated)
Signed-out user → /profile → "Sign in to manage your account" prompt (+ Register)
Session restoring → a neutral "restoring your session" state (not the signed-out prompt prematurely)
```

**Detailed reasoning:**
- **Signed-out vs restoring** are distinct states — showing the "sign in" prompt while a session is still being restored would wrongly tell a logged-in user they're logged out. A brief restoring state prevents that flash (the existing code already distinguishes these).
- **Delete address uses optimistic + Undo** (design-system rule), not a confirm dialog, since it's reversible within the window; a *default* address deletion is guarded (can't delete the default without choosing a new one).
- **Email read-only:** email changes are an identity-sensitive operation; the field is read-only here and email change (if supported) is a deliberate, verified flow (future).

---

## Empty States

Per design-system anatomy; distinct per tab:

| Tab | Empty condition | Title · guidance · action |
|---|---|---|
| Orders (none) | No orders yet | "No orders yet" · "When you buy something it'll appear here." · "Start shopping" |
| Orders (filtered) | Filter/search → none | "No orders match this filter" · "Try another status or clear the search." · Clear |
| Addresses | No addresses | "No delivery addresses yet" · "Add one for faster checkout." · "Add address" |
| Notifications | (never empty) | Always shows the toggle set |
| Security | Items gated | Show what's available; note upcoming items honestly |

**Reasoning:** the Orders empty state distinguishes "never ordered" from "filtered to none" (different fixes), consistent with the catalog/cart rule.

---

## Loading States

- **Tab data (orders, addresses):** skeletons matching the card shape (order cards / address cards) while fetching; the tab nav stays interactive.
- **Save profile / upload avatar:** button loading state; avatar shows an uploading state on the image; success → a concise notice.
- **Session restore:** a neutral "Restoring your session" panel before content or the signed-out prompt resolves.
- **Set-default / delete address:** optimistic; the affected card reflects the change immediately; failure reverts with a notice.
- Timing per design system; loading regions `aria-busy`; changes announced via `aria-live` where relevant (e.g., "Profile saved").

---

## Error States

- **Profile save fails:** inline Alert in the panel + retry; entered values preserved.
- **Avatar upload invalid** (wrong type / >1MB): a specific inline message *before* upload (the existing client-side checks); server errors surfaced with retry.
- **Orders/addresses fetch fails:** inline Alert + retry in that panel; other tabs unaffected.
- **Address create/update/delete fails:** revert optimistic change; specific error ("Couldn't save address").
- **Unauthenticated (token expired):** the API client's refresh handles most; a hard failure routes to sign-in (with return to `/profile`).
- **Email verification send fails:** honest message ("Couldn't send the verification email — try again shortly").

**Reasoning:** each tab fails independently — a broken Orders fetch must not block editing the profile.

---

## Search & Filtering Behavior

Genuinely applicable **within the Orders tab** (unlike login/register):
- **Status filter tabs:** All · Waiting payment · Processing · Shipping · Completed · Cancelled · Refunded, each with a live **count**. Selecting one filters the list; the choice may reflect in the URL for a shareable view.
- **Order search:** a text field matching **order code and product names** within the user's orders (case-insensitive; reuse the diacritic normalization). Debounced.
- **Address search:** the address modal's **VN location combobox** provides province/ward search (reused from checkout) — the only search inside the Addresses tab.
- Elsewhere (Account/Notifications/Security) there's nothing to search/filter. The **global header search** remains (it searches the catalog, not the account).

**Reasoning:** order history is the one profile area large enough to need filtering; status tabs + a code/product search are the two axes a user actually reasons about ("where's my order X" / "show my shipping ones").

---

## Sorting Behavior

- **Orders:** default **newest first** (most recent order on top — the common intent). An optional sort (Newest / Oldest / Total) is a light enhancement; the default is the important decision. A stable secondary key keeps pagination deterministic.
- **Addresses:** **default address first**, then most-recently-used — the same ordering checkout relies on, so the two surfaces agree.
- Other tabs: nothing to sort.

**Reasoning:** the only ordering users expect is "my latest order first" and "my default address first"; both are sensible fixed defaults, not controls that need exposing.

---

## Pagination / Infinite Scroll

- **Orders:** paginate with **"Load more"** (+ URL `page`) once the history is long, consistent with the catalog decision — no auto-infinite-scroll (keeps the footer reachable, is accessible, deep-linkable). Page size ~10–20.
- **Addresses:** typically few; shown in full (no pagination). If a user has many, a "show all" reveal suffices.
- Other tabs: single screens, no pagination.

**Reasoning:** order history is the only list that grows unbounded; it reuses the site-wide load-more pattern. Addresses are inherently few, so pagination would be overkill.

---

## Accessibility

- **Structure:** one `h1` per view (the section title); the section nav is a `tablist`/`tab`/`tabpanel` with `aria-selected`/`aria-current`; each panel is a labeled region.
- **Forms:** persistent labels; read-only email conveyed as read-only (not just visually); radio group (gender) and date input labeled; required-ness programmatic; errors inline with `aria-invalid`/`aria-describedby`; "Profile saved" announced via `aria-live`.
- **Avatar upload:** the file input has an accessible label and states size/type limits in text; upload progress/result announced.
- **Email-verify card:** status conveyed by text + icon (not color alone); "Verify email" is a real button.
- **Orders:** status filter tabs are keyboard-operable with counts in the accessible name; order status chips use text + color; the search field is labeled and its result count/announcements are polite.
- **Address modal:** a proper `dialog` (focus trap, Escape, return focus); the location combobox follows the combobox pattern; delete offers an accessible Undo.
- **Keyboard/contrast/reduced-motion:** full keyboard operation, instant focus rings, ≥4.5:1 both themes, reduced-motion honored.

**Reasoning:** the tab pattern and the address dialog are the two a11y-critical structures; getting `tablist`/`tabpanel` and the focus-trapped dialog right is the bulk of the work.

---

## Responsive Rules

Verified at 320 / 375 / 414 / 768 / 1024 / 1280px. Sidebar (lg) → top tab strip (md) → scrollable tab strip/select (mobile). Forms two-up (lg) → one-up (mobile). Address modal: centered dialog (lg/md) → full-screen sheet (mobile). Order status filters scroll horizontally on mobile. No horizontal page scroll; ≥44px targets; tables/wide content scroll within their container.

## Motion

Minimal. Tab change: panel cross-fade (`opacity`, `--dur-base`), reduced-motion → instant, focus moves to the new panel heading. Save/upload: button loading spinner. Address delete: card fades/collapses out + Undo toast (reduced-motion → instant). Address modal: slide/fade in (`transform`), Escape reverses. Focus rings instant; no gradients/bounce. **Reasoning:** account management should feel steady; motion only confirms tab changes and reversible deletes.

---

## Edge Cases

| Case | Behavior |
|---|---|
| Signed-out visits `/profile` | "Sign in to manage your account" prompt (+ Register); not an empty account. |
| Session restoring | Neutral restoring state; don't flash the signed-out prompt. |
| Unverified email | Prominent verify prompt + resend*; some features (notifications reliability) noted as needing verification. |
| Avatar wrong type / >1MB | Rejected client-side with a specific message; no upload attempted. |
| Delete the default address | Blocked until another default is chosen; explain why. |
| Delete a normal address | Optimistic + Undo. |
| Invalid VN location combo | Combobox constrains district/ward to the chosen province; incomplete → validation before save. |
| No orders / no addresses | Distinct empty states (see above). |
| Long order history | Load-more pagination. |
| Order with missing product image | Placeholder thumbnail; never a broken image. |
| Read-only email edit attempt | Not editable here; email change is a future verified flow. |
| Birthday/phone locale formats | Formatted per locale; phone validated leniently (optional field). |
| Concurrent edits (multi-device) | Server is source of truth; reconcile on save; surface conflicts. |
| Deep-linked tab (`/profile/orders`) | Opens directly on that tab. |

---

## Future Improvements

- **Change password / manage sessions / 2FA** — currently placeholders; blocked on backend security endpoints (never ship a control that does nothing).
- **Email change** (verified flow) — currently read-only.
- **Order detail page** (`/orders/:id`) — richer than the order card (timeline, tracking, invoice, reorder), linked from the Orders tab.
- **Wishlist tab** — surface the wishlist here too (see [`wishlist.md`](./wishlist.md)).
- **Order tracking / status timeline** and **reorder** actions.
- **Notification preferences persistence** to a real backend + channel granularity (email/push).
- **Downloadable invoices / VAT info**.
- **Loyalty / points** section once that module exists.
- **Profile completeness nudges** (add phone, verify email) — gentle, not nagging.

---

*End of specification. Build order: (1) ProfileSidebar/SectionNav + AccountSummary + the signed-out/restoring guards; (2) Account tab (form + AvatarUpload + EmailVerifyCard); (3) Addresses tab reusing the checkout AddressFormModal + VN combobox, with optimistic set-default/delete + Undo; (4) Orders tab (status tabs + counts + search + OrderCard + load-more + empty states); (5) Notifications/Security (gate password/sessions/2FA on backend); (6) accessibility (tablist/tabpanel, dialog focus trap) and the edge-case matrix.*
