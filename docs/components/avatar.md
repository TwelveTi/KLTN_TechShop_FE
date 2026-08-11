# Avatar

Shared conventions, tokens, and the universal 8-state model live in [`README.md`](./README.md); this file states only Avatar specifics.

# Purpose

Represent a person or entity with an image, falling back gracefully to initials. Avatars give quick, humane recognition in the header, profile, customer list, and (future) reviews/comments.

# Responsibilities

- Show a user's photo when available; otherwise a legible **initials** fallback derived from the name.
- Stay purely representational — an Avatar is not itself a button (wrap it in a Button/Dropdown trigger when it must be interactive). This keeps it reusable in both static and interactive contexts.

# Anatomy

`[ image | initials ]` in a circular frame, with an optional status/presence dot or a stacked-group container.
- **Image:** cover-fit within a `--radius-full` frame.
- **Initials fallback:** 1–2 uppercase letters on a tinted surface (derived deterministically from the name so a user's colour is stable).
- Optional **status dot** (online/verified) or **group stack** (overlapping avatars + a `+N` [`Badge`](./badge.md)).

# Variants

| Variant | Use |
|---|---|
| `image` | Photo available |
| `initials` | No image (fallback) |
| `icon` | Generic entity/placeholder (neutral glyph) |
| `group` | Overlapping stack with `+N` overflow |

# Props / Configuration

| Prop | Type | Default | Notes |
|---|---|---|---|
| `src` | text (url) | — | Image; falls back to initials on missing/error |
| `name` | text | — | Drives initials + accessible name |
| `size` | enum(xs, sm, md, lg, xl) | md | See Sizes |
| `shape` | enum(circle, rounded) | circle | Circle default; rounded for entities/brands |
| `status` | enum(none, online, verified) | none | Optional dot |
| `group` | list | — | For `group` variant (+`max` before overflow) |

# Sizes

| Size | Diameter | Use |
|---|---|---|
| `xs` | 20px | Inline in dense lists/table cells |
| `sm` | 28px | Menus, comments |
| `md` | 36–40px | Header, list rows (default) |
| `lg` | 56px | Profile summary |
| `xl` | 96px | Profile header / account page |

Initials scale with size (`--weight-semibold`); the status dot scales proportionally.

# States

- **Default** — image or initials.
- **Hover / Focus / Active** — **n/a to the Avatar itself**; when used as an interactive trigger, the *wrapping* control (Button/Dropdown) owns these states and the focus ring — the Avatar never draws its own.
- **Disabled** — n/a.
- **Loading** — while the image loads, show the initials fallback (or a subtle skeleton), never a broken-image icon; swap to the image on load.
- **Empty** — no `name` and no `src` → the neutral `icon` variant (generic placeholder), never blank.
- **Error** — image load failure → fall back to initials/`icon` silently (no error UI for a decorative element).

# Accessibility

If the Avatar stands alone as meaningful content, it has an accessible name (the person's name) — image `alt` = name, or `aria-label` on the initials. When it's inside a labelled control (e.g., the account [`Dropdown`](./dropdown.md) trigger), the Avatar image is **decorative** (`alt=""`) and the control provides the name — avoids double-announcement. Initials are text, not baked into an image. The status dot has an accessible label ("Verified") or the meaning sits in adjacent text.

# Keyboard Behavior

None for a static Avatar. As a trigger, keyboard behaviour belongs to the wrapping Button/Dropdown.

# Responsive Rules

Fixed diameter per size (doesn't fluidly resize); pick the size per context. In `group`, cap the visible count and show `+N` on small screens to avoid overflow. Never stretches non-square images (cover-fit + centre).

# Motion

None by default. An optional gentle fade when the image finishes loading (image over initials), `--dur-fast`. No hover animation on the Avatar itself. Reduced-motion → instant swap.

# Design Rules

- **Always have a fallback** — initials (from `name`) or the neutral `icon`; never a broken image, never blank.
- Initials colour is **deterministic** from the name (stable identity), drawn from a tinted-neutral set (not the accent).
- Circle by default; `rounded` for brand/entity logos where a circle would crop awkwardly.
- The Avatar is representational; interactivity lives on a wrapper.

# Do's

- Do render initials while the image loads and if it fails.
- Do keep the image decorative when the control already names the user.
- Do cap `group` overflow with a `+N` badge.

# Don'ts

- Don't attach click handlers directly to the Avatar — wrap it.
- Don't distort non-square images.
- Don't show a broken-image glyph — fall back.
- Don't use the accent hue for initials backgrounds.

# Usage Examples

- **Account control** in the [`Navbar`](./navbar.md) (Avatar as the [`Dropdown`](./dropdown.md) trigger; image decorative).
- **Profile summary/header** (lg/xl) in [`../pages/profile.md`](../pages/profile.md), with upload replacing the initials.
- **Customer list** rows (xs/sm) in [`../admin/customers.md`](../admin/customers.md).

# Future Extensions

- **Presence/typing indicators** for a future support chat.
- **Editable avatar** (hover-to-change) wrapper for the profile upload.
- **Entity avatars** (brand logos) via the `rounded` shape once brand logos ship.
