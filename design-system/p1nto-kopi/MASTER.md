# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Pinto Kopi
**Generated:** 2026-08-15
**Category:** Food & Beverage — Premium Editorial Coffee Brand
**Direction:** Warm · Premium · Editorial · Photography-led · Minimal (PRD §25)

> **Note:** The initial `--design-system` auto-match (Liquid Glass, premium dark + gold) was
> rejected: it conflicts with the brand brief ("premium, editorial, warm, photography-led,
> minimal") and the established brand tokens. The verified direction below supersedes it.

---

## Global Rules

### Color Palette

Light mode tokens (defined in `src/app/globals.css`):

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Ink (foreground/primary) | `#171513` | `--color-ink`, `--color-primary` |
| Paper (background) | `#F7F5F0` | `--color-paper`, `--color-background` |
| White (cards) | `#FFFFFF` | `--color-card` |
| Muted text | `#6E6A63` | `--color-muted-foreground` (≈4.94:1 on paper) |
| Border | `#E5E1DA` | `--color-border` |
| Coffee (primary accent) | `#8B5E3C` | `--color-coffee` |
| Cream | `#EAD9C5` | `--color-cream`, `--color-secondary` |
| Warm (CTA/accent) | `#C89B6D` | `--color-warm`, `--color-accent` |
| Destructive | `#C94C4C` | `--color-destructive` |

Dark sections use `bg-ink text-paper`; secondary text on ink uses `text-paper/60–70` or `text-cream/60` (never `--muted-text`, which fails contrast on ink).

**Rules**
- Text on paper: ≥ 4.5:1 (ink, coffee, muted `#6E6A63` pass).
- Text on ink: use paper/cream at 60–100% opacity (passes 4.5:1).
- Background texture/image overlays: keep `opacity-10`–`20` so foreground text stays readable.
- No emojis as icons — use Lucide / inline SVG.

### Typography

- **Display / Headings:** Cormorant Garamond (`--font-display`) — elegant editorial serif, weight 400–700, italic available.
- **Body / UI:** Plus Jakarta Sans (`--font-sans`).
- Loaded via `next/font/google` (zero layout shift, self-hosted).
- Scale: eyebrow labels 10–12px uppercase tracked `0.15–0.2em`; display headlines 3xl–8xl tight leading; body 16px+ line-height 1.5.

### Spacing & Density

- Density: Spacious (editorial rhythm): sections `py-24 md:py-32`, generous `gap-8`+.
- Consistent `container mx-auto px-4 md:px-8`.

### Radius & Effects

- `rounded-sm` on imagery (editorial, near-square corners); `rounded-full` on buttons/pills.
- Restrained warm-tinted shadows (`--shadow-card/raised/popover`).
- Hover: smooth transitions 150–300ms; image zoom `duration-1000`.

---

## Component Specs

### Buttons
- Primary CTA (light bg): `bg-ink text-paper rounded-full hover:bg-ink/90`.
- Primary CTA (dark bg): `bg-warm text-ink rounded-full hover:bg-cream`.
- Secondary: outline `border-ink text-ink hover:bg-ink hover:text-paper` (light) / `border-paper/20 text-cream` (dark).
- Min height `h-12–h-16` (44px+ touch target).
- All clickable elements `cursor-pointer` (global rule in `globals.css`).
- Visible `focus-visible` outline on all interactive elements.

### Cards
- Border, `rounded-sm`, image ratio `aspect-[3/4]` or `aspect-square`, image hover `scale-105/110` with `duration-1000`.

### Interactive "add" controls
- Never render a dead affordance. A plus/add control must navigate or perform a real action, with an `aria-label`, and a ≥ 44×44px target.

---

## Page Pattern (Homepage)

**Pattern:** Editorial Storytelling Landing

1. Hero — headline thesis + photo, 2 CTAs (Beli Kopi / Kunjungi Pinto), EST tag.
2. Brand values (4 columns, Lucide icons).
3. Signature menu (4-item grid).
4. Roastery (dark band, bean cards).
5. Find-your-coffee interactive filter.
6. Bean-to-cup numbered process (01–04).
7. Brand story split.
8. Pinto space gallery (asymmetric).
9. Take-home beans (3 products).
10. Location + hours.
11. Testimonials.
12. Final CTA (dark, full-bleed).

---

## Motion

- **Hero load:** GSAP stagger fade-up `0.8s` `power3.out` stagger `0.12`, photo scale-in `1.2s`; run under `matchMedia('(prefers-reduced-motion: no-preference)')`.
- **Scroll reveal:** framer-motion `whileInView`, `once`, margin `-10%`, duration `0.8`; respects `useReducedMotion` (render final state instantly).
- **Exit/fast:** keep UI transitions light; no long-scroll choreography on content.

---

## Anti-Patterns (Do NOT Use)

- ❌ Emojis as icons — use SVG (Lucide).
- ❌ Dead buttons / non-functional affordances.
- ❌ `--muted-text` on ink backgrounds (fails 4.5:1).
- ❌ Plain `<img>` tags — always `next/image` with `sizes`.
- ❌ `opacity-0` reveal content without a reduced-motion/JS fallback.
- ❌ Touch targets < 44px for primary actions.
- ❌ Missing `cursor-pointer` on clickable elements.
- ❌ Ignoring `prefers-reduced-motion`.

---

## Pre-Delivery Checklist

- [ ] No emojis used as icons (use SVG instead)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150–300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
- [ ] `next/image` + `sizes` for all imagery; `priority` on LCP image
- [ ] `lang="id"` on `<html>`