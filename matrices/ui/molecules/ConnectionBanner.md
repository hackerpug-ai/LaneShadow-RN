# ConnectionBanner - STYLE PROPERTIES MATRIX

**Component:** ConnectionBanner
**RN Source:** `react-native/components/ui/connection-banner.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/connection-banner.tsx` | Public API, static content |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Typography |

---

## COMPOSITION

**Child atoms:** None (uses Text component directly)

**Composition pattern:** Single Text component in full-width View container.

**Layout:** Full-width banner with centered text.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| padding | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |

### Visual — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |

### Typography — Text

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `bodySmall` | `MaterialTheme.typography.bodySmall` → map to LaneShadow | `.font(.system(size: 12, weight: .regular))` | ESCALATE — verify `type.body.sm` mapping |
| color | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| textAlign | RN-wrapper | `'center'` | `TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |

---

## NOTES

- **Static content:** "📡 Connection Required - Some features may be limited"
- **Warning color:** Uses warning background (#D98E04) with onPrimary text (#0E0F11)
- **Full width:** Banner spans entire width of parent
- **Centered text:** Text is horizontally centered
- **Padding:** 12px padding inside banner
- **No press interaction:** Banner is informational only, not interactive
- **Elevation:** No shadow (flat banner)
- **Emoji:** Uses satellite dish emoji (📡) as visual indicator
