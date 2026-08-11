# TechShop User Flows — Navigation Blueprint

**Status:** Source of truth for navigation & journeys · **Version:** 1.0 · **Last updated:** 2026-08-07
**Reads with:** [`design-system.md`](./design-system.md) · [`pages/`](./pages/) · [`components/`](./components/) · [`auth/`](./auth/) · [`admin/`](./admin/)

This document maps **how users move through TechShop** — every route, transition, gate, and terminal state. It's the blueprint that ties the page specs together: where each screen sits, what it leads to, and what guards the edges. Each flow gets a short explanation and, where it clarifies, a Mermaid diagram. Documentation only — no code.

**Guiding principles that shape every flow** (from the design system & page specs):
- **Browse-first** — guests can browse, search, add to cart, and save without an account; sign-in is the reward (personalization, persistence), not a wall.
- **State lives in the URL** for shareable views (catalog/search/filters); it does **not** for transient/sensitive processes (checkout, auth).
- **Reversible > confirm** (optimistic + Undo); **irreversible = deliberate** (typed confirmation). **Silent success** for visible changes.
- **Never a dead end** — every empty/error/zero state offers a next action.

### Diagram legend

```mermaid
flowchart LR
  P["Page / screen"]
  A(["Action / state"])
  D{"Decision / gate"}
  X[["External system"]]
  P --> A --> D --> X
```

- **Rectangle** = a page/screen · **rounded** = an action or transient state · **diamond** = a decision/gate · **double-box** = an external system (e.g., VNPay, Google OAuth).
- `⌦ gated` marks a flow that depends on a **backend module not yet built** (orders, wishlist, password-reset, settings) — designed and ready, guarded until the API lands.

---

## Route map (the blueprint)

| Route | Screen (spec) | Access | Backend today |
|---|---|---|---|
| `/` | [Home](./pages/home.md) | Public | Live |
| `/catalog` · `?category=` · `?q=`→ | [Catalog](./pages/catalog.md) | Public | Products live |
| `/search?q=` | [Search](./pages/search.md) | Public | Search reuses catalog engine |
| `/product/:slug` | [Product detail](./pages/product-detail.md) | Public | Live |
| `/cart` | [Cart](./pages/cart.md) | Public (guest cart) | Cart client-side; merge on sign-in |
| `/checkout` · `/checkout/success` · `/checkout/failed` | [Checkout](./pages/checkout.md) | Sign-in gate* | Order create + VNPay ⌦ gated |
| `/orders/:id` | Order detail | Signed-in | ⌦ gated (orders module) |
| `/wishlist` | [Wishlist](./pages/wishlist.md) | Signed-in / guest-local | ⌦ gated (wishlist module) |
| `/profile` · `/profile/{orders,addresses,notifications,security}` | [Profile](./pages/profile.md) | Signed-in | Profile live; some tabs gated |
| `/auth` (login \| register modes) | [Login](./auth/login.md) · [Register](./auth/register.md) | Public | Live |
| `/auth/forgot-password` | [Forgot password](./auth/forgot-password.md) | Public | ⌦ gated (reset endpoint) |
| `/auth/verify-email` · `?token=` | [Verify email](./auth/verify-email.md) | Public | Verify live; resend ⌦ gated |
| `/auth/reset-password?token=` | [Reset password](./auth/reset-password.md) | Public | ⌦ gated |
| `/admin` | [Admin dashboard](./admin/dashboard.md) | ADMIN | Live |
| `/admin/products` · `categories` · `brands` · `customers` | [Products](./admin/products.md) et al. | ADMIN | Live CRUD |
| `/admin/orders` · `inventory` · `analytics` · `settings` | [Orders](./admin/orders.md) et al. | ADMIN | ⌦ gated / derived |

\* Checkout requires sign-in only if the backend keeps orders user-scoped; guest checkout is the target (see Checkout Flow).

### Master site map

```mermaid
flowchart TD
  Home["/ Home"] --> Catalog["/catalog"]
  Home --> Search["/search"]
  Home --> PDP["/product/:slug"]
  Home --> Auth["/auth login·register"]
  Home --> Cart["/cart"]
  Catalog --> PDP
  Search --> PDP
  PDP --> Cart
  PDP --> Wishlist["/wishlist ⌦"]
  Cart --> Checkout["/checkout"]
  Checkout --> Confirm(["Order confirmation"])
  Confirm --> Orders["/orders/:id ⌦"]
  Home --> Profile["/profile"]
  Profile --> Orders
  Auth --> Profile
  Profile --> Admin["/admin ADMIN only"]
  Admin --> AdminSections["Products · Orders · Inventory · Categories · Brands · Customers · Analytics · Settings"]
```

---

## Guest Flow

A guest (not signed in) is a first-class shopper. They can browse the catalog, search, open products, build a cart, and save to a local wishlist. Sign-in is nudged (for persistence/personalization) but never required to explore — the account gate appears only at the moments it must (checkout, viewing personal history). A guest cart/wishlist **merges into the account on sign-in**, so nothing they built is lost.

```mermaid
flowchart LR
  G(["Guest arrives"]) --> Home["/ Home"]
  Home --> Browse["Catalog / Search / PDP"]
  Browse --> AddCart(["Add to cart (guest cart)"])
  Browse --> Save(["Save to wishlist (local)"])
  AddCart --> Cart["/cart"]
  Cart --> Gate{"Sign in required to checkout?"}
  Gate -->|"Yes"| Auth["/auth"]
  Gate -->|"Guest checkout"| Checkout["/checkout"]
  Auth --> Merge(["Merge guest cart + wishlist"])
  Merge --> Checkout
```

---

## Authentication Flow

Auth is one shell with **login** and **register** modes, plus **forgot-password → reset-password** and **verify-email** side-flows. Key rule from the specs: **registration does not sign the user in** — it creates the account and sends a verification email; the user verifies, then signs in. Login returns the user to their intended destination via `next` (e.g., back to checkout). Google OAuth is a full-page redirect. Errors are specific and non-enumerating.

```mermaid
flowchart TD
  Start(["Enter /auth"]) --> Mode{"Login or Register?"}
  Mode -->|"Register"| Reg["Register form + live checks"]
  Reg --> Created(["Account created — NOT signed in"])
  Created --> Verify["/auth/verify-email"]
  Verify --> Login["Login mode"]
  Mode -->|"Login"| Login
  Login --> Method{"Email or Google?"}
  Method -->|"Email"| Cred{"Valid credentials?"}
  Method -->|"Google"| OAuth[["Google OAuth"]]
  OAuth --> Session
  Cred -->|"Yes"| Session(["Session started"])
  Cred -->|"Unverified"| Verify
  Cred -->|"No / blocked"| Err(["Specific error + recovery"])
  Session --> Next{"?next= set?"}
  Next -->|"Yes"| Dest["Return to intended page"]
  Next -->|"No"| Home["/ Home"]
  Login -.->|"Forgot password ⌦"| Forgot["/auth/forgot-password"]
  Forgot --> Reset["/auth/reset-password?token"]
  Reset --> Login
```

**Account states** (moderation) affect sign-in:

```mermaid
stateDiagram-v2
  [*] --> Unverified: register
  Unverified --> Active: verify email
  Active --> Blocked: admin block
  Blocked --> Active: admin reactivate
  Active --> Inactive: deactivate
  Inactive --> Active: reactivate
  note right of Blocked: sign-in refused with a specific reason
```

---

## Customer Flow

The end-to-end journey of a signed-in shopper: discover → evaluate → cart → checkout → track. Personalization (recommendations, saved cart/wishlist, order history) is the payoff for being signed in. This is the spine the storefront specs implement.

```mermaid
journey
  title Signed-in customer journey
  section Discover
    Land on Home: 4: Customer
    Browse / search: 4: Customer
  section Evaluate
    Open product detail: 5: Customer
    Save / compare: 3: Customer
  section Buy
    Add to cart: 5: Customer
    Checkout: 4: Customer
    Pay (VNPay/COD): 3: Customer
  section After
    Order confirmation: 5: Customer
    Track in My orders: 4: Customer
```

---

## Product Discovery Flow

Discovery is undirected browsing: the home page curates (promo, categories, featured/recommended rails), and the catalog page provides department browsing. The homepage deliberately curates rather than filters; deep filtering lives on the catalog. Every product tile leads to the PDP; the PDP offers related products to keep discovery going.

```mermaid
flowchart LR
  Home["/ Home"] --> Cats["Shop by category"]
  Home --> Featured["Featured / Recommended rails"]
  Cats --> Catalog["/catalog?category="]
  Featured --> PDP["/product/:slug"]
  Catalog --> PDP
  PDP --> Related(["Related / recommended rail"])
  Related --> PDP
  PDP --> Cart["/cart"]
```

---

## Search & Filter Flow

Search and catalog share **one results engine**: the catalog owns *browse*, search owns *query*, and both reuse the same grid + facets + sort + pagination. Autocomplete can shortcut straight to a product (skipping the results page). Filters are composable, URL-encoded (shareable/back-safe), and never dead-end — zero-results offers spelling help, "did you mean", and popular products.

```mermaid
flowchart TD
  Type(["Type in SearchBar"]) --> Auto{"Autocomplete pick?"}
  Auto -->|"Product hit"| PDP["/product/:slug"]
  Auto -->|"Category hit"| Catalog["/catalog?category="]
  Auto -->|"Submit / See all"| Results["/search?q="]
  Results --> Refine(["Apply filters / sort (URL-encoded)"])
  Refine --> Results
  Results --> Zero{"Any results?"}
  Zero -->|"Yes"| PDP
  Zero -->|"No"| Recover(["Did you mean · popular · clear filters"])
  Recover --> Results
```

---

## Wishlist Flow ⌦

The wishlist is the "not now, but yes eventually" bucket. The **save (heart) toggle** lives on the ProductCard and PDP; `/wishlist` is the collection view. Guests save locally and the list **merges on sign-in** (or, if the backend can't merge in v1, saving prompts sign-in). From the collection, an item moves to the cart in one action; removals are optimistic + Undo. *(Gated on the wishlist backend module.)*

```mermaid
flowchart LR
  Heart(["Tap save on ProductCard/PDP"]) --> Who{"Signed in?"}
  Who -->|"Yes"| Server(["Saved to account"])
  Who -->|"Guest"| Local(["Saved locally → merge on sign-in"])
  Server --> WL["/wishlist"]
  Local --> WL
  WL --> Move(["Move to cart (optimistic)"])
  Move --> Cart["/cart"]
  WL --> Remove(["Remove + Undo"])
  WL --> PDP["/product/:slug"]
```

---

## Cart Flow

The cart is the review-and-adjust surface before checkout. Quantity edits are instant/optimistic; **removal is optimistic + Undo**, never an "are you sure?" dialog. Totals are honest — subtotal is real; shipping/tax show "calculated at checkout" until known. Stale items (price changed, low/out of stock, unavailable) are flagged and must be resolved before checkout. Proceeding routes to checkout (through the sign-in gate if required), carrying the cart.

```mermaid
flowchart TD
  Cart["/cart"] --> Edit(["Adjust qty / remove (Undo)"])
  Edit --> Cart
  Cart --> Flags{"Any flagged items? (price/stock)"}
  Flags -->|"Yes"| Resolve(["Resolve: update or remove"])
  Resolve --> Cart
  Flags -->|"No"| Proceed(["Proceed to checkout"])
  Proceed --> Gate{"Signed in? (or guest checkout)"}
  Gate -->|"Needs sign-in"| Auth["/auth (?next=/checkout)"]
  Gate -->|"OK"| Checkout["/checkout"]
  Auth --> Checkout
  Cart --> Empty{"Cart empty?"}
  Empty -->|"Yes"| EmptyState(["Empty-cart state → Start shopping"])
```

---

## Checkout Flow

Checkout is a **stepped, single-page flow** (Contact → Shipping → Delivery → Payment → Review) inside a **focused shell** (minimal header/footer to cut exits), with an always-visible order summary. Address precedes payment so the final total can be honest. **Payment is safe:** card/bank goes through **VNPay's hosted page** (redirect); COD is in-app — TechShop never collects card credentials. Placing the order locks the button (no double-submit) and re-validates the cart server-side before charging. *(Order creation + VNPay gated.)*

```mermaid
flowchart TD
  Enter["/checkout"] --> Guard{"Cart non-empty & items OK?"}
  Guard -->|"No"| BackCart["Back to /cart with notice"]
  Guard -->|"Yes"| Contact["1 Contact / sign-in"]
  Contact --> Ship["2 Shipping address (VN picker)"]
  Ship --> Deliver["3 Delivery method → total finalizes"]
  Deliver --> Pay["4 Payment method"]
  Pay --> Review["5 Review"]
  Review --> Place(["Place order (locked, idempotent)"])
  Place --> Reval{"Cart re-validates?"}
  Reval -->|"No (stock/price)"| BackCart
  Reval -->|"Yes"| Method{"Payment method?"}
  Method -->|"COD"| Success["/checkout/success"]
  Method -->|"VNPay"| Gateway[["VNPay hosted page"]]
  Gateway --> Return{"Result?"}
  Return -->|"Paid"| Success
  Return -->|"Failed/Cancelled"| Failed["/checkout/failed → retry / switch to COD"]
  Success --> Confirm(["Order confirmation + order code"])
```

---

## Order Tracking Flow ⌦

After purchase, customers track orders from **Profile → My orders** (list with status filters + search) and open an **order detail** (`/orders/:id`) for the timeline, items, address, payment, and reorder. Admins process the other side in [`/admin/orders`](./admin/orders.md). Order status is a lifecycle both sides read. *(Customer order detail + admin orders are gated on the orders module.)*

```mermaid
flowchart LR
  Profile["/profile/orders"] --> Filter(["Filter by status / search"])
  Filter --> Detail["/orders/:id"]
  Detail --> Track(["Timeline · items · payment · reorder"])
```

**Order lifecycle** (shared by customer & admin views):

```mermaid
stateDiagram-v2
  [*] --> PendingPayment: order placed
  PendingPayment --> Paid: payment confirmed
  PendingPayment --> Cancelled: unpaid / cancelled
  Paid --> Processing
  Processing --> Shipping
  Shipping --> Delivered
  Delivered --> [*]
  Paid --> Refunded: refund
  Processing --> Cancelled: cancel
  Refunded --> [*]
  Cancelled --> [*]
```

---

## Profile Flow

The account area is a tabbed hub (My account · Orders · Addresses · Notifications · Security), gated to signed-in users. A **session-restoring** state precedes the signed-out prompt so a returning user isn't wrongly shown "sign in." Address management reuses the checkout VN location picker; deleting an address is optimistic + Undo (default address is guarded).

```mermaid
flowchart TD
  Visit["/profile"] --> Auth{"Signed in?"}
  Auth -->|"Restoring"| Restore(["Session-restoring state"])
  Restore --> Auth
  Auth -->|"No"| Prompt(["Sign in to manage your account"])
  Prompt --> Login["/auth"]
  Auth -->|"Yes"| Tabs["Account · Orders · Addresses · Notifications · Security"]
  Tabs --> Account(["Edit profile / avatar / verify email"])
  Tabs --> Addr(["Add/edit/delete address (Undo)"])
  Tabs --> Ord["/profile/orders → /orders/:id"]
  Tabs --> AdminLink{"role = ADMIN?"}
  AdminLink -->|"Yes"| Admin["/admin"]
```

---

## Admin Flow

The admin console is **guarded by ADMIN role** with three distinct access states (restoring / not-signed-in / signed-in-non-admin) so a real admin is never wrongly rejected. The shell (sidebar + topbar) frames every section; the dashboard is the landing, and each section is a table/CRUD or a settings/analytics surface. Live sections (products, categories, brands, customers) and gated ones (orders, inventory, analytics, settings) share one shell and interaction language.

```mermaid
flowchart TD
  Enter["/admin/*"] --> Guard{"Auth & role?"}
  Guard -->|"Restoring"| R(["Restoring admin session"])
  Guard -->|"Not signed in"| S(["Sign in with an admin account"])
  Guard -->|"Signed in, not admin"| NA(["Admin role required + Back to shop"])
  Guard -->|"ADMIN"| Dash["/admin (Dashboard)"]
  Dash --> Nav["Sidebar sections"]
  Nav --> Products["/admin/products (CRUD)"]
  Nav --> More["Orders⌦ · Inventory · Categories · Brands · Customers · Analytics⌦ · Settings⌦"]
  Products --> Detail(["Slide-over / full editor · bulk actions"])
```

---

## Error Flows

Every failure is specific, recoverable, and keeps the app shell so the user can navigate away. Errors state *what happened and how to fix it*; irreversible/money operations are never left ambiguous.

| Error | Where | Behavior |
|---|---|---|
| **404 / not found** | Any route; removed/unpublished product | Not-found screen + "Browse catalog" (never a broken page) |
| **Auth required** | `/checkout`, `/profile`, `/orders/:id` | Redirect to `/auth?next=…`; return after sign-in |
| **Admin required** | `/admin/*` | "Admin role required" (or "sign in with admin") — not a crash |
| **Fetch failed** | Any data surface | Inline `role="alert"` + Retry; shell/sidebar stay |
| **Partial failure** | Dashboards, PDP, cart, admin | Per-widget/per-row error; the rest still renders |
| **Optimistic action failed** | Cart/wishlist/inline-edit | Revert exactly + inline error/Toast retry |
| **Payment failed / cancelled** | `/checkout/failed` | Explain; retry same order or switch to COD; order stays *pending* |
| **Invalid deep-link params** | catalog/search/reset/verify | Ignore/clamp bad values; render nearest valid view; rewrite URL |
| **Session expired mid-task** | Anywhere | Silent token refresh; hard failure → sign-in with `next` |
| **Double-submit / refresh after order** | Checkout | Idempotency key + button lock; refresh re-reads the existing order |

```mermaid
flowchart LR
  Act(["User action / navigation"]) --> Ok{"Success?"}
  Ok -->|"Yes"| Done(["Continue"])
  Ok -->|"Auth/role gate"| Redirect(["Gate screen + next"])
  Ok -->|"Fetch error"| Retry(["Inline alert + Retry (shell intact)"])
  Ok -->|"Optimistic fail"| Revert(["Revert + explain"])
  Ok -->|"Not found"| NF(["Not-found + browse"])
  Retry --> Act
  Revert --> Act
```

---

## Empty States

Empty is a designed destination, never a blank region — and the copy distinguishes *"nothing yet"* from *"nothing matches"* (different fixes). A section with genuinely nothing to show (e.g., no categories, no deals) is hidden rather than shown empty.

| Surface | Empty situation | Next action |
|---|---|---|
| Catalog / Search | No results (filtered) vs no query vs zero-match | Clear filters (keeps query) · did-you-mean · popular products |
| Cart | Never added vs removed-last vs all-unavailable | Start shopping (+ signed-in recommended rail) |
| Wishlist ⌦ | Empty vs signed-out vs all-unavailable | "Tap the heart…" teach · Sign in · Browse |
| Orders | No orders vs filtered-none | Start shopping vs clear filter |
| Addresses | None yet | Add address (VN picker) |
| Admin table | No data (new) vs no results (filtered) | Create vs clear filters |
| Admin dashboard | New store — real zeros / empty charts | Honest zero (never invented) |
| Admin planned module ⌦ | Orders/Inventory/Analytics/Settings not built | "Coming soon" placeholder (not a fake table) |

```mermaid
flowchart LR
  Load(["Surface loads"]) --> Any{"Has data?"}
  Any -->|"Yes"| Show(["Render content"])
  Any -->|"No — new"| New(["Empty: teach + primary action"])
  Any -->|"No — filtered"| Filt(["Empty: clear filters / recover"])
  Any -->|"No — nothing to show"| Hide(["Hide the section"])
```

---

## Loading Flows

Skeletons over spinners wherever the layout is known; controls stay interactive during content loads; optimistic actions feel instant. Specific transitional states cover the high-stakes moments (session restore, payment redirect).

| Moment | Treatment |
|---|---|
| First page load | Shape-matched skeletons (cards/table/chart), delay-show ~150ms, hold ~300ms min |
| Session restore | Neutral "restoring" beat before form-vs-redirect (no flash of wrong state) |
| Filter / sort / search | Skeleton over the **results only**; toolbar/filters stay live |
| Optimistic edit | Instant change + quiet pending; exact revert on failure |
| Add to cart | Optimistic cart-badge bump + mini-cart (no celebratory toast) |
| "Load more" | Button loading → appended skeleton → focus moves to first new item |
| Checkout place-order | Button locks + "Placing your order…" (double-submit guard) |
| Payment redirect | Full-screen "Redirecting to VNPay…" then hosted page |
| Gateway return | "Confirming your payment…" → success/failed |

```mermaid
flowchart LR
  Nav(["Navigate / fetch"]) --> Known{"Layout known?"}
  Known -->|"Yes"| Skel(["Shape-matched skeleton"])
  Known -->|"No"| Spin(["Delayed spinner"])
  Skel --> Ready(["Content"])
  Spin --> Ready
  Ready --> Opt{"User acts?"}
  Opt -->|"Optimistic"| Instant(["Instant update + pending → confirm/revert"])
```

---

## Backend-gating summary

Flows marked ⌦ are fully designed and ready but depend on modules not yet built. Order of dependency:

```mermaid
flowchart LR
  A["Auth reset/verify endpoints"] -.-> Auth["forgot / reset / resend flows"]
  O["Orders module"] -.-> Track["Order tracking + admin orders"]
  W["Wishlist module"] -.-> Wish["Wishlist flow"]
  P["Order create + VNPay"] -.-> Chk["Checkout completion"]
  S["Settings / analytics data"] -.-> AdminX["Admin settings / analytics / inventory"]
```

Until each lands: the entry points stay hidden or show a **"coming soon" placeholder** (never a dead link or a fake screen), and guest/gated variants degrade gracefully to what *is* built (e.g., checkout falls back to required sign-in; wishlist falls back to sign-in-to-save).

---

*This blueprint is authoritative for routing and navigation. New screens enter the route map here first, declare their access + backend status, and connect into the relevant flow. Individual screen behaviour lives in its page spec under [`pages/`](./pages/), [`auth/`](./auth/), or [`admin/`](./admin/); component behaviour in [`components/`](./components/).*
