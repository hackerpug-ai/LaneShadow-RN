# Curated Route Chat Card Spec

**Task:** DESIGN-S01-002
**Sprint:** sprint-01
**Status:** Draft

## 1. Score Rendering Contract

### Formula (REQUIRED)
```typescript
Math.round(score * 100) + '%'
```

**Where:**
- `score` is a 0–1 float from `useCuratedDiscovery` / agent curated-discovery tool
- Example: score=0.73 → '73%'

### Composite Display
- **Typography:** `semantic.type.title.lg` (fontSize 17pt, fontWeight 600, lineHeight 21pt)
- **Color:** `semantic.color.primary.default` (#EE7C2B copper-500)
- **Authority:** 10-design-system.md §2

### ScoreDimensionBar Rendering

Each dimension score rendered as a `ScoreDimensionBar` (per 10-design-system.md §2):

| Property | Token Path | Resolved (Light) | Resolved (Dark) |
|----------|------------|------------------|-----------------|
| Track Background | `semantic.color.surface.inset` | #F2EFED | #362A1F |
| Fill Color | `semantic.color.primary.default` | #EE7C2B | #EE7C2B |
| Height | `semantic.space.xs * 2` | 8dp | 8dp |
| Value Label Typography | `semantic.type.label.sm` | fontSize 9, fontWeight 600 | fontSize 9, fontWeight 600 |
| Value Label Font | — | JetBrains Mono (instrument font) | JetBrains Mono (instrument font) |
| Value Format | `Math.round(score*100)+'%'` | Same as composite | Same as composite |

### Forbidden Displays (BUGS)
- ❌ Raw 0–1 float (e.g. '0.73')
- ❌ Raw 0–100 integer (e.g. '73')
- ❌ '0%' when score is non-zero (score-field mapping bug — see DATA-008b)

**Rule:** Scores arrive on the 0–1 scale from `useCuratedDiscovery` and must be carried through unmodified to the rendering formula — NO rescaling in hook or store.

## 2. Layout Spec for `curated` Variant

### Row 1: Route Name
- **Typography:** `semantic.type.title.lg` (fontSize 17pt, fontWeight 600, lineHeight 21pt)
- **Color:** `semantic.color.onSurface.default` (#1E1A16 light / #F2EEE8 dark)
- **Note:** Do NOT show `{startLabel} → {endLabel}` format — show route name only

### Row 2: Mileage + Archetype Badge
- **Layout:** `flexDirection: row, gap: semantic.space.sm`
- **Mileage Format:** `${Math.round(distanceMi)}mi`
- **Archetype Badge:** Existing `Badge` component, variant='secondary'
- **Mileage Typography:** `semantic.type.body.md` (fontSize 12pt, lineHeight 18pt, fontWeight 400)
- **Badge Typography:** As defined in Badge component

### Row 3: Composite Score
- **Display:** Prominent percentage using `Math.round(compositeScore*100)+'%'`
- **Typography:** `semantic.type.title.lg` (fontSize 17pt, fontWeight 600)
- **Color:** `semantic.color.primary.default` (#EE7C2B)
- **Optional Follow-up:** 2–3 dimension score bars (curvature, scenic, technical) using `ScoreDimensionBar`
  - Curvature score bar
  - Scenic score bar
  - Technical score bar

### Card Background & Container
| Property | Token Path | Resolved (Light) | Resolved (Dark) |
|----------|------------|------------------|-----------------|
| Background | `semantic.color.surfaceVariant.default` | #FDFBF8 | #2D2218 |
| Border Radius | `semantic.radius.md` | 10pt | 10pt |
| Padding Horizontal | `semantic.space.md` | 12pt | 12pt |
| Padding Vertical | `semantic.space.md` | 12pt | 12pt |
| Elevation | `semantic.elevation[2]` | shadowOpacity 0.21, shadowRadius 6, elevation 2 | shadowOpacity 0.21, shadowRadius 6, elevation 2 |

### Touch Target
- **Requirement:** Full card is tappable
- **Minimum Height:** `semantic.control.minTouchTarget` (44pt)
- **Implementation:** Achieve via natural content height OR explicit `minHeight` prop

### TestID
- **Value:** `testID='route-attachment-card'` (reuse existing testID per 07-ui-infrastructure.md §6)
- **Status:** ✅ Already in `route-attachment-card.tsx` line 158

## 3. Visual Differentiation Table

| Property | Planned-trip `full` variant (RouteAttachmentCard) | Curated `curated` variant |
|----------|-----------------------------------------------|---------------------------|
| Start→End labels row | **PRESENT** (lines 189-228) | **ABSENT** |
| Route name | Secondary (line 243) | Primary (Row 1) |
| Mileage display | Present in stats (line 256) | Prominent in Row 2 |
| Archetype badge | **ABSENT** | **PRESENT** (Row 2) |
| Composite score | **ABSENT** | **PRESENT** (Row 3) |
| Score bars (curvature/scenic/technical) | **ABSENT** | **PRESENT** (optional) |
| Background token | `surfaceVariant.default` | `surfaceVariant.default` |
| Border radius | `radius.md` | `radius.md` |
| Elevation | `elevation[2]` | `elevation[2]` |

**Key Differentiator Summary:**
- Planned-trip cards: Focus on start→end navigation, distance/duration stats
- Curated cards: Focus on route identity, quality scores, and archetype classification

## 4. Prop Plan

### Recommendation (Primary)
Add `variant='curated'` to `RouteAttachmentCardProps` alongside existing `'compact' | 'full'`.

**Rationale:**
- Avoids a new component file
- Keeps the tap→map loop machinery intact
- Reuses existing card→map→tap-back infrastructure (07-ui-infrastructure.md §1)

### Alternative (Acceptable)
Create new `CuratedRouteCard` component if DISC-020 implementer determines conditional branching inside `RouteAttachmentCard` would become too complex.

### New Props if Extending RouteAttachmentCard

```typescript
type RouteAttachmentCardProps = {
  // ... existing props

  // Variant extension
  variant?: 'compact' | 'full' | 'curated'

  // Curated-specific data
  curatedRoute?: {
    name: string
    distanceMi: number
    archetype: RouteArchetype
    compositeScore: number
    curvatureScore?: number
    scenicScore?: number
    technicalScore?: number
  }
}
```

### RouteArchetype Type
```typescript
type RouteArchetype =
  | 'scenic'
  | 'technical'
  | 'fast'
  | 'mixed'
  | 'urban'
```

## 5. Token Path Table

### Typography Tokens

| Property | Token Path | Resolved (Light) | Resolved (Dark) |
|----------|------------|------------------|-----------------|
| Route name | `semantic.type.title.lg.fontSize` | 17pt | 17pt |
| Route name | `semantic.type.title.lg.lineHeight` | 21pt | 21pt |
| Route name | `semantic.type.title.lg.fontWeight` | 600 | 600 |
| Mileage | `semantic.type.body.md.fontSize` | 12pt | 12pt |
| Mileage | `semantic.type.body.md.lineHeight` | 18pt | 18pt |
| Mileage | `semantic.type.body.md.fontWeight` | 400 | 400 |
| Composite score | `semantic.type.title.lg.fontSize` | 17pt | 17pt |
| Composite score | `semantic.type.title.lg.lineHeight` | 21pt | 21pt |
| Composite score | `semantic.type.title.lg.fontWeight` | 600 | 600 |
| Score bar value | `semantic.type.label.sm.fontSize` | 9pt | 9pt |
| Score bar value | `semantic.type.label.sm.lineHeight` | 9pt | 9pt |
| Score bar value | `semantic.type.label.sm.fontWeight` | 600 | 600 |

### Color Tokens

| Property | Token Path | Resolved (Light) | Resolved (Dark) |
|----------|------------|------------------|-----------------|
| Route name text | `semantic.color.onSurface.default` | #1E1A16 | #F2EEE8 |
| Composite score | `semantic.color.primary.default` | #EE7C2B | #EE7C2B |
| Score bar track | `semantic.color.surface.inset` | #F2EFED | #362A1F |
| Score bar fill | `semantic.color.primary.default` | #EE7C2B | #EE7C2B |
| Card background | `semantic.color.surfaceVariant.default` | #FDFBF8 | #2D2218 |
| Border | `semantic.color.border.default` | #E5DED9 | rgba(242,238,232,0.12) |

### Layout Tokens

| Property | Token Path | Resolved |
|----------|------------|----------|
| Padding horizontal | `semantic.space.md` | 12pt |
| Padding vertical | `semantic.space.md` | 12pt |
| Gap between row elements | `semantic.space.sm` | 8pt |
| Border radius | `semantic.radius.md` | 10pt |
| Min touch target | `semantic.control.minTouchTarget` | 44pt |
| Score bar height | `semantic.space.xs * 2` | 8dp |

### Elevation Tokens

| Property | Token Path | Resolved |
|----------|------------|----------|
| Card elevation | `semantic.elevation[2]` | shadowOpacity 0.21, shadowRadius 6, elevation 2 |

---

**Token Authority References:**
- `tokens/semantic/semantic.tokens.json` (lines 711-724): `semantic.type.title.lg`
- `tokens/semantic/semantic.tokens.json` (lines 653-665): `semantic.type.body.md`
- `tokens/semantic/semantic.tokens.json` (lines 594-636): `semantic.type.label.sm`
- `tokens/semantic/semantic.tokens.json` (lines 137-150): `semantic.color.primary.default` (#EE7C2B)
- `tokens/semantic/semantic.tokens.json` (lines 77-82): `semantic.color.onSurface.default`
- `tokens/semantic/semantic.tokens.json` (lines 16-20): `semantic.color.surface.inset`
- `tokens/semantic/semantic.tokens.json` (lines 65-70): `semantic.color.surfaceVariant.default`
- `tokens/semantic/semantic.tokens.json` (lines 107-112): `semantic.color.border.default`
- `tokens/semantic/semantic.tokens.json` (lines 529-561): `semantic.space` (xs, sm, md)
- `tokens/semantic/semantic.tokens.json` (lines 573-575): `semantic.radius.md`
- `tokens/semantic/semantic.tokens.json` (lines 1444-1447): `semantic.control.minTouchTarget`
- `tokens/semantic/semantic.tokens.json` (lines 873-900): `semantic.elevation[2]`