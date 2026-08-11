# TechShop Product Detail (PDP) — Design Specification

**Status:** Implementation-ready · **Version:** 1.0 · **Last updated:** 2026-08-07
**Governed by:** [`design-system.md`](../design-system.md) · **Continues:** [`home.md`](./home.md), [`catalog.md`](./catalog.md)
**Route:** `/product/:slug` (canonical) or `/product/:id`. Optional `?variant=<sku>` to deep-link a specific configuration.

The catalog page narrows a large set to a shortlist; the PDP closes the sale on **one** product. It is the last screen before the cart, so its entire job is to give a shopper everything they need to decide "yes" and make the add-to-cart action effortless and always reachable. Every token and component below resolves to the design system; every decision states its reasoning; it is written so an engineer can build it without guessing.

**A note on three required sections.** This template includes *Search & Filtering*, *Sorting*, and *Pagination* headings. A PDP has no faceted catalog filtering — so those headings are interpreted for the PDP's real analogs: **variant selection** (the PDP's "filter"), **review sorting** (when the reviews module ships), and **review pagination / gallery navigation**. Each section says so explicitly rather than forcing a catalog concept onto a detail page.

---

## Table of contents

Purpose · Target Users · Primary User Goals · Information Architecture · Desktop Layout · Tablet Layout · Mobile Layout · Visual Hierarchy · Components Used · User Flow · Empty States · Loading States · Error States · Search & Filtering Behavior · Sorting Behavior · Pagination / Infinite Scroll · Accessibility · Responsive Rules · Motion · Edge Cases · Future Improvements

---

## Purpose

Convert consideration into an add-to-cart. The shopper arrives already interested; the PDP must (1) **show** the product convincingly (imagery + specs), (2) **confirm** the buying variables (variant, price, availability), (3) **build confidence** (trust signals, and reviews once they exist), and (4) **remove friction** from the add-to-cart action.

The single most important element on the page is the **add-to-cart control**, and the single most important rule is that it — and the price/availability it depends on — is **reachable at every scroll position** (sticky buy box on desktop, sticky bottom bar on mobile). Everything else is arranged around keeping that decision in view.

**Why the PDP is a distinct page (not a modal/quick-view):** it needs a shareable, deep-linkable URL (users share products, open them in new tabs, and return via Back), it carries enough content to warrant a full screen (gallery, specs, reviews, related), and it benefits from SEO. Quick-view is a *Future Improvement* layered on top of the catalog — it never replaces the canonical PDP.

---

## Target Users

| User | Arrives from | Mindset | What they need most |
|---|---|---|---|
| **Comparison shopper** | Catalog click-through | "Is this the one?" | Gallery + specs + price/variant clarity to finish comparing |
| **Directed buyer** | Search / direct link | "I want this — let me buy it" | Fast path: variant → qty → add to cart |
| **Researcher** | Catalog / search | "Does it meet my requirements?" | Complete, scannable specifications |
| **Trust-checker** | Any entry | "Can I trust this product/seller?" | Reviews, ratings, return/warranty reassurance *(reviews = future module)* |
| **Returning visitor** | Shared link, recommendation, history | "Back to buy or re-check" | State restored (variant in URL), consistent behavior |
| **Signed-out browser** | Anywhere | "Browsing, might buy" | Add-to-cart works without forcing sign-in (browse-first principle) |

Like the catalog, the PDP is **operated, not read top-to-bottom**: different users jump to different regions (the buyer to the buy box, the researcher to specs, the trust-checker to reviews). The layout surfaces the buy decision first and lets the rest be reached by scroll or in-page jump-nav.

---

## Primary User Goals

1. **See exactly what the product is** — high-quality images from multiple angles, zoomable.
2. **Confirm the buying variables** — the right variant, its price, and whether it's in stock.
3. **Understand the details** — a scannable specification table and a readable description.
4. **Build confidence** — return/warranty/shipping reassurance now; ratings & reviews when the module lands.
5. **Add to cart with zero friction** — one obvious action, always in reach, with immediate feedback.
6. **Keep going** — related/recommended products for continued discovery, or proceed to cart.

Goal 5 drives the two foundational layout decisions: the **sticky buy box (desktop)** and **sticky add-to-cart bar (mobile)**. Goal 2 drives the **variant-in-URL** decision (a configured product is shareable and restorable).

---

## Information Architecture

**Content priority (outermost → in):**

```
Customer shell (shared header + footer)
└─ PDP
   ├─ Breadcrumb                         (Home / Category / Product)
   ├─ PRIMARY: buy decision
   │   ├─ Gallery         (images, zoom)
   │   └─ Buy box         (title · brand · rating · price · variant · qty · availability · add-to-cart)
   ├─ In-page sub-nav     (Overview · Specifications · Reviews)   ← scroll-spy, sticky
   ├─ SECONDARY: details
   │   ├─ Overview/description
   │   └─ Specifications (table)
   ├─ TERTIARY: proof + discovery
   │   ├─ Reviews          (future module)
   │   └─ Related / Recommended products
   └─ Footer
```

**URL & state:**

| State | Where it lives | Why |
|---|---|---|
| Which product | Path (`/product/:slug`) | Canonical, shareable, SEO |
| Selected variant | `?variant=<sku>` | A configured product is a shareable, restorable view |
| Gallery active image | Ephemeral (component state) | Not worth a URL; resets on navigation |
| Reviews sort/page | Ephemeral or hash (future) | Secondary content; doesn't need to pollute the canonical URL |

**Why stacked anchored sections, not tabs, for Overview/Specs/Reviews:** tabs *hide* content behind a click — bad for SEO, bad for the scroller who wants to read straight through, and bad for "Ctrl-F". Stacked sections with a **sticky scroll-spy sub-nav** (jump links that highlight the current section) keep everything visible and crawlable while still giving fast navigation. This is the restraint-favoring, Hallmark-consistent choice.

**Data available now** (from the product model): images[] (with `altText`, `isPrimary`), name, brand, category, `basePrice`, `stockQuantity`, `status`, variants[] (`variantName`, `sku`, `price`, `stockQuantity`, `isDefault`), specifications[] (`name`/`valueText`), `shortDescription`, `description`. **Not yet available (gated as future):** ratings/reviews (planned module), wishlist (planned), Q&A. Related products come from the recommendations feature, falling back to same-category products.

---

## Desktop Layout

**≥ 1024px (`lg`+).** Two-column above the fold; full-width stacked sections below. Content within `--layout-max`.

```
┌───────────────────────────── Header (sticky) ─────────────────────────────┐
├────────────────────────────────────────────────────────────────────────────┤
│  Home / Laptops / AeroBook Pro 14                          ‹ breadcrumb ›   │
│ ┌───────────────────────────┐   ┌──────────────────────────────────────┐   │
│ │  ┌─────────────────────┐  │   │ AeroBook Pro 14           ‹ h1 ›       │   │
│ │  │                     │  │   │ Acme · ★★★★☆ (128)  ‹brand · rating*› │   │
│ │  │     main image      │  │   │                                        │   │
│ │  │     (zoom)          │  │   │ $1,249            ‹ price, tabular ›    │   │
│ │  │                     │  │   │ In stock                               │   │
│ │  └─────────────────────┘  │   │                                        │   │
│ │  [▪][▫][▫][▫] thumbnails  │   │ Configuration:  [ 16GB ] [ 32GB ]      │   │
│ │                           │   │ Qty: [ − 1 + ]                         │   │
│ │      (GALLERY)            │   │ ┌────────────────────────────────────┐ │   │
│ │                           │   │ │        Add to cart        (primary) │ │   │
│ │                           │   │ └────────────────────────────────────┘ │   │
│ │                           │   │   ♡ Save for later      (secondary)*   │   │
│ │                           │   │ ─ Free shipping · 30-day returns · … ─  │   │
│ │                           │   │        (BUY BOX — sticky)              │   │
│ └───────────────────────────┘   └──────────────────────────────────────┘   │
│  [ Overview · Specifications · Reviews ]        ‹ sticky scroll-spy nav ›    │
│  Overview …                                                                 │
│  Specifications  (2-column key/value table, tabular values)                 │
│  Reviews*                                                                   │
│  Related products  (ProductCard rail)                                       │
├────────────────────────────────── Footer ──────────────────────────────────┤
```
*(★ rating, ♡ save, Reviews = gated future module; shown here for placement, hidden until built.)*

- **Split:** gallery ~52–55%, buy box ~45–48%. **The buy box is sticky** (pins within the viewport) so as the user scrolls the gallery/description, the price + variant + add-to-cart stay in view — the whole point of the page.
- **Gallery:** large main image with **hover-zoom** (magnify region) or click-to-open a lightbox; a vertical or horizontal thumbnail strip; thumbnails are buttons. Solid neutral image background — never a gradient.
- **Buy box:** title (`h1`), brand link, rating summary (future), **price** (`--weight-semibold`, tabular numerals, largest non-title element), availability, variant selector, quantity stepper, one **primary** "Add to cart", a lower-emphasis secondary ("Save for later"/wishlist — future), and a quiet service-reassurance line (real policy copy, no invented numbers).
- **Below the fold:** sticky sub-nav (Overview / Specifications / Reviews) with scroll-spy; then stacked sections; then a related-products rail (reused ProductCard).

---

## Tablet Layout

**768–1023px (`md`).** Two-column is retained but compact, because losing the side-by-side gallery/buy-box would push the price and add-to-cart below a tall gallery.

- Gallery ~48% / buy box ~52%; thumbnails move to a **horizontal strip beneath the main image** to reclaim width. Hover-zoom is replaced by **tap-to-open lightbox** (coarse pointer).
- The buy box condenses (tighter spacing, secondary actions may collapse under a "more" affordance) but keeps price + variant + Add to cart visible.
- A **sticky bottom add-to-cart bar** appears once the inline Add-to-cart scrolls out of view (price + variant summary + Add button), so the action is never lost on a narrower screen.
- Below-fold sections stack full-width; the scroll-spy sub-nav remains.
- **Reasoning:** tablet landscape is common and benefits from the desktop 2-col decision context; the sticky bar covers the narrower portrait case where the buy box can scroll away.

---

## Mobile Layout

**< 768px (`xs`–`sm`).** Single column, everything stacked, with a persistent sticky bottom bar carrying the decision.

- **Gallery:** a **swipeable carousel** (main image full-width) with a position indicator (dots + "3/8" counter) and tappable thumbnails below or a peek of the next image. **Manual only — never autoplay.** Tap opens a full-screen zoom/lightbox (pinch-zoom).
- **Order:** gallery → title → price → rating (future) → variant selector → quantity → availability → (inline Add to cart) → reassurance → sub-nav → sections → related rail.
- **Sticky bottom bar** (`--z-sticky`) is **always present** on mobile: current price + a full-width **Add to cart** button (and the selected variant in a compact label). It's the mobile equivalent of the sticky buy box.
- **Specifications & description may be collapsible accordions** to cut scroll length; the first spec group and the short description are expanded by default. Reviews below.
- **Reasoning:** on a phone the decision must be one thumb-tap away at all times; the sticky bottom bar is the single highest-impact mobile pattern. Accordions trade a little discoverability for a manageable scroll on long spec sheets, with the most important content expanded.

---

## Visual Hierarchy

Reads in this order; scale/space/color enforce it (max weight 700).

1. **Gallery main image** — the largest element; the product must be *seen* first.
2. **Product title (`h1`)** — `--text-h1`, `--weight-bold`/display face.
3. **Price** — `--weight-semibold`, tabular numerals, `--color-heading`; the decisive number, second only to the title in the buy box. Discounts show original + current with a real percentage (computed, never invented).
4. **Add to cart (primary CTA)** — the one `--color-primary` fill in the buy box; unmistakably the main action. Exactly one primary per page.
5. **Variant selector + availability** — prominent, directly above/near the CTA because they gate it.
6. **Rating summary** *(future)* — near the title as a trust glance.
7. **Specifications** — scannable key/value table, values tabular where numeric; the researcher's destination.
8. **Description, reassurance, reviews, related** — secondary/tertiary; muted, structural.

**Applied rules:** color is earned — brand color appears on the CTA, selected variant, and links only; no gradients; states pair color with text/shape (in-stock, out-of-stock, discount). The buy box breathes; the spec table is denser (a working surface). Whitespace signals importance: the CTA has clear air around it so nothing competes.

---

## Components Used

Everything maps to the shared library; new components are added there first (reused by future search/category/cart), never inlined.

| Area | Components |
|---|---|
| Shell | Header · Footer (shared) |
| Wayfinding | Breadcrumb (from catalog spec) · **InPageSubNav (scroll-spy)** *(new)* |
| Gallery | **Gallery** *(new: main image · thumbnail strip · hover-zoom/lightbox · mobile carousel)* |
| Buy box | Section title (`h1`) · **RatingSummary** *(new, future)* · price display · **VariantSelector** *(new: pill/swatch group or Select)* · **QuantityStepper** *(new)* · Button (primary add-to-cart) · Button (secondary save/wishlist, future) · Badge (stock/discount) · reassurance line |
| Details | Spec **Table** (design-system table patterns) · **Accordion** *(new, mobile)* · Description block |
| Proof / discovery | Reviews block *(future)* · **ProductCard** (reused) rail for related/recommended |
| Sticky action | **StickyAddToCartBar** *(new, tablet/mobile)* |
| Feedback | **MiniCart / cart confirmation** *(new)* or inline confirmation · Toast (errors only) · Skeleton · Empty state · Alert (error) |

**Reasoning:** the reused ProductCard keeps related products visually identical to the homepage/catalog. The Gallery, VariantSelector, QuantityStepper, and StickyAddToCartBar are PDP-shaped but reusable (quick-view, cart) so they belong in the library. Add-to-cart feedback is a **mini-cart/inline confirmation + cart-badge bump**, not a celebratory toast — per the design system, visible changes don't get congratulatory toasts.

---

## User Flow

**Primary loop:**

```
Arrive (from catalog / search / link / recommendation)
  → View gallery (zoom, swipe angles)
  → Read title + price + availability
  → Select variant  → price/image/stock update in place (URL ?variant= updates)
  → Set quantity (clamped to stock)
  → Add to cart  → optimistic: cart badge increments + mini-cart/confirmation opens
       → "View cart" (→ cart)   OR   "Continue shopping" (dismiss, stay on PDP)
  → (optional) scroll specs / reviews to confirm  ·  browse related products
```

**Detailed steps & reasoning:**
1. **Arrival & default variant.** If `?variant=` is valid, select it; else select the `isDefault` variant (or the base product if no variants). Price/gallery reflect the selection immediately.
2. **Evaluate.** Gallery zoom + spec table + reassurance build confidence. The buy box stays in view (sticky).
3. **Configure.** Variant change updates price, availability, and (if variant-specific) the gallery — **in place, no full reload** — and updates the URL. Quantity clamps to the variant's stock.
4. **Add to cart.** Optimistic: the header cart badge increments and a mini-cart/confirmation appears offering "View cart" or "Continue shopping." If the request fails, the badge reverts and an inline error/retry shows.
5. **Continue.** Related/recommended rail invites another product; or the user proceeds to cart/checkout.
6. **Guest add.** Signed-out users can add to cart (browse-first principle); the cart persists for the guest and merges on sign-in (cart spec concern).

**Blocked/deferred:** "Buy now" (skip-cart) and wishlist are **hidden or disabled** until checkout and wishlist modules exist — never shown as dead controls.

---

## Empty States

Design-system Empty-state anatomy where a whole region is empty; otherwise omit the region.

| Region | Condition | Behavior |
|---|---|---|
| Gallery | No images | Neutral placeholder (brand/category glyph) as the main image; no broken-image icon; thumbnails omitted |
| Variant selector | No variants | Selector hidden entirely; base price/stock used |
| Specifications | No specs | Section shows "No specifications listed for this product yet." (kept, so the researcher isn't confused by a missing section) or is hidden if the page has other rich detail — choose hidden only if description is substantial |
| Description | No description | Fall back to `shortDescription`; if neither, hide the Overview body (keep the anchor if reviews/specs exist) |
| Reviews *(future)* | No reviews yet | "No reviews yet — be the first to review this product." + write-review action (only when the reviews module exists) |
| Related products | No recommendations | Fall back to same-category products; if none, hide the rail entirely |

**Reasoning:** a PDP is about *one* product, so most "empty" cases are handled by **hiding the region**, not by a full-page empty state. The exception is specs — a missing spec section can read as "data broken," so an explicit "none listed" line is clearer when the rest of the page is thin.

---

## Loading States

Skeletons over spinners (design-system rules); distinguish **first load** from **variant change**.

- **First load:** skeletons for gallery (main image block + thumbnail row), buy box (title lines, price line, variant pills, a button block), spec table (rows), and the related rail (card skeletons). Regions load in parallel; the buy box is prioritized (it's the LCP-adjacent decision area).
- **Variant change:** **no full reload** — only price, availability, and (if applicable) the gallery update. Show a subtle inline pending state on the affected values (price/stock) for slow responses; keep the rest of the buy box interactive.
- **Add to cart:** the button enters a loading state (spinner + preserved width, no layout shift); on success it briefly confirms and the mini-cart opens.
- **Related / reviews:** lazy-load below the fold; their own skeletons; a failure here never blocks the buy box.
- **Timing:** delay-show skeletons ~150ms; keep ~300ms minimum once shown. Loading regions carry `aria-busy`; price/stock changes announce via `aria-live`.
- **LCP discipline:** the gallery main image is the likely Largest Contentful Paint element — it is **high fetch priority and never lazy-loaded**; only below-the-fold media (related rail, later gallery images) is lazy.

---

## Error States

- **Product fetch fails:** full-page error state (`role="alert"`) — "Couldn't load this product. Check your connection and try again." — with **Retry** and "Back to catalog." Header/breadcrumb still render.
- **Product not found / unpublished (public):** a dedicated **not-found** state — "This product isn't available." — with a "Browse the catalog" action and (if possible) related suggestions. A shared link to a removed/draft product must land here, not on a broken page.
- **Partial failures:** if the product loads but reviews or related products fail, show an inline error + Retry **only in that section**; the buy box and specs remain fully usable.
- **Add-to-cart fails:** revert the optimistic badge/mini-cart, show an inline error or error toast with a Retry that reuses the current variant/qty.
- **Invalid `?variant=`:** ignore it and select the default variant (don't error); rewrite the URL to the corrected/default state.
- **Quantity > stock:** clamp to available stock and show a small explanatory message ("Only 3 left") rather than allowing an impossible add.

**Reasoning:** the buy decision must survive partial backend failures — the researcher can still read specs even if reviews are down. Errors state what happened and how to recover (design-system copy rules); invalid inputs degrade gracefully rather than throwing.

---

## Search & Filtering Behavior

A PDP has **no faceted catalog filtering** — that lives on the catalog page. The PDP's analogs:

**Variant selection (the PDP's "filter").**
- Variants render as a labeled control: **pill/swatch group** for a small set (the default), or a **Select** when there are many options. Each option shows its label; price differences are reflected on selection.
- **Selecting a variant** updates price, availability, quantity max, and any variant-specific gallery images **in place**, and writes `?variant=<sku>` to the URL (deep-linkable configuration).
- **Unavailable variants** (out of stock) are shown **disabled**, not hidden, with the reason ("Out of stock") — so the shopper understands the option exists but isn't buyable, rather than wondering where it went. (Same principle as the catalog's zero-result facet dimming.)
- Before any selection (no default), price shows "From {lowest variant price}" and the CTA prompts "Select a configuration."

**Review filtering** *(future module).* When reviews ship: filter by star rating and "with photos." Until then the reviews region is gated off — no filters are shown for content that doesn't exist.

**Global search.** The shared header search is present as on every page; it navigates to the catalog/search results, not within the PDP.

**Spec search** *(enhancement).* For very large spec sheets, an in-section "find in specifications" filter is a Future Improvement, not v1.

**Reasoning:** variant selection *is* the interactive narrowing on a PDP; treating unavailable variants like disabled facet options keeps the model consistent with the catalog and honest about what's buyable.

---

## Sorting Behavior

The PDP has no primary sortable list; its sortable sub-content is reviews and, loosely, related products.

- **Reviews sort** *(future module).* Options when reviews land: **Most helpful** (default), **Newest**, **Highest rated**, **Lowest rated**. A labeled Select above the review list; changing it re-orders and resets the review pagination to page 1 with a stable secondary sort (by date) so pages don't duplicate. Gated until the reviews module exists.
- **Related / recommended ordering.** Ordered by the recommendations service's relevance (or, in same-category fallback, by popularity → newest). Not user-sortable — it's a curated rail, not a list the shopper re-orders.
- **Specifications order.** Presented in a deliberate, consistent order (grouped: key specs first — e.g., CPU/RAM/storage — then the rest), sourced from the spec definitions' order, not alphabetized, so the important specs lead.

**Reasoning:** sorting only appears where the user genuinely benefits (reviews). Imposing sort controls on curated rails or spec tables would be noise; spec order is an editorial decision, not a user control.

---

## Pagination / Infinite Scroll

The PDP paginates only its reviews; the gallery and related rail use navigation, not pagination.

- **Reviews** *(future module):* a **"Load more reviews"** button (consistent with the catalog's decision — no auto-firing infinite scroll), page size ~10, focus moves to the first newly-loaded review on append, and the footer stays reachable. Deep-linking to a review page/anchor is a future nicety.
- **Gallery:** navigation, not pagination — thumbnails (desktop/tablet) or a swipe carousel with a "n / total" counter (mobile). No auto-advance; manual and keyboard-operable.
- **Related products rail:** a **horizontally-scrollable** rail (manual/keyboard scroll), not paginated — it's a finite curated set.

**Reasoning:** the same rationale as the catalog's pagination decision — auto-infinite-scroll harms footer reachability, accessibility, and control. A PDP has even less reason for it, since its long content is finite (specs) or curated (related).

---

## Accessibility

Baseline WCAG 2.1 AA (design-system Accessibility section).

- **Structure:** one `h1` (product name); ordered headings (buy box, Overview, Specifications, Reviews, Related); landmarks (`header`, breadcrumb `nav`, `main`, sub-nav `nav`, `footer`). A "skip to details" link bypasses the gallery for keyboard users.
- **Gallery:** thumbnails are buttons with accessible names ("View image 2 of 8"); the main image has meaningful `alt` (from `altText`, falling back to product name); the mobile carousel has manual controls, an announced position ("Image 3 of 8"), and no autoplay; zoom/lightbox is keyboard-operable (Escape closes, focus trapped, focus returns to the trigger).
- **Variant selector:** exposed as a radio group (single-choice) or listbox with a group label; the selected option is programmatically indicated; disabled/out-of-stock options convey their state and reason, not by color alone.
- **Quantity stepper:** a labeled numeric input with −/+ buttons carrying `aria-label`s; respects min/max; typed values are validated and clamped.
- **Price & availability** live in the buy box near the title; changes on variant selection announce via `aria-live` so non-visual users get the same update sighted users see.
- **Add to cart:** a real button with a clear name; on success the cart change announces via `aria-live`; focus is managed to the mini-cart/confirmation so keyboard users land on the next choice ("View cart"/"Continue").
- **Specifications:** a real table with header cells (`th`) and scope, or a described definition list — machine-readable, not visual-only rows.
- **Sticky bars** never obscure focused content — the page reserves bottom padding equal to the sticky bar height so the last content and focus rings aren't hidden.
- **Sub-nav** exposes the current section (`aria-current`); scroll-spy updates don't steal focus.
- **Contrast & color-independence:** ≥ 4.5:1 text / ≥ 3:1 UI in both themes; stock/discount/selected states pair color with text or shape.
- **Focus:** visible instant focus ring everywhere (never animated); logical order across breadcrumb → gallery → buy box → sub-nav → sections.
- **Reduced motion:** gallery transitions, zoom, and reveals respect `prefers-reduced-motion` (see Motion).

**Reasoning:** the two highest-impact PDP a11y decisions are announcing price/stock/cart changes via live regions (otherwise variant selection and add-to-cart are silent to screen readers) and keeping the sticky bar from hiding focused content.

---

## Responsive Rules

Mobile-first; verified at 320 / 375 / 414 / 768 / 1024 / 1280px. Breakpoints per the design system.

| Concern | `xs`–`sm` (<768) | `md` (768–1023) | `lg`+ (≥1024) |
|---|---|---|---|
| Gallery / buy box | Stacked (gallery → buy box) | Compact two-column | Two-column, **buy box sticky** |
| Gallery interaction | Swipe carousel + tap-to-zoom (lightbox) | Thumbnails below + tap lightbox | Thumbnail strip + hover-zoom/lightbox |
| Add-to-cart reach | **Sticky bottom bar (always)** | Sticky bottom bar on scroll | Sticky buy box |
| Specs / description | Collapsible accordions (first group open) | Expanded, stacked | Expanded, stacked |
| Sub-nav | Horizontal scroll or omit if short | Sticky scroll-spy | Sticky scroll-spy |
| Related rail | Horizontal scroll, ~1.2 cards peek | Horizontal scroll | Horizontal scroll / small grid |

**Global:** no horizontal page scroll at any width; the gallery carousel, related rail, and any wide content scroll within their own containers. Type and section padding interpolate fluidly. Touch targets ≥ 44px (thumbnails, stepper, variant pills, CTA). Images use an intrinsic aspect ratio to prevent layout shift as they load. The sticky bar reserves layout space so it never overlaps the footer or last content.

---

## Motion

Short, scoped, reversible (design-system Motion: animate only `transform`/`opacity`; `--dur-fast`/`--dur-base`; `--ease-out`; one signal per element; reduced-motion honored).

| Interaction | Behavior |
|---|---|
| Gallery image change | Cross-fade (`opacity`, ≤ `--dur-base`); no slide-jank. Mobile swipe uses `transform`. |
| Thumbnail hover/select | One signal — border/opacity shift; selected thumbnail clearly marked. |
| Zoom (desktop) | Hover-magnify follows the cursor smoothly; lightbox opens with a quick fade+scale (`transform`), Escape to close. |
| Variant select | Price/availability/image cross-fade in place; the layout doesn't jump (reserve space). |
| Quantity ± | Instant value change; button press = subtle 1px translate. |
| Add to cart | Button → loading → brief "Added" confirmation; **cart badge bumps once** (one signal); mini-cart slides/fades in. **No confetti / celebratory toast.** |
| Sticky bottom bar (tablet) | Slides up once when the inline CTA leaves the viewport (`transform`); reduced motion → appears instantly. |
| Accordion (mobile) | Expand/collapse is quick and, under reduced motion, instant; caret rotates (`transform`). |
| Sub-nav scroll-spy | Active indicator shifts smoothly; never steals focus or scroll. |
| Focus (any control) | Ring appears **instantly** — never transitioned. |

**Banned:** auto-advancing gallery, bounce/overshoot, hover-scale on everything, animated gradients, layout-shifting toasts, scroll-triggered fade-up on every section. **Reasoning:** the PDP updates on variant selection and add-to-cart constantly; motion must make those changes *legible* (a cross-fade says "this updated") without adding perceived latency to the buy loop.

---

## Edge Cases

Each has a defined behavior.

| Case | Behavior |
|---|---|
| **Whole product out of stock** | Buy box shows "Out of stock"; Add-to-cart disabled; "Notify me when back" (future) or a quiet note; product still viewable. |
| **Specific variant out of stock** | That variant option disabled with reason; other variants selectable; if the deep-linked variant is OOS, select it but reflect the disabled buy state. |
| **Variant price differences** | Price updates on selection; before selection show "From {min price}"; price sorts/labels use the same effective value shown. |
| **No variants** | Variant selector hidden; base price/stock used. |
| **Single image / no images** | Single image → no thumbnails/carousel controls; none → neutral placeholder (never a broken image). |
| **Very long title / description** | Title wraps (balanced, no clamp needed on PDP); long description gets a "read more" or lives in the accordion on mobile. |
| **Huge specification list** | Grouped, key specs first; "show all specifications" reveal on mobile to cap initial scroll. |
| **Quantity exceeds stock** | Clamp to available; show "Only N left". |
| **Add-to-cart while stock changed (race)** | Backend validates; on rejection revert optimistic update + explain ("This just sold out"). |
| **Guest add-to-cart** | Allowed; cart persists for the guest and merges on later sign-in (cart spec). |
| **Buy-now / wishlist before their modules exist** | Hidden or disabled — never a dead control. |
| **Reviews module absent** | Reviews section + rating summary + sub-nav "Reviews" item hidden entirely; no placeholder stars. |
| **Recommendations empty** | Fall back to same-category; if none, hide the related rail. |
| **Invalid/deep-linked `?variant=`** | Ignore, select default, rewrite URL. |
| **Unpublished/removed product via direct link** | Not-found state (public), not an error page. |
| **Currency/locale** | Prices formatted per locale with tabular numerals (reuse the shared formatter). |
| **Back from cart/checkout** | Restore the PDP with the selected variant (from URL) and scroll position. |
| **Low-res image zoom** | Cap zoom to avoid pixelation; note "image may vary" if needed (editorial). |

---

## Future Improvements

Out of scope for v1 — mostly because the data or a backend module doesn't exist yet, listed so they aren't faked.

- **Ratings & reviews + Q&A** — the biggest gap; unlocks the rating summary, review list/sort/filter/pagination, and "be the first to review." Blocked on the planned reviews module.
- **Wishlist / save for later** — the secondary buy-box action; blocked on the wishlist module.
- **Buy now (express checkout)** — skip-cart path; blocked on checkout.
- **Variant-specific galleries** — swap the full image set per variant (needs images tagged by variant).
- **Richer media** — product video, 360° spin, user-submitted photos.
- **Live price/stock** — real-time updates while the page is open.
- **Delivery estimate by address**, **financing/installment display**, **size/spec guides**.
- **Cross-sell / bundles** — "frequently bought together," accessories for this product.
- **Recently viewed** rail and **product comparison** (select 2–4 → compare), tying into the catalog's compare feature.
- **AI assistant hook** — "Is this good for video editing?" answered from specs/reviews, tying into the planned AI feature.
- **SEO structured data** — Product/Offer/AggregateRating schema for rich results.
- **Quick-view** on the catalog reusing the Gallery + buy-box components (never replacing the canonical PDP).

---

*End of specification. Build order suggestion: (1) shared new components — Gallery, VariantSelector, QuantityStepper, InPageSubNav, StickyAddToCartBar, Accordion — since cart, quick-view, and future pages reuse them; (2) the buy box wired to real product/variant data with in-place variant updates and URL sync; (3) gallery with zoom/lightbox and the responsive stack; (4) specs table + description + related rail (reusing ProductCard); (5) add-to-cart contract with optimistic update + mini-cart, guarded for the not-yet-built cart; (6) gate reviews/wishlist/buy-now behind their modules and implement the edge-case + error handling.*
