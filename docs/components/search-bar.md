# SearchBar

Shared conventions, tokens, and the universal 8-state model live in [`README.md`](./README.md); this file states only SearchBar specifics. Full behavioural rationale is in [`../pages/search.md`](../pages/search.md); this documents the reusable component (the input + its autocomplete combobox).

# Purpose

Let users express a query and reach a result fast — by typing into a prominent field that offers **autocomplete** (suggestions, product hits, category hits) and submits to results. It's the storefront's primary find tool and the admin's quick-find.

# Responsibilities

- Provide a labelled search input with clear/submit affordances.
- Offer debounced autocomplete as a proper combobox (keyboard-complete), grouping suggestions / entities.
- Emit `query change`, `submit`, and `select(item)`; own **no** search backend logic (results/ranking live elsewhere) — this keeps it reusable for storefront and admin.

# Anatomy

`[ searchIcon · input · clear? · submit? ] → autocomplete panel[ groups → items ]`
- **Input:** the field ([`Input`](./input.md) `text`), placeholder hints scope ("Search laptops, phones…").
- **Clear (✕):** appears when non-empty.
- **Autocomplete panel:** `--color-surface-raised`, `--elevation-2`, `--z-dropdown`; grouped — **Suggestions**, **Products** (thumbnail + name + price), **Categories/Brands**, and a persistent **"See all results for '{q}'"** row. On empty focus, shows **Recent** + **Popular**.

# Variants

| Variant | Use |
|---|---|
| `storefront` | Header search with product/category autocomplete → results |
| `adminQuickFind` | Admin topbar; jumps to records (product/user/category) |
| `inlineFilter` | Lightweight in-page filter field (e.g., filter within a list); no autocomplete panel |
| `fullScreen` | Mobile overlay: large field + recent/popular → live autocomplete |

# Props / Configuration

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | enum(storefront, adminQuickFind, inlineFilter, fullScreen) | storefront | — |
| `value` / `onChange` | text/event | — | Controlled query |
| `onSubmit` | event | — | Run the full search |
| `onSelect` | event | — | Pick a suggestion/product/category |
| `suggestions` | object | — | Grouped results `{ suggestions, products, categories }` |
| `recent` / `popular` | list | — | Empty-focus content |
| `debounceMs` | number | ~250 | Autocomplete debounce |
| `minChars` | number | 2 | Below this, no autocomplete |
| `label` | text | "Search" | Visible or `aria-label` |

# Sizes

`md` field (~40–44px) in bars; `lg` in the mobile `fullScreen` overlay. Panel width ≥ the field; item rows ~40–48px (comfortable, ≥44px touch). Prices in product rows are tabular. Text ≥16px (no mobile zoom).

# States

- **Default** — empty field, panel closed.
- **Hover** — subtle field border emphasis; item hover in an open panel.
- **Focus** — instant ring; on focus with empty value, the panel shows Recent/Popular; the active autocomplete item is tracked via `aria-activedescendant` (no lag).
- **Active** — item press/select feedback.
- **Disabled** — rare; field muted, panel suppressed.
- **Loading** — a slim in-panel progress affordance while suggestions fetch; **keep prior suggestions visible** (no flicker to empty between keystrokes).
- **Empty** — *no query:* Recent/Popular landing; *query, no matches:* an in-panel "No matches — see all results for '{q}'" row (recovery lives on the results page).
- **Error** — autocomplete failure **fails silently** (hide panel or keep last-good items); the user can still submit; results-page errors are handled there.

# Accessibility

WAI-ARIA **combobox**: the input has `role="combobox"`, `aria-expanded`, `aria-controls`→listbox, `aria-activedescendant`→highlighted option; the panel is a `listbox` with grouped `option`s (accessible group labels). Product options announce name + price. The "See all results" row is a real option/button. `label` always present (visually hidden acceptable). This combobox is the most demanding a11y pattern in the app — get `aria-activedescendant` + listbox semantics right.

# Keyboard Behavior

`/` focuses it (app shortcut). `↓`/`↑` move through options (opens the panel if closed); `Home`/`End` jump; `Enter` selects the active option, or submits the typed query if none is active; `Esc` closes the panel (first press) then clears (second) and returns focus; `Tab` closes and moves on. Type-ahead is the typing itself. `fullScreen` overlay traps focus like a dialog until dismissed.

# Responsive Rules

≥md: inline field with an anchored panel. <md (storefront): tapping the field/icon opens the **`fullScreen`** overlay (keyboard-focused input, Cancel, large tappable suggestions) — a cramped floating panel under a tiny field is unusable on phones. `inlineFilter` stays inline everywhere. No horizontal overflow; panel flips to stay on screen.

# Motion

Panel opens with a quick fade (+ small `transform`); item highlight is **instant** (keyboard must not lag). Suggestion updates cross-fade in place — **never flicker to empty** between keystrokes. `fullScreen` slides up. Reduced-motion → instant. (README banned tells apply.)

# Design Rules

- Autocomplete is a **shortlist** (cap products/suggestions/categories); it defers to "See all results" for the full, paginated set — never an infinite suggestion list.
- **Products rank above text suggestions** once typing yields them (a product-with-price is the fastest success; selecting one goes straight to the PDP).
- Match highlighting on the results page uses **weight, not a colour background** (contrast + palette safe).
- Recent searches are **local + clearable** (privacy); accent-insensitive matching (reuse the app's diacritic normalization).
- Autocomplete errors are silent — never an error toast under a field being typed in.

# Do's

- Do keep prior suggestions visible while the next set loads.
- Do route a product hit directly to its PDP.
- Do provide the persistent "See all results" escape.

# Don'ts

- Don't paginate autocomplete (cap + defer).
- Don't flicker the panel to empty between keystrokes.
- Don't announce every keystroke (summarize; polite live region).
- Don't show an error under an active search field.

# Usage Examples

- **Storefront header** search + autocomplete → `/search` ([`../pages/search.md`](../pages/search.md)); `fullScreen` on mobile.
- **Admin quick-find** in the [`Navbar`](./navbar.md) admin topbar (jump to records).
- **inlineFilter** for a simple within-list filter (e.g., a small admin reference list).

# Future Extensions

- **Instant results** (results updating live beneath the panel).
- **Typo tolerance / synonyms / "did you mean"** surfaced in the panel.
- **AI natural-language query** ("gaming laptop under $1,200") → parsed filters (ties to the AI assistant).
- **Voice / visual search** entry points.
