# Footer

Shared conventions, tokens, and the universal 8-state model live in [`README.md`](./README.md); this file states only Footer specifics.

# Purpose

**Close the page** with a calm, considered end — identity, a few genuinely-useful links, trust/payment marks, and legal. The Footer signals "the page ends here" and provides secondary wayfinding without competing for attention.

# Responsibilities

- Provide a consistent page close and low-emphasis secondary navigation.
- Carry trust signals (payment/security marks) and legal/copyright.
- Link only to destinations that **actually exist** — the Footer catalogues the real site, not an aspirational sitemap.

# Anatomy

`Top hairline → [ brand + tagline · link groups · payment/trust marks ] → copyright line`
- **Brand mast:** wordmark + one-line tagline.
- **Link groups:** a small number of columns for real destinations (Shop · Support · Company).
- **Trust marks:** payment icons + a "secure" cue (single icon set).
- **Copyright:** quiet bottom line.

# Variants

| Variant | Use |
|---|---|
| `full` | Storefront pages — mast + a few link groups + payment/trust + copyright |
| `inline` | Single-row close (brand · few links · copyright) for lean pages |
| `focused` | Auth/checkout — minimal (secure + policy links only), matching the focused Navbar |

**Not offered:** the AI "4 columns (Product/Company/Resources/Legal) + social row + tiny copyright" template — banned (Hallmark). Groups reflect real destinations only.

# Props / Configuration

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | enum(full, inline, focused) | full | — |
| `linkGroups` | list | — | `{ heading, links[] }` — real routes only |
| `showPaymentMarks` | boolean | true (full) | Payment/security icons |
| `tagline` | text | — | One line beside the brand |
| `copyright` | text | — | Auto-year + entity |

# Sizes

Generous top padding (`--space-16`) to separate it from content and signal the end; `--color-surface` over a hairline `--color-border` top; text `--text-body-sm`, links `--color-muted` → `--color-text` on hover. Low visual weight overall.

# States

- **Default** — resting; links at rest.
- **Hover** — link colour shifts muted→text (one signal).
- **Focus** — instant focus ring on links/controls.
- **Active** — link press feedback.
- **Disabled** — n/a (links either exist or aren't shown).
- **Loading** — n/a (static content; no data fetch).
- **Empty** — if a link group would be empty, it's omitted entirely rather than shown blank.
- **Error** — n/a.

# Accessibility

`contentinfo` landmark; link groups are `nav`s with accessible names (e.g., "Footer — Support"). Payment-mark icons have text alternatives or sit beside labels; decorative marks are `aria-hidden`. Real links only; visible instant focus rings; sufficient contrast for muted link text in both themes.

# Keyboard Behavior

Standard link tabbing in reading order. No special keys. (A newsletter field, if present, follows [`Input`](./input.md) behaviour.)

# Responsive Rules

Link groups sit in a row on desktop, stack to fewer columns on `md`, and collapse to a single stacked column on mobile. Payment marks wrap. The `inline` variant stays a single wrapping row. No horizontal scroll. Targets ≥44px.

# Motion

Essentially none — link hover colour shift only. No reveal animations, no marquee. Reduced-motion → unaffected (there's nothing to reduce). Calm by design.

# Design Rules

- **Close the page, don't catalogue an absent sitemap** — only real link groups (Shop/Support/Company as they exist).
- Reject the AI 4-column + social-row + tiny-copyright template.
- Low emphasis: muted text, hairline top, generous top padding.
- Match the **focused** variant to the focused [`Navbar`](./navbar.md) on auth/checkout.

# Do's

- Do include payment/trust marks on storefront pages (real methods only).
- Do omit empty groups.
- Do keep it quiet and last-in-reading-order.

# Don'ts

- Don't ship the generic 4-column SaaS footer.
- Don't link to routes that don't exist yet.
- Don't let the footer compete with page content for attention.
- Don't invent stats/social links to fill space.

# Usage Examples

- **Storefront `full` footer** on [`../pages/home.md`](../pages/home.md), catalog, PDP, cart — brand + Shop/Support/Company + payment marks + copyright.
- **`focused` footer** on [`../auth/login.md`](../auth/login.md) and [`../pages/checkout.md`](../pages/checkout.md) (secure + policy links).
- Admin pages typically omit a marketing footer (the [`Sidebar`](./sidebar.md) + topbar frame the console).

# Future Extensions

- **Newsletter-first** footer variant (email capture) once the newsletter backend exists.
- **Locale/currency switcher** in the footer for internationalization.
- **Status/system indicator** link (e.g., "All systems operational") if a status page is added.
