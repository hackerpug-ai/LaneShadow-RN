# Curated Route Chat Card Design Specification

**Sprint:** Sprint 01 - Discovery on the Route Plan View
**Task:** DESIGN-S01-002
**Version:** 1.0
**Last Updated:** 2026-06-16

---

## 1. Score Rendering Contract

### Formula
The ONLY valid formula for rendering scores is:

```typescript
Math.round(score * 100) + '%'
```

**Where:**
- `score` is a 0–1 float from `useCuratedDiscovery` or the agent's curated-discovery tool
- The result is a string like `'73%'` for a score of 0.73

### Composite Score Display
- **Typography:** `semantic.type.title.lg` (fontSize: 17, fontWeight: 600)
- **Color:** `semantic.color.primary.default` (#EE7C2B copper)
- **Placement:** Prominently displayed on Row 3 of the card
- **Example:** Composite score of 0.73 renders as `"73%"` in large, bold copper text

### Score Dimension Bar Rendering
Each dimension score (curvature, scenic, technical) is rendered as a `ScoreDimensionBar`:

**Track:**
- Height: `semantic.space.xs × 2 = 8dp` (from `tokens/semantic/dimensions.tokens.json` spacing.3)
- Background: `semantic.color.surface.inset`
- BorderRadius: `semantic.radius.full` (9999)

**Fill:**
- Width: `${Math.round(score * 100)}%`
- Background: `semantic.color.primary.default` (#EE7C2B copper)
- Same height and border radius as track
- Positioned absolutely within the relative-positioned track

**Value Label:**
- Content: `Math.round(score * 100) + '%'` (e.g., "85%")
- Typography: `semantic.type.label.sm` (fontSize: 9, fontWeight: 600)
- Font Family: JetBrains Mono (instrument font, specified via `semantic.type.instrument.sm`)
- Color: `semantic.color.onSurface.default`
- Alignment: Right-aligned

**Dimension Label:**
- Typography: `semantic.type.label.sm`
- Color: `semantic.color.onSurface.muted`
- Min Width: 80
- Alignment: Left-aligned

**Layout:**
- `flexDirection: 'row'`
- `alignItems: 'center'`
- Gap: `semantic.space.sm` (8dp)

### Forbidden Display Formats
These are BUGS and must never appear in production:
- ❌ Raw 0–1 float (e.g., `'0.73'`)
- ❌ Raw 0–100 integer (e.g., `'73'` without percent)
- ❌ `'0%'` when score is non-zero (indicates score-field mapping bug — see DATA-008b)

### Score Data Contract
- Scores arrive on the **0–1 scale** from `useCuratedDiscovery` and the agent tool
- Scores must be carried through **unmodified** to the rendering formula
- No rescaling should happen in the hook, store, or component — formatting to % is a **render concern only**

---

## 2. Layout Specification for the `curated` Variant

### Card Container
**Background & Borders:**
- Background: `semantic.color.surfaceVariant.default` (#FDFBF8 light, #2D2218 dark)
- Border: `semantic.color.border.default` (#E5DED9 light, rgba(242,238,232,0.12) dark)
- Border Width: 1 (when not selected)
- Border Radius: `semantic.radius.md` (10dp)
- Elevation: `semantic.elevation[2]` (shadowOffset height: 2, shadowOpacity: 0.21, shadowRadius: 6)

**Padding:**
- Horizontal: `semantic.space.md` (12dp)
- Vertical: `semantic.space.md` (12dp)

**Touch Target:**
- Full card is tappable
- Minimum height: `semantic.control.minTouchTarget` (44dp)
- Achieved via natural content or explicit `minHeight` if needed

### Row 1: Route Name
**Typography:**
- Font: `semantic.type.title.lg` (fontSize: 17, lineHeight: 21, fontWeight: 600)
- Color: `semantic.color.onSurface.default` (#1E1A16 light, #F2EEE8 dark)

**Content:**
- Route name as a string (e.g., "Blue Ridge Parkway")
- **NOT** the `{startLabel} → {endLabel}` format used in the planned-trip `full` variant
- Single line with ellipsis if needed (`numberOfLines: 1`)

### Row 2: Mileage + Archetype Badge
**Layout:**
- `flexDirection: 'row'`
- `alignItems: 'center'`
- Gap: `semantic.space.sm` (8dp)

**Mileage:**
- Format: `${Math.round(distanceMi)}mi` (e.g., "45mi")
- Typography: `semantic.type.body.md` (fontSize: 12, lineHeight: 18, fontWeight: 400)
- Color: `semantic.color.onSurface.subtle`

**Archetype Badge:**
- Component: Existing `Badge` component from `components/ui/badge.tsx`
- Variant: `'secondary'`
- Content: Archetype as UI enum (twisties | scenic | technical | cruising | sport | adventure)
- Displays badge with secondary styling

### Row 3: Composite Score + Dimension Bars
**Composite Score:**
- Typography: `semantic.type.title.lg` (fontSize: 17, fontWeight: 600)
- Color: `semantic.color.primary.default` (#EE7C2B copper)
- Content: `Math.round(compositeScore * 100) + '%'` (e.g., "73%")
- Prominent display, optionally followed by dimension bars

**Dimension Bars (Optional):**
- 2–3 dimension scores rendered using `ScoreDimensionBar`:
  - Curvature score (`curvatureScore`)
  - Scenic score (`scenicScore`)
  - Technical score (`technicalScore`)
- Each bar on its own row
- Vertical gap between bars: `semantic.space.xs` (4dp)

### Mini-map Preview
- **NOT included** in the curated variant (present only in planned-trip `full` variant)
- The `route.map?.overviewGeometry?.value` and `route.map?.bounds` check applies to planned trips, not curated routes

### TestID
- TestID: `'route-attachment-card'` (reuse existing testID per 07-ui-infrastructure.md §6)
- Child components can extend this (e.g., `'route-attachment-card-composite-score'`)

---

## 3. Visual Differentiation Table

| Feature | Planned-trip `full` variant (RouteAttachmentCard) | Curated `curated` variant |
|---------|---------------------------------------------------|---------------------------|
| **Route Name Row** | Row 1 shows `{startLabel} → {endLabel}` (e.g., "Asheville → Charlotte") | Row 1 shows route name only (e.g., "Blue Ridge Parkway") — **NO start→end labels** |
| **Start→End Labels** | **PRESENT** (Row 1: arrow between two location names) | **ABSENT** — this is a planned-trip pattern, not used for curated results |
| **Route Description** | Row 2 shows route description text (line 234-244 in route-attachment-card.tsx) | **ABSENT** — curated cards don't have a separate description row |
| **Mileage Display** | Row 3: stat icon + distance (e.g., "45mi") in stats section | Row 2: mileage text + archetype badge (e.g., "45mi [Scenic]") |
| **Archetype Badge** | **ABSENT** — planned trips don't show archetype | **PRESENT** — Badge variant='secondary' showing route type |
| **Composite Score** | **ABSENT** — planned trips don't show scores | **PRESENT** — prominent `Math.round(score * 100) + '%'` in copper |
| **Dimension Score Bars** | **ABSENT** — planned trips don't show score breakdowns | **PRESENT** — optional 2–3 ScoreDimensionBar components |
| **Mini-map Preview** | **PRESENT** when route.map has overviewGeometry and bounds | **ABSENT** — curated cards don't show mini-map preview |
| **Weather Badges** | **PRESENT** (rain, wind warnings) in Row 3 stats | **ABSENT** — weather is not surfaced on curated cards |
| **Duration Stat** | **PRESENT** (clock icon + time) in Row 3 stats | **ABSENT** — curated cards don't show duration |
| **Favorites Badge** | **PRESENT** when `includeFavorites && route.favorites?.count > 0` | **ABSENT** — curated cards don't show favorites count |
| **Background** | `semantic.color.surfaceVariant.default` | Same as `full` variant: `semantic.color.surfaceVariant.default` |
| **Border Radius** | `semantic.radius.md` (10dp) | Same as `full` variant: `semantic.radius.md` |
| **Elevation** | `semantic.elevation[2]` | Same as `full` variant: `semantic.elevation[2]` |
| **Padding** | Horizontal: `semantic.space.md` (12dp), Vertical: `semantic.space.md` (12dp) | Same as `full` variant |
| **Touch Target** | Full card, minimum 44pt | Same as `full` variant |
| **testID** | `'route-attachment-card'` | Same as `full` variant: `'route-attachment-card'` |

**Key Differentiators (Summary):**
1. **No start→end labels** on curated cards — the biggest visual distinction
2. **Score rendering** present only on curated (composite % + optional bars)
3. **Archetype badge** present only on curated
4. **Route name prominence** — secondary in planned (as description), primary in curated (as headline)
5. **Mini-map, weather, duration, favorites** present only on planned-trip variant

---

## 4. Prop Plan

### Recommendation: Extend `RouteAttachmentCardProps` with `variant='curated'`

**Preferred Approach:** Add `'curated'` to the existing `variant` prop type alongside `'compact' | 'full'`.

**Rationale:**
- Avoids creating a new component file (`CuratedRouteCard.tsx`)
- Keeps the existing tap→map loop machinery intact (RouteAttachmentCard already has `onSelect`, `onViewOnMap`, directions sheet integration)
- Conditional branching inside the component is manageable — the variants are already separated by `isCompact` boolean and the `!isCompact` block (lines 231-325 in route-attachment-card.tsx)
- Reuses proven interaction patterns, accessibility, and state management

**Alternative (Acceptable if Implementer Determines Complexity):** Create a new `CuratedRouteCard` component
- If the conditional branching inside `RouteAttachmentCard` would become too complex
- Implementer (DISC-020) should make this judgment based on the actual code structure
- Both options are acceptable — the spec documents both with a preference for extension

### New Props (if extending RouteAttachmentCard)

```typescript
type RouteAttachmentCardProps = {
  // ... existing props
  variant?: 'compact' | 'full' | 'curated'  // NEW: 'curated' option

  // NEW: Curated route data (only used when variant='curated')
  curatedRoute?: {
    name: string                          // Route name (e.g., "Blue Ridge Parkway")
    distanceMi: number                    // Distance in miles
    archetype: RouteArchetype             // UI enum: twisties | scenic | technical | cruising | sport | adventure
    compositeScore: number                // 0–1 float
    curvatureScore?: number               // 0–1 float (optional dimension)
    scenicScore?: number                  // 0–1 float (optional dimension)
    technicalScore?: number               // 0–1 float (optional dimension)
  }
}
```

**Implementation Pattern:**
```typescript
const isCurated = variant === 'curated'

// Row 1: Route name vs start→end labels
{isCurated ? (
  <Text style={[styles.routeName, { color: semantic.color.onSurface.default }]}>
    {curatedRoute?.name}
  </Text>
) : (
  <View style={styles.routeHeader}>
    {/* existing startLabel → endLabel */}
  </View>
)}

// Row 2: Mileage + archetype badge vs description + stats
{isCurated ? (
  <View style={styles.mileageArchetypeRow}>
    <Text>{Math.round(curatedRoute?.distanceMi ?? 0)}mi</Text>
    <Badge variant="secondary">{curatedRoute?.archetype}</Badge>
  </View>
) : (
  <>
    {/* existing route description + stats/badges */}
  </>
)}

// Row 3: Composite score (curated only)
{isCurated && (
  <View style={styles.compositeScoreRow}>
    <Text style={[styles.compositeScore, { color: semantic.color.primary.default }]}>
      {Math.round((curatedRoute?.compositeScore ?? 0) * 100)}%
    </Text>
  </View>
)}

// Optional dimension bars (curated only)
{isCurated && curatedRoute?.curvatureScore && (
  <ScoreDimensionBar label="Curvature" score={curatedRoute.curvatureScore} />
)}
// ... additional dimension bars
```

### New Component (if alternative approach)

```typescript
type CuratedRouteCardProps = {
  route: CuratedRouteData
  onSelect: (routeId: string) => void
  onViewOnMap?: () => void
  testID?: string
}

export const CuratedRouteCard = ({ route, onSelect, onViewOnMap, testID }: CuratedRouteCardProps) => {
  // Implementation focused on curated-specific layout
  // Can optionally share subcomponents (Badge, ScoreDimensionBar) with RouteAttachmentCard
}
```

---

## 5. Token Path Table

| Property | Token Path | Resolved Value (Light) | Resolved Value (Dark) |
|----------|------------|------------------------|----------------------|
| **Typography** | | | |
| Route name | `semantic.type.title.lg` | fontSize: 17, lineHeight: 21, fontWeight: 600 | Same |
| Composite score | `semantic.type.title.lg` | fontSize: 17, lineHeight: 21, fontWeight: 600 | Same |
| Mileage text | `semantic.type.body.md` | fontSize: 12, lineHeight: 18, fontWeight: 400 | Same |
| Score bar dimension label | `semantic.type.label.sm` | fontSize: 9, lineHeight: 9, fontWeight: 600 | Same |
| Score bar value (instrument) | `semantic.type.instrument.sm` | Font family: JetBrains Mono (via instrument font) | Same |
| Score bar value (fallback) | `semantic.type.label.sm` | fontSize: 9, lineHeight: 9, fontWeight: 600 | Same |
| **Colors** | | | |
| Card background | `semantic.color.surfaceVariant.default` | #FDFBF8 | #2D2218 |
| Card border | `semantic.color.border.default` | #E5DED9 | rgba(242,238,232,0.12) |
| Route name text | `semantic.color.onSurface.default` | #1E1A16 | #F2EEE8 |
| Composite score text | `semantic.color.primary.default` | #EE7C2B | #EE7C2B |
| Mileage text | `semantic.color.onSurface.subtle` | (defined in colors.tokens.json) | (defined in colors.tokens.json) |
| Score bar track | `semantic.color.surface.inset` | (defined in colors.tokens.json) | (defined in colors.tokens.json) |
| Score bar fill | `semantic.color.primary.default` | #EE7C2B | #EE7C2B |
| Score bar dimension label | `semantic.color.onSurface.muted` | (defined in colors.tokens.json) | (defined in colors.tokens.json) |
| Score bar value | `semantic.color.onSurface.default` | #1E1A16 | #F2EEE8 |
| **Spacing** | | | |
| Card horizontal padding | `semantic.space.md` | 12dp | Same |
| Card vertical padding | `semantic.space.md` | 12dp | Same |
| Row gap | `semantic.space.sm` | 8dp | Same |
| Score bar height | `semantic.space.xs × 2` | 4dp × 2 = 8dp | Same |
| Score bars vertical gap | `semantic.space.xs` | 4dp | Same |
| **Border Radius** | | | |
| Card border radius | `semantic.radius.md` | 10dp | Same |
| Score bar border radius | `semantic.radius.full` | 9999 | Same |
| **Elevation** | | | |
| Card elevation | `semantic.elevation[2]` | shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.21, shadowRadius: 6 | Same |
| **Control** | | | |
| Minimum touch target | `semantic.control.minTouchTarget` | 44dp | Same |

**Token Usage Notes:**
- All properties use semantic tokens — **no hardcoded hex values**
- `semantic.type.instrument.sm` should reference JetBrains Mono (the instrument font)
- Where resolved values show "(defined in colors.tokens.json)", implementer should reference the full token file for exact values
- The score bar height is computed as `semantic.space.xs × 2` (from dimensions.tokens.json: spacing.3 = 4dp)
- All token paths are verifiable via `pnpm tokens:validate`

---

## Implementation Audit (Current State)

### RouteAttachmentCard (components/chat/route-attachment-card.tsx)

**Current Implementation Status:**
- ✅ Full variant exists (lines 72-325)
- ✅ Compact variant exists (`isCompact` boolean flag)
- ❌ **Curated variant NOT yet implemented**
- ❌ ScoreDimensionBar component NOT yet created (referenced in 10-design-system.md §2 but doesn't exist)

**Audit Findings Against Spec:**

| Spec Requirement | Current State | Gap |
|------------------|---------------|-----|
| `variant='curated'` prop | NOT present | Must add to RouteAttachmentCardProps |
| `curatedRoute` prop | NOT present | Must add curatedRoute data shape |
| Route name display (Row 1) | Shows `startLabel → endLabel` (lines 189-228) | Must change to show route name only when `variant='curated'` |
| Mileage + archetype badge (Row 2) | NOT present | Must add curated-specific row with mileage and Badge |
| Composite score display (Row 3) | NOT present | Must add prominent `Math.round(score * 100) + '%'` |
| ScoreDimensionBar components | NOT present | Must create `components/ui/score-dimension-bar.tsx` per 10-design-system.md §2 |
| Mini-map exclusion | Conditionally shown (lines 170-185) | Must ensure NOT shown for `variant='curated'` |
| testID reuse | `testID='route-attachment-card'` (line 158) | ✅ Correct, reuse for curated variant |
| Touch target (44pt) | Implicit via content | May need explicit `minHeight` if content is sparse |
| Semantic theme usage | ✅ Consistent | ✅ No changes needed |

**ScoreDimensionBar Audit:**
- Component path: `components/ui/score-dimension-bar.tsx` (NOT YET CREATED)
- Spec reference: 10-design-system.md §2 (lines 35-60)
- Required props: `label: string`, `score: number`, `testID?: string`
- Required token usage: `semantic.type.label.sm`, `semantic.color.surface.inset`, `semantic.color.primary.default`, `semantic.space.xs`, `semantic.radius.full`

**Next Steps for Implementation (DISC-020):**
1. Create `ScoreDimensionBar` component in `components/ui/score-dimension-bar.tsx`
2. Add `'curated'` to RouteAttachmentCardProps variant type
3. Add `curatedRoute` prop with full data shape
4. Implement conditional rendering in RouteAttachmentCard:
   - Row 1: Route name only (no start→end labels)
   - Row 2: Mileage + archetype badge
   - Row 3: Composite score + optional dimension bars
5. Exclude mini-map preview for curated variant
6. Ensure testID `'route-attachment-card'` is reused
7. Verify touch target meets 44pt minimum

---

## References

- **Base Component:** `components/chat/route-attachment-card.tsx` (72-165 — existing full variant)
- **Design System Spec:** `.spec/prds/mvp/09-technical-requirements/10-design-system.md` (§2: ScoreDimensionBar, §1: Token rules)
- **UI Infrastructure:** `.spec/prds/mvp/09-technical-requirements/07-ui-infrastructure.md` (§1: Discovery rides existing machinery)
- **Use Case:** `.spec/prds/mvp/05-uc-disc.md` (UC-DISC-10 AC: score rendering on 0-1 scale as %/bars)
- **Task Spec:** `.spec/prds/mvp/tasks/sprint-01-discovery-on-the-route-plan-view/DESIGN-S01-002.md`
- **Sprint:** `.spec/prds/mvp/tasks/sprint-01-discovery-on-the-route-plan-view/SPRINT.md` (DISC-020 task scope)
- **Tokens:** `tokens/semantic/semantic.tokens.json` (all color, spacing, typography, elevation tokens)