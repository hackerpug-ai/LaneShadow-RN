---
title: "LaneShadow Logo Design Specification"
date: "2026-05-09"
stability: APPROVED
authority: "load-bearing — overrides ad-hoc design decisions in implementation"
companion_doc: ".spec/brand/PHILOSOPHY.md"
holocron_id: "js75jses5nx4bh7pmdqwnw0mw986d6f2"
status: "ready for implementation"
---

# LaneShadow Logo Design Specification

> **Read [`PHILOSOPHY.md`](./PHILOSOPHY.md) first.** This spec is the concrete instantiation of that philosophy. Every decision below traces back to one of the eight pillars or the rejected-tradition list there.

## 1. The Locked Direction

After rejecting an abstract "two-stroke daemon" approach for being too inscrutable to a cold viewer, the brand committed to a concrete, immediately-legible image:

| Layer | Decision |
|---|---|
| **Emotion** | **Escape** — *"Get out. The bike is the only honest answer the week ever gave you."* |
| **Visual archetype** | **The Setting Sun** — copper sun on the horizon with road wedge in classical one-point perspective, rising toward it |
| **Format system** | **Three-tier identity** — Favicon (Bauhaus icon) → Medallion (primary) → Heritage Badge (lockup) |
| **Medallion contents** | Sun, horizon, rolling hills silhouette, road wedge — **no rider in the medallion** (the rider is the viewer; rider may appear in marketing artwork outside the official identity) |
| **Color narrative** | Copper has a job — it IS the sun. This is what makes the brand color load-bearing rather than decorative. |
| **Voice** | WPA park-poster meets 1960s field-guide. Patient, restrained, instantly legible to a non-rider as "this is for people who ride." |

## 2. The Three-Tier System

The same scene at three resolutions of complexity. Each tier is a real artifact, not a thumbnail of the next.

### Tier 1 — Favicon (Pure Icon)

**Use range:** 16–48px (browser favicon, app icon at small sizes, pills/chips in dense UI)

**Composition:** sun + horizon line + road wedge — only. Three primary forms, Bauhaus economy.

**ViewBox:** `0 0 512 512` (rendered down to 16/32/48px)

**Geometry (canonical positions, viewBox-relative):**
- **Background:** full-viewBox rect, fill `#FDFBF8`
- **Horizon line:** from `(40, 320)` to `(472, 320)`, stroke `#1F1A14`, stroke-width `6`. Slight hand-drawn wobble: render as a cubic Bezier with 1–2px deviation between waypoints.
- **Sun:** `cx=256, cy=288, r=75`, fill `#D9742A`. Positioned so 75% sits above the horizon line, 25% intersects it ("almost set, magic hour"). The sun overlaps the horizon line — it does not float.
- **Road wedge:** filled path in `#1F1A14`, classical one-point perspective with very gentle curve.
  - Foreground edge spans `x=160` to `x=352` at `y=512` (bottom of viewBox).
  - Tapers up to convergence point at `(256, 320)` on the horizon.
  - Use Q-bezier curves for the road edges so the lines bow slightly inward — just enough to suggest "winding" without being a literal serpentine.
  - Slight ink-trap (a small triangular bulge) at the convergence point where road meets horizon.

**Hand-quality rules:**
- The horizon line has 1–2px wobble. Not perfectly straight.
- The sun is geometrically circular. Perfection is correct here — it IS the sun.
- The road wedge edges show subtle weight asymmetry — the right edge slightly heavier than the left (1–2px), the way an inked stroke pools unevenly.

### Tier 2 — Medallion (Primary)

**Use range:** 48–1024px (iOS/Android app icon, splash screen, in-app brand mark, marketing OG images, social avatars). **This is the default "the logo."**

**Composition:** Tier 1 + a rolling-hills silhouette behind/below the sun.

**ViewBox:** `0 0 512 512`

**Additions to Tier 1:**
- **Distant hills:** filled path in `#1F1A14`, opacity `0.88` (slightly less black than the road — suggests atmospheric haze).
  - Hills span `x=40` to `x=472`, sitting on the horizon line at `y=320`, with a rolling profile rising 35–55px above the horizon.
  - 4–6 gentle peaks, irregularly spaced and varied in height — never symmetrical, never matching.
  - The sun's lower portion overlaps the hills (correct physically — the sun sets behind the hills).
- **Slight road curve:** the road wedge edges are slightly more pronounced Q-bezier curves than in Tier 1 — more "winding road through hills" than "flat highway." Same convergence point.

**Hand-quality rules:**
- Hill silhouette is hand-drawn — slight wobble in each peak, no two peaks the same shape.
- Imperfection more pronounced than in Tier 1: ink-trap at convergence, slight irregularity in horizon line, hills have minor "wandering" between bezier waypoints.

### Tier 3 — Heritage Badge (Lockup)

**Use range:** 1024px+ contexts — marketing posters, App Store store-listing hero, t-shirts, stickers, eventual merchandise, business cards, the about page, official document headers. **Never used at favicon size.**

**Composition:** Tier 2 medallion (scaled down) wrapped inside a double-ring seal, with arc-text wordmark and tagline.

**ViewBox:** `0 0 1024 1024`

**Geometry:**
- **Outer ring:** circle `cx=512, cy=512, r=480`, stroke `#1F1A14`, stroke-width `12`, fill none
- **Inner ring:** circle `cx=512, cy=512, r=440`, stroke `#1F1A14`, stroke-width `4`, fill none. The space between rings (40px) holds the arc-text.
- **Top arc text — wordmark:** `LANESHADOW` set in editorial transitional serif (Tiempos / Source Serif / Caslon — final pick TBD in implementation; Georgia is the safe fallback). Font-size `~64px`, letter-spacing `+180`, all-caps. Centered on the top arc, baseline-aligned.
- **Bottom arc text — tagline:** `★ RIDE THE MOMENT ★` in same font family, smaller cap height (~40px), letter-spacing `+220`. Centered on the bottom arc. The two stars flank the phrase — they're tiny six-pointed stars, NOT five-pointed (six is cartographer's vocabulary, five is American flag).
- **Inner medallion (Tier 2 scene):** scaled to fit inside the inner ring with ~80px breathing room. The scene's horizon sits at the badge's vertical center.

**Hand-quality rules:**
- Outer ring has very subtle wobble — like a hand-stamped seal, not a CAD circle. Maximum 2–3px deviation.
- Type letterforms remain crisp (don't wobble characters individually — the type is set, not drawn).
- Inner medallion follows Tier 2 hand-quality rules.

## 3. Color Discipline

| Token | Hex | Role | Usage |
|---|---|---|---|
| **Paper** | `#FDFBF8` | Substrate / background | Full-viewBox background rect; the warm ivory that everything else sits on |
| **Ink** | `#1F1A14` | All line work | Horizon, hills, road, badge rings, type. **Never pure black** — pure black breaks the warm-paper register. |
| **Copper** | `#D9742A` | The sun, only | Used for the sun in all tiers. **Never used for any other element.** Copper has a single, narrative job — it IS the sun, the magic hour, the destination. |

**Hard prohibitions** (auto-fail any rendering that includes these):
- ❌ No gradients (linear, radial, mesh, conic — none)
- ❌ No glows, drop-shadows, or `<filter>` effects (except a single optional `<feTurbulence>` paper-grain on the background, opacity ≤ 0.04)
- ❌ No purple, no neon
- ❌ No 3D rendering, no bevels, no chrome

## 4. Variant Matrix

Three color modes × three tiers = nine canonical SVG files.

| | Light (default) | Dark mode | One-color knockout |
|---|---|---|---|
| **Tier 1 — Favicon** | Copper sun + ink lines on paper | Same composition with paper/ink inverted (cream marks on deep-ink background); sun stays copper | Pure ink only — sun becomes ink-filled disc, no copper |
| **Tier 2 — Medallion** | Copper sun + ink hills/road on paper | Inverted — cream lines on ink background; sun stays copper | Pure ink only |
| **Tier 3 — Badge** | Copper sun + ink rings/type/scene on paper | Inverted | Pure ink only |

**Output file paths** (under `/logos/v2/concepts/`):

```
tier-1-favicon.light.svg
tier-1-favicon.dark.svg
tier-1-favicon.mono.svg
tier-2-medallion.light.svg
tier-2-medallion.dark.svg
tier-2-medallion.mono.svg
tier-3-badge.light.svg
tier-3-badge.dark.svg
tier-3-badge.mono.svg
```

## 5. Hand-Quality Rules (universal)

These apply to every artifact, every tier, every variant. Without them the marks will read as machine-clean and lose the "field-journal hand" register.

1. **Slight line wobble** — horizon lines, hill silhouettes, badge rings: introduce 1–3px deviation between waypoints, the way a hand draws an "approximately straight" line.
2. **Ink-trap at convergence** — where the road meets the horizon, render a small triangular ink-bulge (the way a nib pools at a junction).
3. **Weight asymmetry** — never make both edges of the road wedge identical. The right edge ~1–2px heavier than the left.
4. **Hill irregularity** — no two peaks the same shape. Hand-irregular spacing.
5. **The sun is the exception** — it stays geometrically circular. The sun is THE SUN; perfection here reads as correct, not sterile.
6. **Optional paper grain** — Tier 2 and Tier 3 may use a single `<feTurbulence baseFrequency="0.9" />` filter applied to the background rect at opacity ≤ 0.04 for subtle fiber. Tier 1 is too small for this — leave it clean.

## 6. SVG Engineering Conventions

(Harmonized with the global `logo-designer` skill conventions.)

- `viewBox` only — no fixed `width`/`height` attributes
- Self-contained — no external fonts, images, or `<use>` references to other files. Type uses Georgia/serif fallback in the SVG; production may substitute Tiempos/Caslon at export time.
- Logical groups with descriptive ids: `id="background"`, `id="hills"`, `id="sun"`, `id="horizon"`, `id="road"`, `id="badge-rings"`, `id="wordmark"`, `id="tagline"`
- Solid fills by default. The only exception is the optional paper-grain filter described above.
- Use `<path>` (filled) for the road wedge — not strokes — so weight modulation is possible.
- Hills are a single filled `<path>` with `opacity="0.88"` — not a separate fill color.
- All numerical wobble must be deterministic (committed coordinate values), not random — so the SVG is reproducible across regenerations.

## 7. The Eight-Question Test (Quality Gate)

Every produced artifact must pass these. Implementation should self-evaluate before delivery.

1. Could this artifact sit comfortably in a 1962 Sierra Club field guide?
2. Would Imhof, Sibley, or Buchanan-Smith feel kinship with the hand that made it?
3. Does it look like it was *drawn* (not generated, not laid out)?
4. Does the sun read as "the destination, the magic hour" rather than "a decorative dot"?
5. Does it pass the slap-on test (Sagi Haviv): can you imagine it embroidered, embossed, neon, 16px?
6. Is it *opinionated* — does it hold a position, or is it ambient?
7. Does it earn its imperfections by competence elsewhere?
8. Is it the romantic AND the classical, or only one?

## 8. What's Explicitly NOT in This Spec

The discipline is what we leave out. None of the following appear in any tier or variant:

- ❌ Motorcycles, helmets, wheels, engines, exhaust pipes (no hardware)
- ❌ Human figures in the medallion (no rider — rider is the viewer)
- ❌ Compass roses, NSEW, cardinal arrows
- ❌ Pin-drop / map-marker icons
- ❌ Mountain triangles, single peaks (rolling hills only)
- ❌ Letterforms in the medallion (type only on the badge tier)
- ❌ "EST. 2026" / "SINCE 20XX" heritage-kitsch flourishes
- ❌ Skulls, flames, eagles, gothic scripts (motorcycle-macho cliches)
- ❌ Anything from the rejected-tradition list in `PHILOSOPHY.md`

## 9. Implementation Plan

When this spec is approved, implementation proceeds via the `logo-designer` skill in three rounds.

### Round 1 — Tier 2 medallion variants (light)

Generate **3 variant interpretations** of the Tier 2 light medallion in parallel, each within the spec's constraints but exploring micro-decisions:
- Variant A: hills wider, road steeper
- Variant B: hills lower-profile, road gentler curve
- Variant C: sun slightly larger, hills more peaky

User selects favored variant. This becomes the canonical medallion.

### Round 2 — Tier expansion

From the chosen Tier 2 medallion:
- **Down:** simplify into Tier 1 (drop hills) — produces light, dark, mono favicon variants
- **Up:** wrap in Tier 3 badge (add rings, arc-text, scale medallion) — produces light, dark, mono badge variants
- Sideways for Tier 2: produce dark and mono variants of the chosen medallion

Output: 9 canonical SVG files at the paths listed in §4.

### Round 3 — Production polish

User-driven iteration on details: line weight tuning, hill shape refinement, ink-trap calibration, type kerning on the badge. Final files committed to repo at `/logos/v2/`.

### Round 4 — Export & integration

Export all variants to standard PNG sizes (16, 32, 48, 192, 512, 1024, 2048) using the `logo-designer` skill's bundled export script. Replace iOS `AppIcon.appiconset` and Android `ic_launcher` assets when the user approves the v2 system as production-ready.

## 10. Open Questions for Implementation

These remain unresolved at spec time and will be decided during round 1:

1. **Type face for the badge wordmark.** Spec says "editorial transitional serif"; final pick is Tiempos vs Source Serif vs Caslon vs a USGS-quad revival. Decide based on legibility at the badge size and visual harmony with the medallion's hand-drawn quality.
2. **Paper grain on/off.** The optional `<feTurbulence>` paper texture: does it survive export to PNG cleanly, or does it produce moiré? Test in round 1; default to OFF if questionable.
3. **The six-pointed-star detail in tagline.** Verify this reads as "cartographer's compass-point" at badge size and not as some other symbol. Fall back to a simple bullet `·` if star is ambiguous.
4. **Dark-mode sun treatment.** Does copper-on-deep-ink read as "magic hour" or as "warning indicator"? Test in round 1; if the latter, consider a slightly desaturated copper for dark mode only.

## 11. Provenance

- Brainstorming session: 2026-05-09, conducted via `/superpowers:brainstorming` with visual companion (4 visual screens, 4 user decisions)
- Decision sequence:
  1. Emotional anchor: ESCAPE (over Discovery, Mastery, Belonging)
  2. Visual archetype: SETTING SUN (over Vanishing Road, Tiny Rider in Big Country)
  3. Format system: TIERED (Favicon → Medallion → Badge)
  4. Medallion contents: NO RIDER (rider is the viewer)
- Brand foundation: `.spec/brand/PHILOSOPHY.md` (load-bearing manifesto)
- Holocron research: AI logo systems landscape (`js705ap3114awn7xzn6m6h4bp586cs8q`)
- Companion HTML mockups: `.superpowers/brainstorm/20824-1778370829/content/01-emotional-anchor.html` through `05-system-final.html`
