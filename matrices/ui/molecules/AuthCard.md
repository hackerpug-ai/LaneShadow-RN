# AuthCard - STYLE PROPERTIES MATRIX

**Component:** AuthCard
**RN Source:** `react-native/components/auth/auth-card.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/auth/auth-card.tsx` | Public API, auth card layout |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Title typography |

---

## COMPOSITION

**Child atoms:**
- None (renders children directly)

**Composition pattern:** Vertical column card with optional title, children content (with gap), and optional footer. Card has background, border, rounded corners, padding, and elevation. Used in auth screens (login, signup).

**Layout:** Vertical flex column with gap spacing between elements.

---

## STYLE PROPERTIES MATRIX

### Layout — Card

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.card.default` | `MaterialTheme.colorScheme.surface` | `Color(.secondarySystemGroupedBackground)` | `color.card.default` |
| borderColor | RN-wrapper | `semantic.color.border.default` | `MaterialTheme.colorScheme.outline` | `Color(.separator)` | `color.border.default` |
| borderRadius | RN-wrapper | `semantic.radius.lg` = 12 | `Modifier.clip(RoundedCornerShape(12.dp))` | `.clipShape(RoundedRectangle(cornerRadius: 12))` | `radius.lg` |
| padding | RN-wrapper | `semantic.space.xl` = 24 | `Modifier.padding(24.dp)` | `.padding(24)` | `space.xl` |
| gap | RN-wrapper | `semantic.space.md` = 12 | `Arrangement.spacedBy(12.dp)` inside Column | `.spacing(12)` | `space.md` |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(..., lineWidth: 1))` | `borderWidth.thin` |
| elevation | RN-wrapper | `semantic.elevation[4]` | `Modifier.shadow(8.dp, ambient = 0.15f, spot = 0f)` or `Modifier.graphicsLayer { shadowElevation = 8f }` | `.shadow(color: .black.opacity(0.15), radius: 8, x: 0, y: 4)` | `elevation[4]` |

### Layout — Children Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| gap | RN-wrapper | `semantic.space.md` = 12 | `Arrangement.spacedBy(12.dp)` inside Column | `.spacing(12)` | `space.md` |

### Typography — Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'titleMedium'` | `MaterialTheme.typography.titleMedium` | `.font(.system(size: 16, weight: .semibold))` | ESCALATE — map to `type.heading.sm` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `Color(.label)` | `color.onSurface.default` |
| text | RN-wrapper | `title` prop | `Text(title)` | `Text(title)` | n/a |
| condition | RN-wrapper | `title ? ... : null` | `if (title != null) { Text(title) }` | `if let title = title { Text(title) }` | n/a |

---

## NOTES

**AuthCard Component:**
- **Card styling:** Card background, border, rounded corners (12px), 24px padding, elevation 4
- **Content:** Optional title, children (with 12px gap), optional footer
- **Title:** titleMedium variant, onSurface color, only rendered if title prop provided
- **Spacing:** 12px gap between title, children, footer
- **Full width:** Card fills parent width by default
- **Children container:** Separate container with 12px gap for child elements

**AuthDivider Component (exported separately):**
- **Purpose:** Visual divider with label (e.g., "OR" between social login and email)
- **Layout:** Horizontal row with divider lines (flex: 1) on both sides of label
- **Gap:** 8px gap between divider lines and label
- **Divider:** Hairline width, divider color
- **Label:** labelMedium variant, onSurface.subtle color

**AuthDivider Layout:**
| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `semantic.space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `.spacing(8)` | `space.sm` |

**AuthDivider Typography:**
| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'labelMedium'` | `MaterialTheme.typography.labelMedium` | `.font(.system(size: 11, weight: .medium))` | `type.label.md` |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `MaterialTheme.colorScheme.onSurfaceVariant` | `Color(.tertiaryLabel)` | `color.onSurface.subtle` |
| text | RN-wrapper | `label` prop | `Text(label)` | `Text(label)` | n/a |

**AuthDivider Visual:**
| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| divider flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |
| divider height | RN-wrapper | `StyleSheet.hairlineWidth` | `Modifier.height(1.dp)` or `Divider()` | `.frame(height: 0.5)` or `Divider()` | `borderWidth.thin` |
| divider backgroundColor | RN-wrapper | `semantic.color.divider.default` | `MaterialTheme.colorScheme.outlineVariant` | `Color(.separator)` | `color.divider.default` |

**Usage Pattern:**
```tsx
<AuthCard title="Sign In">
  <EmailInput />
  <PasswordInput />
  <Button>Sign In</Button>
</AuthCard>

<AuthDivider label="OR" />

<SocialLoginButtons />
```

**Spacing:** 24px card padding creates breathing room, 12px gap between elements
**Elevation:** Level 4 (8dp shadow) creates depth for auth cards
**Border radius:** 12px for modern card appearance
**Border:** 1px subtle border for definition
