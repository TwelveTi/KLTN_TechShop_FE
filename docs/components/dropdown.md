# Dropdown

Shared conventions, tokens, and the universal 8-state model live in [`README.md`](./README.md); this file states only Dropdown specifics. "Dropdown" covers the anchored **menu** (actions) and **listbox/select** (choices) popover; the searchable variant is [`SearchBar`](./search-bar.md).

# Purpose

Reveal a compact set of actions or options **anchored to a trigger**, on demand, without spending permanent screen space. It keeps dense UIs (headers, table rows, toolbars, filters) calm by hiding secondary choices until asked for.

# Responsibilities

- Anchor a floating panel to its trigger, above other content, and dismiss cleanly.
- Provide keyboard-navigable items (menu semantics for actions, listbox for choices).
- Own open/close + focus management; it does **not** own what the items do (reusable across contexts).

# Anatomy

`Trigger (Button/IconButton/field) → Panel[ optional label · items · optional separators/groups ]`
- **Trigger:** a Button/IconButton or a field-like control; exposes expanded state.
- **Panel:** `--color-surface-raised`, `--radius-md`, `--elevation-2`, at `--z-dropdown`; anchored (flips to stay in viewport).
- **Items:** action items (label + optional icon + optional shortcut hint) or option items (label + selected check); optional group labels and hairline separators.

# Variants

| Variant | Semantics | Use |
|---|---|---|
| `menu` | actions (`menu`/`menuitem`) | Row actions, account menu, "＋ Filter" |
| `select` | single choice (`listbox`/`option`) | Sort control, status pickers |
| `multiSelect` | multiple choices (checkable options) | Column visibility, multi-value filters |
| `popover` | arbitrary content panel | Filter builder, small forms |

# Props / Configuration

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | enum(menu, select, multiSelect, popover) | menu | Sets semantics |
| `trigger` | content | — | The anchor control |
| `items` | list | — | `{ id, label, icon?, shortcut?, disabled?, danger?, selected? }` |
| `value` / `onSelect` | any/event | — | For select/multiSelect |
| `placement` | enum(bottom-start, bottom-end, top-start, …) | bottom-start | Auto-flips to stay on screen |
| `closeOnSelect` | boolean | true (menu/select) / false (multiSelect) | — |
| `label` | text | — | Panel/group heading |

# Sizes

Panel min-width matches or exceeds the trigger; item height ~36–40px (comfortable, ≥44px effective touch target with padding). Max-height caps with internal scroll for long lists; text `--text-body-sm`.

# States

- **Default** — closed; trigger shows collapsed state.
- **Hover** — item background shift (`--color-surface-sunken`); trigger hover per Button.
- **Focus** — instant ring on the trigger; **active item** highlighted via `aria-activedescendant` or roving focus (no lag).
- **Active** — item press feedback; selected options show a check (select/multiSelect).
- **Disabled** — disabled items are skipped by keyboard and visibly muted; a disabled trigger doesn't open.
- **Loading** — async option lists show an in-panel loading row (keep any prior items visible; no flicker to empty).
- **Empty** — "No options" (select) / "No actions available" (rare) in the panel.
- **Error** — async load failure shows a small inline retry row in the panel (never a toast under an open menu the user is reading).

# Accessibility

`menu` uses `menu`/`menuitem` + `aria-haspopup`+`aria-expanded` on the trigger; `select`/`multiSelect` use `listbox`/`option` with `aria-selected` and `aria-activedescendant`. `danger` items convey intent by text+icon, not colour alone. Panel is dismissible and background is not trapped (it's a menu, not a modal) but Esc returns focus to the trigger.

# Keyboard Behavior

`Enter`/`Space`/`ArrowDown` on the trigger opens and focuses the first (or selected) item. `Arrow↑/↓` move; `Home`/`End` jump; type-ahead matches item labels; `Enter`/`Space` activate/select; `Esc` closes and returns focus to the trigger; `Tab` closes the menu and moves on. multiSelect keeps the panel open on toggle.

# Responsive Rules

On small screens, a `menu`/`select` with many items may present as a **bottom sheet** (larger tap targets, avoids a cramped floating panel) — e.g., the mobile Sort control in catalog/search. Panels never cause horizontal page scroll; they flip/shift to stay in the viewport.

# Motion

Quick fade (+ small `transform`) open at `--dur-fast` `--ease-out`; close reverses. Item highlight is **instant** (keyboard highlight must not lag). No per-item stagger. Reduced-motion → instant. (README banned tells apply.)

# Design Rules

- Keep menus **short**; group with separators; put destructive items last and mark them `danger`.
- A Dropdown is not a navigation router and not a Modal — no focus trap, no page blocking.
- Selected state in `select`/`multiSelect` is always visible (a check), not implied by highlight.
- Reuse the same Dropdown for account menu, row actions, filters, sort — behaviour is identical everywhere (reusability).

# Do's

- Do anchor to the trigger and auto-flip near edges.
- Do keep prior items visible while async options load.
- Do close on outside click and return focus on Esc.

# Don'ts

- Don't hide critical/primary actions behind a menu.
- Don't use a Dropdown where a few visible options (segmented control/radios) read better.
- Don't trap focus (it's not a modal).
- Don't show an error toast beneath an open menu the user is actively reading.

# Usage Examples

- **Account menu** in the [`Navbar`](./navbar.md) (My profile / Orders / Admin / Sign out).
- **Row actions** (`menu`) and **column visibility** (`multiSelect`) in the admin [`Table`](./table.md).
- **Sort** (`select`) and **"＋ Filter"** (`popover`) in [`../pages/catalog.md`](../pages/catalog.md); mobile Sort as a bottom sheet.

# Future Extensions

- **Nested submenus** for grouped admin actions.
- **Command-palette** popover (⌘K) built on the same primitive.
- **Async-search select** — merges Dropdown + SearchBar for large option sets.
