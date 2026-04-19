---
stability: FEATURE_SPEC
last_validated: 2026-04-19
prd_version: 1.0.0
functional_group: DESIGN
parent: 08a-atomic-component-catalog.md
---

# STYLE PROPERTIES MATRIX — RouteLegTimeline

## Component Overview

**RN Source:** `react-native/components/ui/route-leg-timeline.tsx`  
**Atomic Level:** Molecule  
**Domain:** UI Component

### Description

Timeline showing route segments.

### Variants

| Variant | Description | Token Usage |
|---------|-------------|-------------|
| default | Default state | base tokens |
| pressed | Pressed state | opacity modifiers |

---

## TRANSLATION SOURCES

### Android (Jetpack Compose)

| Platform Primitive | RN Property | Notes |
|-------------------|-------------|-------|
| `Row` | `View` (flexDirection: row) | Horizontal layouts |
| `Column` | `View` (flexDirection: column) | Vertical layouts |
| `Box` | `View` | Positioned children |
| `Surface` | `View` with elevation | Cards with shadows |
| `Card` | `View` with border + radius | Card containers |
| `Text` | `Text` | Typography |
| `Icon` | `IconSymbol` | Icons |
| `Button` | `Pressable` | Interactive elements |
| `TextField` | `TextInput` | Text input |
| `Modifier.padding` | `style.padding` | Spacing |
| `Modifier.size` | `style.width/height` | Dimensions |
| `Modifier.background` | `style.backgroundColor` | Background color |
| `Modifier.border` | `style.borderWidth/borderColor` | Borders |
| `Modifier.clickable` | `onPress` prop | Touch handling |

### iOS (SwiftUI)

| Platform Primitive | RN Property | Notes |
|-------------------|-------------|-------|
| `HStack` | `View` (flexDirection: row) | Horizontal layouts |
| `VStack` | `View` (flexDirection: column) | Vertical layouts |
| `ZStack` | `View` (absolute positioning) | Stacked layouts |
| `Rectangle` | `View` | Shape backgrounds |
| `RoundedRectangle` | `View` with border + radius | Card shapes |
| `Text` | `Text` | Typography |
| `Image` | `IconSymbol` | Icons |
| `Button` | `Pressable` | Interactive elements |
| `TextField` | `TextInput` | Text input |
| `.padding()` | `style.padding` | Spacing |
| `.frame()` | `style.width/height` | Dimensions |
| `.background()` | `style.backgroundColor` | Background color |
| `.overlay()` | `style.borderWidth/borderColor` | Borders |
| `.onTapGesture()` | `onPress` prop | Touch handling |

---

## DESIGN TOKENS

### Color Tokens

        - semantic.color.onSurface.default
        - semantic.color.onSurface.subtle
        - semantic.color.onSurface.muted
        - semantic.color.surface.default
        - semantic.color.surfaceVariant.default
        - semantic.color.border.default
        - semantic.color.primary.default
        - semantic.color.background.default

### Typography Tokens

        - semantic.type.body.md
        - semantic.type.label.md
        - semantic.type.title.md

### Spacing Tokens

        - semantic.space.xs
        - semantic.space.sm
        - semantic.space.md
        - semantic.space.lg
        - semantic.space.xl

### Border Radius Tokens

        - semantic.radius.md
        - semantic.radius.lg
        - semantic.radius.full

### Elevation Tokens

        - semantic.elevation.light.1
        - semantic.elevation.light.2

---

## STYLE PROPERTIES MATRIX

### Layout Properties

| Property | Value | Token | Platform |
|----------|-------|-------|----------|
| Gap (horizontal) | 6-8pt | semantic.space.sm | Android: `Modifier.padding(horizontal = 6.dp)`, iOS: `.spacing(6)` |
| Gap (vertical) | 8-12pt | semantic.space.md | Android: `Modifier.padding(vertical = 12.dp)`, iOS: `.spacing(12)` |
| Padding (card) | 12-16pt | semantic.space.lg | Android: `Modifier.padding(16.dp)`, iOS: `.padding(16)` |
| Padding (compact) | 8-12pt | semantic.space.md | Android: `Modifier.padding(12.dp)`, iOS: `.padding(12)` |

### Typography Properties

| Property | Value | Token | Platform |
|----------|-------|-------|----------|
| Font size (body) | 14-16pt | semantic.type.body.md.fontSize | Android: `fontSize = 14.sp`, iOS: `.font(.body)` |
| Font size (title) | 16-18pt | semantic.type.title.md.fontSize | Android: `fontSize = 16.sp`, iOS: `.font(.title3)` |
| Font weight (normal) | 400-500 | semantic.type.body.md.fontWeight | Android: `fontWeight = FontWeight.Normal`, iOS: `.weight(.medium)` |
| Font weight (bold) | 600-700 | semantic.type.title.md.fontWeight | Android: `fontWeight = FontWeight.SemiBold`, iOS: `.weight(.semibold)` |
| Line height (body) | 20-24pt | semantic.type.body.md.lineHeight | Android: `lineHeight = 20.sp`, iOS: `.lineSpacing(4)` |

### Color Properties

| Property | Value | Token | Platform |
|----------|-------|-------|----------|
| Text (primary) | #1E1E1E | semantic.color.onSurface.default | Android: `color = MaterialTheme.colors.onSurface`, iOS: `.foregroundColor(.onSurface)` |
| Text (secondary) | #6B7280 | semantic.color.onSurface.subtle | Android: `color = MaterialTheme.colors.onSurface.copy(alpha = 0.7f)`, iOS: `.foregroundColor(.secondary)` |
| Background (card) | #FFFFFF | semantic.color.card.default | Android: `backgroundColor = MaterialTheme.colors.surface`, iOS: `.background(.surface)` |
| Background (surface) | #F7F3EF | semantic.color.surface.default | Android: `backgroundColor = MaterialTheme.colors.surfaceVariant`, iOS: `.background(.background)` |
| Border (default) | #D9D0C7 | semantic.color.border.default | Android: `border = BorderStroke(1.dp, MaterialTheme.colors.border)`, iOS: `.overlay(RoundedRectangle().stroke(.border))` |
| Border (active) | #B87333 | semantic.color.primary.default | Android: `border = BorderStroke(2.dp, MaterialTheme.colors.primary)`, iOS: `.overlay(RoundedRectangle().stroke(.primary))` |

### Border Properties

| Property | Value | Token | Platform |
|----------|-------|-------|----------|
| Border width (default) | 1pt | semantic.borderWidth.thin | Android: `borderWidth = 1.dp`, iOS: `.stroke(1)` |
| Border width (active) | 2pt | semantic.borderWidth.thick | Android: `borderWidth = 2.dp`, iOS: `.stroke(2)` |
| Border radius (card) | 12-16pt | semantic.radius.lg | Android: `shape = RoundedCornerShape(16.dp)`, iOS: `.cornerRadius(16)` |
| Border radius (badge) | 9999pt | semantic.radius.full | Android: `shape = RoundedCornerShape(50%)`, iOS: `.cornerRadius(.infinity)` |
| Border radius (button) | 8pt | semantic.radius.md | Android: `shape = RoundedCornerShape(8.dp)`, iOS: `.cornerRadius(8)` |

### Shadow/Elevation Properties

| Property | Value | Token | Platform |
|----------|-------|-------|----------|
| Elevation (default) | level 1 | semantic.elevation.light.1 | Android: `elevation = 1.dp`, iOS: `.shadow(color: .black, radius: 2, y: 1)` |
| Elevation (raised) | level 2 | semantic.elevation.light.2 | Android: `elevation = 2.dp`, iOS: `.shadow(color: .black, radius: 4, y: 2)` |
| Elevation (pressed) | level 3 | semantic.elevation.light.3 | Android: `elevation = 3.dp`, iOS: `.shadow(color: .black, radius: 8, y: 4)` |

### Opacity Properties

| Property | Value | Token | Platform |
|----------|-------|-------|----------|
| Opacity (disabled) | 50% | semantic.opacity.disabled | Android: `alpha = 0.5f`, iOS: `.opacity(0.5)` |
| Opacity (pressed) | 80% | semantic.opacity.pressed | Android: `alpha = 0.8f`, iOS: `.opacity(0.8)` |
| Opacity (overlay) | 50% | semantic.opacity.overlay | Android: `alpha = 0.5f`, iOS: `.opacity(0.5)` |

---

## VARIANTS AND STATES

### Size Variants

| Variant | Height | Padding | Font Size | Notes |
|---------|--------|---------|-----------|-------|
| compact | 40-48pt | semantic.space.md | semantic.type.body.sm | Condensed layout |
| default | 48-56pt | semantic.space.lg | semantic.type.body.md | Standard layout |

### State Variants

| State | Background | Border | Text | Opacity | Notes |
|-------|------------|--------|------|---------|-------|
| default | semantic.color.card.default | semantic.color.border.default | semantic.color.onSurface.default | 100% | Normal state |
| pressed | semantic.color.card.pressed | semantic.color.border.pressed | semantic.color.onSurface.default | 80% | Pressed state |
| disabled | semantic.color.card.disabled | semantic.color.border.disabled | semantic.color.onSurface.disabled | 50% | Disabled state |
| active | semantic.color.primary.default + 15% opacity | semantic.color.primary.default | semantic.color.primary.default | 100% | Selected/active state |

---

## COMPOSITION

### Child Components

| Component | Usage | Required |
|-----------|-------|----------|
| IconSymbol | Icon display | No |
| Text | Text content | Yes |
| View/Row/Column | Layout containers | Yes |

### Layout Pattern

```
┌─────────────────────────────────────┐
│ [Icon] Title              [Badge]   │
│ [Icon] Subtitle                      │
│ [Icon] Value                         │
└─────────────────────────────────────┘
```

---

## ACCESSIBILITY

### Accessibility Properties

| Property | Value | Platform |
|----------|-------|----------|
| accessibilityLabel | Component description | Android: `contentDescription`, iOS: `.accessibilityLabel()` |
| accessibilityRole | "button" | Android: `role = Role.Button`, iOS: `.accessibilityAddTraits(.isButton)` |
| accessibilityState | selected/disabled | Android: `state`, iOS: `.accessibilityValue()` |

---

## PLATFORM-SPECIFIC NOTES

### Android

- Use `Modifier.clickable` for touch handling
- Use `Ripple indication` for feedback
- Use `MaterialTheme.colors` for color resolution
- Use `semantics` modifier for accessibility

### iOS

- Use `.onTapGesture` for touch handling
- Use `.buttonStyle` for feedback
- Use `Environment(\.colorScheme)` for theme resolution
- Use `.accessibility` modifiers for accessibility

---

## REFERENCES

- RN Source: `react-native/components/ui/route-leg-timeline.tsx`
- Token Schema: `tokens/semantic/semantic.tokens.json`
- Android Map: `.spec/prds/native-rewrite/08b-android-component-map.md`
- iOS Map: `.spec/prds/native-rewrite/08c-ios-component-map.md`
- Component Catalog: `.spec/prds/native-rewrite/08a-atomic-component-catalog.md`
