# Separator - STYLE PROPERTIES MATRIX

**Component:** Separator
**RN Source:** `react-native/components/ui/separator.tsx`
**Atomic Level:** Atom
**Domain:** Layout

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/separator.tsx` | Public API, orientation |

---

## STYLE PROPERTIES MATRIX

### Layout — Orientation

| Orientation | Source | Width | Height | Android | iOS | Token |
|---|---|---|---|---|---|---|
| horizontal (default) | RN-wrapper | 100% | 1 | `Modifier.fillMaxWidth().height(1.dp)` | `.frame(maxWidth: .infinity).frame(height: 1)` | n/a |
| vertical | RN-wrapper | 1 | 100% | `Modifier.fillMaxHeight().width(1.dp)` | `.frame(maxHeight: .infinity).frame(width: 1)` | n/a |

### Visual — Color

| Theme | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| light | RN-wrapper | `rgba(0,0,0,0.08)` | `LaneShadowTheme.colors.divider` | `theme.colors.divider` | `color.divider.default` |
| dark | RN-wrapper | `rgba(255,255,255,0.08)` | `LaneShadowTheme.colors.divider` | `theme.colors.divider` | `color.divider.default` |

### Layout — Flex

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flex | RN-wrapper | 1 | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |

---

## NOTES

- **Orientation**: Defaults to horizontal; vertical option for dividers
- **Color**: Uses semantic divider color with 8% opacity
- **Flex**: Flex-grow to fill available space
- **Thickness**: 1px (proposed `borderWidth.thin`)
- **Usage**: Visual separator between content sections
