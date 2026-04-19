# MarkdownText - STYLE PROPERTIES MATRIX

**Component:** MarkdownText
**RN Source:** `react-native/components/ui/markdown-text.tsx`
**Framework Primitives:** `react-native-markdown-display` library

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/markdown-text.tsx` | Public API, markdown rendering, theme integration |
| Markdown | `react-native-markdown-display` | Markdown parsing and rendering |

---

## COMPOSITION

**Child atoms:**
- None (renders markdown directly to text elements)

**Composition pattern:** Wrapper around react-native-markdown-display that applies semantic theme styles to all markdown elements.

**Layout:** Vertical stack of markdown elements (headings, paragraphs, lists, etc.) with theme-based spacing.

---

## STYLE PROPERTIES MATRIX

### Typography — Body

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.body.lg.fontSize` | `LaneShadowTheme.typography.bodyLarge.fontSize` | `Font.body` | `type.body.lg.fontSize` |
| fontWeight | RN-wrapper | `semantic.type.body.lg.fontWeight` | `LaneShadowTheme.typography.bodyLarge.fontWeight` | `Font.body.regular` | `type.body.lg.fontWeight` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Typography — Heading 1

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.heading.lg.fontSize` | `LaneShadowTheme.typography.headingLarge.fontSize` | `Font.title` | `type.heading.lg.fontSize` |
| fontWeight | RN-wrapper | `semantic.type.heading.lg.fontWeight` | `LaneShadowTheme.typography.headingLarge.fontWeight` | `Font.title.bold` | `type.heading.lg.fontWeight` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| marginTop | RN-wrapper | `semantic.space.md` | `LaneShadowTheme.spacing.medium` | `.padding(.top, 12)` | `space.md` (12) |
| marginBottom | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `.padding(.bottom, 8)` | `space.sm` (8) |

### Typography — Heading 2

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.heading.md.fontSize` | `LaneShadowTheme.typography.headingMedium.fontSize` | `Font.title2` | `type.heading.md.fontSize` |
| fontWeight | RN-wrapper | `semantic.type.heading.md.fontWeight` | `LaneShadowTheme.typography.headingMedium.fontWeight` | `Font.title2.bold` | `type.heading.md.fontWeight` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| marginTop | RN-wrapper | `semantic.space.md` | `LaneShadowTheme.spacing.medium` | `.padding(.top, 12)` | `space.md` (12) |
| marginBottom | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `.padding(.bottom, 8)` | `space.sm` (8) |

### Typography — Heading 3

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.heading.sm.fontSize` | `LaneShadowTheme.typography.headingSmall.fontSize` | `Font.title3` | `type.heading.sm.fontSize` |
| fontWeight | RN-wrapper | `semantic.type.heading.sm.fontWeight` | `LaneShadowTheme.typography.headingSmall.fontWeight` | `Font.title3.bold` | `type.heading.sm.fontWeight` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| marginTop | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `.padding(.top, 8)` | `space.sm` (8) |
| marginBottom | RN-wrapper | `semantic.space.xs` | `LaneShadowTheme.spacing.extraSmall` | `.padding(.bottom, 4)` | `space.xs` (4) |

### Typography — Strong (Bold)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.body.lg.fontSize` | `LaneShadowTheme.typography.bodyLarge.fontSize` | `Font.body` | `type.body.lg.fontSize` |
| fontWeight | RN-wrapper | `700` | `FontWeight.Bold` | `.bold()` | n/a (bold weight) |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Typography — Em (Italic)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontStyle | RN-wrapper | `'italic'` | `FontStyle.Italic` | `.italic()` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Visual — Code Inline

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| fontSize | RN-wrapper | `semantic.type.body.sm.fontSize` | `LaneShadowTheme.typography.bodySmall.fontSize` | `Font.caption` | `type.body.sm.fontSize` |
| paddingHorizontal | RN-wrapper | `semantic.space.xs` | `LaneShadowTheme.spacing.extraSmall` | `.padding(.horizontal, 4)` | `space.xs` (4) |
| paddingVertical | RN-wrapper | `2` | `2.dp` | `2` | ESCALATE — minimal padding |
| borderRadius | RN-wrapper | `semantic.radius.sm` | `LaneShadowTheme.shapes.small` | `.cornerRadius(4)` | `radius.sm` (4) |

### Visual — Code Block

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| fontSize | RN-wrapper | `semantic.type.body.sm.fontSize` | `LaneShadowTheme.typography.bodySmall.fontSize` | `Font.caption` | `type.body.sm.fontSize` |
| padding | RN-wrapper | `semantic.space.md` | `LaneShadowTheme.spacing.medium` | `.padding(12)` | `space.md` (12) |
| borderRadius | RN-wrapper | `semantic.radius.md` | `LaneShadowTheme.shapes.medium` | `.cornerRadius(8)` | `radius.md` (8) |
| marginBottom | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `.padding(.bottom, 8)` | `space.sm` (8) |
| fontFamily | RN-wrapper | `Menlo` (iOS), `monospace` (Android) | `FontFamily.Monospace` | `Font.system(.monospaced)` | n/a |

### Visual — Blockquote

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `${semantic.color.surfaceVariant.default}33` | `LaneShadowTheme.colors.surfaceVariant.copy(alpha = 0.2f)` | `theme.colors.surfaceVariant.opacity(0.2)` | `color.surfaceVariant.default` |
| borderLeftWidth | RN-wrapper | `4` | `4.dp` | `4` | ESCALATE — quote border width |
| borderLeftColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| paddingLeft | RN-wrapper | `semantic.space.md` | `LaneShadowTheme.spacing.medium` | `.padding(.leading, 12)` | `space.md` (12) |
| paddingVertical | RN-wrapper | `semantic.space.xs` | `LaneShadowTheme.spacing.extraSmall` | `.padding(.vertical, 4)` | `space.xs` (4) |
| marginBottom | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `.padding(.bottom, 8)` | `space.sm` (8) |

### Visual — Link

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| textDecorationLine | RN-wrapper | `'underline'` | `TextDecoration.Underline` | `.underline()` | n/a |

### Layout — List Item

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| marginBottom | RN-wrapper | `semantic.space.xs` | `LaneShadowTheme.spacing.extraSmall` | `.padding(.bottom, 4)` | `space.xs` (4) |

### Layout — Lists

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| marginLeft | RN-wrapper | `semantic.space.md` | `LaneShadowTheme.spacing.medium` | `.padding(.leading, 12)` | `space.md` (12) |
| marginBottom | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `.padding(.bottom, 8)` | `space.sm` (8) |

### Layout — Paragraph

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| marginBottom | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `.padding(.bottom, 8)` | `space.sm` (8) |

### Visual — Table

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| borderWidth | RN-wrapper | `1` | `1.dp` | `1` | n/a |
| borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| borderRadius | RN-wrapper | `semantic.radius.md` | `LaneShadowTheme.shapes.medium` | `.cornerRadius(8)` | `radius.md` (8) |
| marginBottom | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `.padding(.bottom, 8)` | `space.sm` (8) |

### Visual — Table Header

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |

### Typography — Table Cells

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.body.sm.fontSize` | `LaneShadowTheme.typography.bodySmall.fontSize` | `Font.caption` | `type.body.sm.fontSize` |
| fontWeight (th) | RN-wrapper | `700` | `FontWeight.Bold` | `.bold()` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| padding | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `.padding(8)` | `space.sm` (8) |

### Visual — Horizontal Rule

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| height | RN-wrapper | `1` | `1.dp` | `1` | n/a |
| marginTop | RN-wrapper | `semantic.space.md` | `LaneShadowTheme.spacing.medium` | `.padding(.top, 12)` | `space.md` (12) |
| marginBottom | RN-wrapper | `semantic.space.md` | `LaneShadowTheme.spacing.small` | `.padding(.bottom, 8)` | `space.sm` (8) |

---

## NOTES

- **Library dependency:** Uses `react-native-markdown-display` for markdown parsing and rendering
- **Comprehensive styling:** Applies semantic theme to all markdown elements (headings, lists, code blocks, tables, etc.)
- **Code styling:** Inline code uses primary color on surface variant background; code blocks use monospace font
- **Link handling:** Supports link presses with default browser behavior
- **Platform-specific fonts:** Code blocks use `Menlo` on iOS and `monospace` on Android
- **Spacing hierarchy:** Larger margins for headings (12/8), smaller for paragraphs (8), minimal for nested elements (4)
- **Custom styles:** Supports optional style overrides via prop
- **CommonMark support:** Renders headings, bold, italic, lists, links, code blocks, blockquotes, tables, and horizontal rules
