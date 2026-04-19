# TurnInstructionCard - STYLE PROPERTIES MATRIX

**Component:** TurnInstructionCard (DELTA)
**Level:** Molecule
**RN Source:** **NEW COMPONENT — NO RN BASELINE**
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js` (composition of existing atoms)

---

## DELTA CONTEXT

**Source UC:** UC-NAV-02, UC-FLOW-06 — Turn-by-turn navigation instructions

**Rationale:** Net-new molecule consolidating turn instruction display. Combines maneuver icon, street name, distance, and lane guidance into reusable card.

**Migration path:** Compose existing atoms (`IconSymbol`, `Badge`, `StatRow`) - no new primitives needed.

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| UC Spec | `.spec/prds/native-rewrite/09-uc-navigation.md`, `15-uc-ride-flow.md` | UC-NAV-02, UC-FLOW-06 requirements |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Maneuver icon (see matrices/ui/atoms/IconSymbol.md) |
| Badge | `react-native/components/ui/badge.tsx` | Distance badge (see matrices/ui/atoms/Badge.md) |
| StatRow | `react-native/components/ui/stat-row.tsx` | Lane guidance stats (see matrices/ui/molecules/StatRow.md) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Street name typography |

---

## STYLE PROPERTIES MATRIX

### Layout — Container (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flexDirection | Task spec | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | Task spec | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| backgroundColor | Task spec | `color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| borderRadius | Task spec | `radius.lg` = 12 | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | `radius.lg` |
| padding | Task spec | `space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| gap | Task spec | `space.md` = 12 | `Arrangement.spacedBy(12.dp)` / `Modifier.padding(end = 12.dp)` between items | `spacing(12)` | `space.md` |

### Layout — Maneuver Icon Container (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| width | Task spec | `48` | `Modifier.size(48.dp)` | `.frame(width: 48, height: 48)` | ESCALATE — propose `size.maneuverIcon = 48` |
| height | Task spec | `48` | Included above | Included above | ESCALATE — propose `size.maneuverIcon = 48` |
| backgroundColor | Task spec | `color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| borderRadius | Task spec | `radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| alignItems | Task spec | `'center'` | `Modifier.wrapContentSize(Alignment.CenterHorizontally)` + vertical | `.frame(alignment: .center)` | n/a |
| justifyContent | Task spec | `'center'` | Included above | Included above | n/a |

### Icon — Maneuver (IconSymbol)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| name | Task spec | Maneuver type (e.g., 'turn-left', 'u-turn') | Map to Material Icons | Map to SF Symbols | n/a |
| size | Task spec | `24` | `Modifier.size(24.dp)` | `.frame(width: 24, height: 24)` | ESCALATE — propose `icon.maneuver = 24` |
| color | Task spec | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Layout — Text Content (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flex | Task spec | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |
| gap | Task spec | `space.xs` = 4 | `Arrangement.spacedBy(4.dp)` / `Modifier.padding(end = 4.dp)` between items | `spacing(4)` | `space.xs` |

### Typography — Street Name (Text variant=titleMedium)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | Task spec | `titleMedium` | `MaterialTheme.typography.titleMedium` | Verify against Paper | n/a |
| fontSize | Paper titleMedium | Verify in source | (verify) | (verify) | ESCALATE — verify token |
| color | Task spec | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Typography — Instruction (Text variant=bodyMedium)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | Task spec | `bodyMedium` | `MaterialTheme.typography.bodyMedium` | Verify against Paper | n/a |
| color | Task spec | `color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

### Layout — Distance Badge (Badge)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | Task spec | `'neutral'` or `'primary'` | `BadgeVariant.Neutral` or `.primary` | `BadgeVariant.neutral` or `.primary` | n/a |
| text | Task spec | `'200 m'` or `'0.2 mi'` | `Badge(text = "200 m")` | `Badge("200 m")` | n/a |

### Layout — Lane Guidance (StatRow, optional)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| icon | Task spec | Lane guidance icon | Map to Material Icons | Map to SF Symbols | n/a |
| value | Task spec | `'Right 2 lanes'` | `StatRow(icon = ..., value = ...)` | `StatRow(icon: ..., value: ...)` | n/a |

### State — Props

| State | Source | Type | Android | iOS | Token |
|---|---|---|---|---|---|
| maneuverType | Task spec | `String` (turn-left, turn-right, u-turn, etc.) | `val maneuverType: String` | `var maneuverType: String` | n/a |
| streetName | Task spec | `String` | `val streetName: String` | `var streetName: String` | n/a |
| instruction | Task spec | `String` | `val instruction: String` | `var instruction: String` | n/a |
| distance | Task spec | `String` (formatted) | `val distance: String` | `var distance: String` | n/a |
| laneGuidance | Task spec | `String?` (optional) | `val laneGuidance: String?` | `var laneGuidance: String?` | n/a |

---

## NOTES

- **NEW molecule:** No RN baseline exists
- **Composition:** Maneuver icon + text content + distance badge + optional lane guidance
- **Icon container:** 48px, surfaceVariant background, rounded
- **Maneuver icon:** 24px, maps turn type to icon
- **Text content:** Street name (titleMedium) + instruction (bodyMedium, muted)
- **Distance badge:** Neutral or primary variant, formatted distance
- **Lane guidance:** Optional StatRow with icon and lane info
- **Spacing:** 12px gap between main sections, 4px between text lines
- **Background:** surface color, rounded corners
- **Accessibility:** `accessibilityLabel` = "{instruction} in {distance} on {streetName}"
