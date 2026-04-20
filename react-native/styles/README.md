# LaneShadow Design System - Constants & Theme

This directory contains the centralized design tokens and theme configuration for the LaneShadow app.

## Overview

The design system uses a **warm, nurturing, and playful aesthetic** perfect for a childcare/education platform. All colors use hex format for React Native compatibility. Design values are extracted from HTML mocks in `/specs/mocks/` to ensure pixel-perfect implementation.

## Files

- **`theme.ts`** - Main theme configuration with semantic tokens
- **`layout.ts`** - Shared layout constants for consistent positioning
- **`TOKEN_VALUE_MAPPING.md`** - Detailed mapping of token values (before/after)

## Color System

### Brand Identity

Our primary brand color is a **warm sunset orange** (`#EE7C2B`), paired with:
- **Soft sky blue** secondary (`#C7DEEE`)
- **Gentle green** accent (`#88C7A6`)
- **Light warm gray** backgrounds (`#F8F7F6` light, `#221810` dark)

**Design Source**: HTML mocks use consistent Tailwind config with `primary: #ee7c2b`

### Color Roles

All colors support interactive states: `default`, `hover`, `pressed`, `disabled`, and `focus`.

```typescript
import { useSemanticTheme } from '@/hooks/use-semantic-theme'

const { semantic } = useSemanticTheme()

// Primary actions - warm orange (from HTML mocks)
semantic.color.primary.default  // #EE7C2B
semantic.color.primary.hover    // #F29A5B
semantic.color.primary.pressed  // #D96A1F

// Secondary actions - soft blue
semantic.color.secondary.default  // #C7DEEE

// Accent - gentle green
semantic.color.accent.default  // #88C7A6

// Surfaces
semantic.color.background.default  // #F8F7F6 - light warm gray (from mocks)
semantic.color.surface.default     // #FFFFFF - pure white
semantic.color.card.default        // #FFFFFF - pure white

// Text colors (from HTML mocks)
semantic.color.onSurface.default  // #1E1E1E - very dark gray
semantic.color.onSurface.muted    // #49454F - medium gray
semantic.color.onSurface.subtle   // #6B7280 - gray-500
semantic.color.onPrimary.default  // #FFFFFF - white on primary

// Intent colors
semantic.color.success.default  // #31A362 - green
semantic.color.warning.default  // #F5A247 - amber/orange
semantic.color.danger.default   // #E85757 - coral red
semantic.color.info.default     // #2B9AEB - blue

// UI elements
semantic.color.border.default  // #E5DED9 - light warm border
semantic.color.input.default   // #F2EFED - light warm input
semantic.color.ring.default    // #EE7C2B - primary focus ring
```

### Dark Mode

Dark mode automatically adjusts colors for optimal contrast (from HTML mocks):

```typescript
// Dark mode adjustments (from mocks)
semantic.color.background.default  // #221810 - dark warm brown
semantic.color.surface.default     // #2D2218 - dark card
semantic.color.primary.default     // #EE7C2B - same warm orange
semantic.color.onSurface.default   // #E3E3E3 - light gray text
semantic.color.onSurface.muted     // #CAC4D0 - muted gray text
```

## Typography System

### Scale

The typography system uses six categories with three sizes each:

```typescript
const { semantic } = useSemanticTheme()

// Display - Hero text
semantic.type.display.lg  // 57/64, weight 400
semantic.type.display.md  // 45/52, weight 400
semantic.type.display.sm  // 36/44, weight 400

// Heading - Section titles
semantic.type.heading.lg  // 20/28, weight 600
semantic.type.heading.md  // 18/27, weight 600 (section titles)
semantic.type.heading.sm  // 16/24, weight 600

// Title - Component titles
semantic.type.title.lg  // 24/32, weight 700 (page titles)
semantic.type.title.md  // 16/24, weight 600 (card titles)
semantic.type.title.sm  // 14/20, weight 600

// Body - Paragraph text
semantic.type.body.lg  // 16/24, weight 400
semantic.type.body.md  // 16/24, weight 400 (regular text)
semantic.type.body.sm  // 14/21, weight 400 (small text)

// Label - UI labels and buttons
semantic.type.label.lg  // 14/20, weight 500
semantic.type.label.md  // 14/20, weight 500 (medium labels)
semantic.type.label.sm  // 12/18, weight 500 (buttons/labels)
```

### Usage Examples

```tsx
import { Text, View } from 'react-native'
import { useSemanticTheme } from '@/hooks/use-semantic-theme'

export const ExampleComponent = () => {
  const { semantic } = useSemanticTheme()
  
  return (
    <View>
      {/* Page title */}
      <Text style={{
        ...semantic.type.title.lg,
        color: semantic.color.onSurface.default
      }}>
        My Profile
      </Text>
      
      {/* Section heading */}
      <Text style={{
        ...semantic.type.heading.md,
        color: semantic.color.onSurface.default
      }}>
        Recent Activity
      </Text>
      
      {/* Card title */}
      <Text style={{
        ...semantic.type.title.md,
        color: semantic.color.onSurface.default
      }}>
        Emma
      </Text>
      
      {/* Body text */}
      <Text style={{
        ...semantic.type.body.md,
        color: semantic.color.onSurface.default
      }}>
        Emma showed amazing creativity today...
      </Text>
      
      {/* Meta text */}
      <Text style={{
        ...semantic.type.body.sm,
        color: semantic.color.onSurface.muted
      }}>
        Ms. Sarah • 2 hours ago
      </Text>
    </View>
  )
}
```

## Spacing System

Based on a 4px grid:

```typescript
semantic.space.xs   // 4px  - Tiny gaps
semantic.space.sm   // 8px  - Small gaps
semantic.space.md   // 12px - Medium gaps
semantic.space.lg   // 16px - Standard padding
semantic.space.xl   // 24px - Large padding
semantic.space['2xl']  // 32px - Extra large padding
semantic.space['3xl']  // 48px - Section spacing
semantic.space['4xl']  // 64px - Major section spacing
```

### Usage

```tsx
<View style={{
  padding: semantic.space.lg,        // 16px all sides
  marginBottom: semantic.space.md,   // 12px bottom margin
  gap: semantic.space.sm,            // 8px gap between children
}} />
```

## Border Radius

Aligned with HTML mock Tailwind config:

```typescript
semantic.radius.none  // 0px
semantic.radius.sm    // 4px  - Small elements, badges
semantic.radius.md    // 8px  - Buttons, inputs (0.5rem default in mocks)
semantic.radius.lg    // 16px - Cards, modals (1rem in mocks)
semantic.radius.xl    // 24px - Large cards (1.5rem in mocks)
semantic.radius['2xl']   // 32px - Extra large
semantic.radius.full  // 9999px - Circular (avatars, pills)
```

### Usage

```tsx
<View style={{
  borderRadius: semantic.radius.lg,  // 12px for cards
  borderRadius: semantic.radius.full, // circular for avatars
}} />
```

## Elevation (Shadows)

Six levels of elevation from 0 (flat) to 5 (maximum depth):

```typescript
semantic.elevation[0]  // No shadow
semantic.elevation[1]  // Minimal
semantic.elevation[2]  // Low
semantic.elevation[3]  // Medium
semantic.elevation[4]  // High
semantic.elevation[5]  // Maximum
```

### Usage

```tsx
<View style={{
  ...semantic.elevation[2],  // Apply shadow level 2
  backgroundColor: semantic.color.card.default,
  borderRadius: semantic.radius.lg,
}} />
```

## Complete Component Example

```tsx
import { View, Text, Pressable } from 'react-native'
import { useSemanticTheme } from '@/hooks/use-semantic-theme'

export const Card = ({ title, content, onPress }: CardProps) => {
  const { semantic } = useSemanticTheme()
  
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View style={{
          ...semantic.elevation[2],
          backgroundColor: pressed 
            ? semantic.color.card.pressed 
            : semantic.color.card.default,
          borderRadius: semantic.radius.lg,
          padding: semantic.space.lg,
          borderWidth: 1,
          borderColor: semantic.color.border.default,
          marginBottom: semantic.space.md,
        }}>
          <Text style={{
            ...semantic.type.title.md,
            color: semantic.color.onSurface.default,
            marginBottom: semantic.space.sm,
          }}>
            {title}
          </Text>
          <Text style={{
            ...semantic.type.body.sm,
            color: semantic.color.onSurface.muted,
          }}>
            {content}
          </Text>
        </View>
      )}
    </Pressable>
  )
}
```

## Design Principles

1. **Warmth** - Warm orange primary (#EE7C2B) creates a nurturing feel
2. **Clarity** - High contrast text ensures readability (WCAG AA compliant)
3. **Playfulness** - Rounded corners and gentle colors feel approachable
4. **Consistency** - All spacing uses 4px grid, all colors in hex format
5. **Accessibility** - Light/dark modes, sufficient contrast, touch targets
6. **Mock Fidelity** - Colors extracted directly from HTML mocks in `/specs/mocks/`

## Opacity Usage Patterns

The HTML mocks use consistent opacity patterns with the primary color:

```typescript
// In components, use these opacity suffixes:
semantic.color.primary.default + '1A'  // 10% - subtle backgrounds
semantic.color.primary.default + '33'  // 20% - selected states, badges
semantic.color.primary.default + '4D'  // 30% - borders
semantic.color.primary.default + '66'  // 40% - stronger borders
semantic.color.primary.default + '80'  // 50% - focus rings
semantic.color.primary.default + 'CC'  // 80% - header backdrop blur
```

## Migration Notes

- **No breaking changes** - All token keys remain the same
- **Values aligned with mocks** - Colors, spacing, and shadows match HTML mocks
- **Hex format** - All colors in hex for React Native compatibility
- **Type-safe** - TypeScript ensures correct usage
- **Automatic dark mode** - Theme switches based on device settings
- **Updated from mocks** - Primary: #EE7C2B, Backgrounds: #F8F7F6 / #221810

## Related Files

- `/hooks/use-semantic-theme.ts` - Hook to access theme
- `/types/theme.ts` - TypeScript type definitions
- `/constants/TOKEN_VALUE_MAPPING.md` - Detailed value mapping

## Resources

- [Material Design 3](https://m3.material.io/) - Base design system
- [React Native Paper](https://reactnativepaper.com/) - Component library
- [WCAG AA](https://www.w3.org/WAI/WCAG2AA-Conformance) - Accessibility standard

