# ProductCard

Shared conventions, tokens, and the universal 8-state model live in [`README.md`](./README.md); this file states only ProductCard specifics. **One ProductCard** appears everywhere a product is shown in a grid or rail, so the product looks identical across the whole storefront.

# Purpose

Represent a single product compactly enough to scan in a grid, yet completely enough to decide to click — image, name, price, and (when real) a status/deal signal, plus an add-to-cart affordance. It is the storefront's most-repeated unit.

# Responsibilities

- Present product identity (image, name, brand) and the decisive value (price).
- Surface **real, data-driven** signals only (badges, discounts, stock) — never invented ones.
- Provide the primary click-through (→ PDP) and a quick add-to-cart / save affordance.
- Own **no** catalog or cart logic — it emits `open`, `addToCart`, `toggleSave`; the page/store handles them (reuse across home, catalog, PDP-related, wishlist, search).

# Anatomy

`[ media (image + badges + save toggle) · body (brand · name · price · action) ]` in a [`Card`](./README.md#composition-rules) container (one containment layer).
- **Media:** product image (or neutral placeholder — never a gradient block or broken image); optional [`Badge`](./badge.md) (real flag) top-corner; optional **save (heart)** toggle.
- **Body:** brand/category (muted), **name** (link, 2-line clamp), **price** (`--weight-semibold`, tabular), optional original→current price for a **real** discount.
- **Action:** "Add" Button (or "View" when add isn't applicable); out-of-stock shows a disabled/"Notify me" state.

# Variants

| Variant | Use |
|---|---|
| `default` | Standard grid tile (home/catalog/search) |
| `deal` | Shows original + current price + a real % off |
| `outOfStock` | De-emphasized media, "Out of stock" badge, add disabled |
| `wishlist` | Adds a prominent Remove + "Move to cart" (see [`../pages/wishlist.md`](../pages/wishlist.md)) |
| `featured` | 2× span tile to break a uniform grid (one per band) |
| `compact` | Rail/`sm` density (smaller media, tighter body) |

# Props / Configuration

| Prop | Type | Default | Notes |
|---|---|---|---|
| `product` | object | — | `{ id, name, brand, imageUrl?, price, originalPrice?, status, badge? }` |
| `variant` | enum(default, deal, outOfStock, wishlist, featured, compact) | default | — |
| `href` | text | — | PDP link |
| `showSave` | boolean | false | Wishlist heart toggle |
| `saved` | boolean | false | Save toggle state |
| `onOpen` / `onAddToCart` / `onToggleSave` | event | — | Callbacks (no internal logic) |
| `priceFormatter` | function | shared | Locale + tabular currency |

# Sizes

Grid tile min-width ~240px (design-system product-grid rule), `--space-6` gaps; `compact` for rails (~180–200px). Media keeps a fixed intrinsic aspect ratio (no layout shift as images load). `--radius-md`, `--elevation-1`.

# States

- **Default** — resting tile.
- **Hover** — one signal: raise `--elevation-1`→`--elevation-2` (or a 1px lift); the save toggle and Add remain visible (not hover-only).
- **Focus** — instant ring on the card link / actions; focus order name → save → add.
- **Active** — Add press feedback; save toggle fills.
- **Disabled** — `outOfStock`: media de-emphasized, Add disabled/"Notify me".
- **Loading** — a shape-matched skeleton (media block + brand/name lines + price + action) while grids load.
- **Empty** — n/a at the card level (an empty *grid* shows the page's empty state).
- **Error** — image error → placeholder (silent); an `addToCart` failure reverts the optimistic cart update and surfaces a [`Toast`](./toast.md) error (the card doesn't render its own error).

# Accessibility

Card is a real link (accessible name = product name + price); the "Add" and save controls are separate real buttons with names scoped to the product ("Add AeroBook Pro 14 to cart", "Save AeroBook Pro 14"). Image `alt` = product name (or `alt=""` if the name link is adjacent and redundant). Save toggle exposes `aria-pressed`. Badges/discounts convey via text, not colour alone. Not hover-only — every action is tappable/focusable.

# Keyboard Behavior

Tab reaches the name link, then save, then Add; `Enter` opens (name), `Enter`/`Space` toggles save / triggers Add. No custom key handling; within a grid, normal tab order flows card to card (a roving `arrowkey` grid nav is a future option).

# Responsive Rules

Grid reflows 4→3→2→1 (auto-fill min-width; image tracks floored at 0). On touch, actions are always visible (no hover reveal); name clamps to 2 lines with the full name available; `featured` drops its 2× span on the smallest widths. Prices stay tabular at all sizes.

# Motion

Hover elevation lift (one signal); save toggle a quick one-shot heart fill (`transform`, `--dur-fast`) — the one place a small tasteful confirmation is warranted; add-to-cart triggers an optimistic cart-badge bump (in the Navbar), **not** confetti. Skeleton shimmer; static under reduced motion.

# Design Rules

- **Real signals only** — badges/discounts/stock come from data; never invent "Best seller"/"-30%". (Hallmark honest-copy rule.)
- One containment layer — the tile is the card; no card-in-card.
- Price is the decisive in-body element (tabular); a discount shows both prices with a computed % (never a made-up one).
- Media never a gradient placeholder or broken image — use a neutral product glyph.
- Identical presentation everywhere; pages vary content and actions, not the look.

# Do's

- Do keep actions visible and tappable (touch-first).
- Do reserve media aspect ratio to prevent layout shift.
- Do use `featured` sparingly to break a uniform grid.

# Don'ts

- Don't fabricate badges, ratings, or discounts.
- Don't hide Add/save behind hover.
- Don't let the name break the card's fixed height (clamp).
- Don't celebrate add-to-cart (silent + badge bump).

# Usage Examples

- **Home** rails/grid ([`../pages/home.md`](../pages/home.md)); **Catalog/Search** results grid ([`../pages/catalog.md`](../pages/catalog.md), [`../pages/search.md`](../pages/search.md)).
- **PDP** related/recommended rail ([`../pages/product-detail.md`](../pages/product-detail.md)).
- **Wishlist** collection (`wishlist` variant) ([`../pages/wishlist.md`](../pages/wishlist.md)).

# Future Extensions

- **Quick-view** trigger (opens a [`Modal`](./modal.md) with gallery + buy box) without leaving the grid.
- **Ratings** (stars) once the reviews module exists (real data only).
- **Compare** checkbox for a product-comparison feature.
- **Variant swatches** on the card for quick configuration.
