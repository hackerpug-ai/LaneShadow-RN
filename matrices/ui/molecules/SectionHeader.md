# SectionHeader - STYLE PROPERTIES MATRIX

**Component:** SectionHeader
**RN Source:** `react-native/components/ui/section-header.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/section-header.tsx` | Public API, layout, typography |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Title, subtitle, action text display |

---

## COMPOSITION

**Child atoms:** None (uses Paper Text directly)

**Composition pattern:** Row container with text container (flex: 1) on left and optional action button on right. Text container contains title and optional subtitle stacked vertically.

**Layout:** Horizontal row (`flexDirection: 'row'`), space-between alignment, flex-start cross-alignment.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a | n/a |
| alignItems | RN-wrapper | `'flex-start'` | `verticalAlignment = Alignment.Top` | `.alignment(.top)` | n/a |

### Layout — Text Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |

### Typography — Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `20` | `20.sp` | `20` | ESCALATE — between `type.title.sm` (18) and `type.title.md` (22); use `20.sp` literal |
| fontWeight | RN-wrapper | `600` (semibold) | `FontWeight.SemiBold` | `.semibold` | ESCALATE — propose `fontWeight.semibold = 600` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Typography — Subtitle

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `14` | `14.sp` | `14` | `type.body.sm.fontSize` |
| fontWeight | RN-wrapper | default (400) | `FontWeight.Normal` | `.regular` | `type.body.sm.fontWeight` |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| marginTop | RN-wrapper | `4` | `Modifier.padding(top = 4.dp)` | `.padding(.top, 4)` | ESCALATE — `space.xs` (4) ✓ |

### Typography — Action

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `16` | `16.sp` | `16` | `type.body.md.fontSize` |
| fontWeight | RN-wrapper | `500` (medium) | `FontWeight.Medium` | `.medium` | `type.label.md.fontWeight` |
| color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| onPress | RN-wrapper | callback prop | `Modifier.clickable { onActionPress() }` | `.onTapGesture { onActionPress() }` | n/a |

---

## NOTES

- **Optional subtitle:** Subtitle renders only when provided
- **Optional action:** Action text renders only when both `action` and `onActionPress` provided
- **Two-section layout:** Text container (flex: 1) on left, action text on right
- **Title typography:** 20px semibold for section headers
- **Action button:** Text-only action using primary color, no background
- **Subtitle spacing:** 4px margin top below title
- **Use cases:** Section headers in lists, settings sections, route options, filter sections
