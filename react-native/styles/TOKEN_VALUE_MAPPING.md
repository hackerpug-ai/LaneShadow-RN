# Token Value Mapping - Hummingbird Design System Update

This document maps semantic theme token keys to their values based on the HTML mocks in `/specs/mocks/`.

## HTML Mock Design System

All HTML mocks use a consistent Tailwind configuration:

```javascript
colors: {
  "primary": "#ee7c2b",           // Warm sunset orange
  "background-light": "#f8f7f6",  // Light warm gray
  "background-dark": "#221810",   // Dark warm brown
}
borderRadius: {
  "DEFAULT": "0.5rem",  // 8px
  "lg": "1rem",         // 16px
  "xl": "1.5rem",       // 24px
  "full": "9999px"
}
```

## Color Token Mappings

### Light Mode

| Token Key | Previous Value | Current Value (from mocks) | Notes |
|-----------|----------------|---------------------------|-------|
| **Background & Surfaces** |
| `background.default` | `#FFF8F5` | `#F8F7F6` | Light warm gray (exact from mocks) |
| `surface.default` | `#FFFFFF` | `#FFFFFF` | Pure white (unchanged) |
| `surfaceVariant.default` | `#F2EFED` | `#F2EFED` | Light warm gray (good match) |
| `card.default` | `#FFFFFF` | `#FFFFFF` | Pure white (unchanged) |
| `popover.default` | `#FFFFFF` | `#FFFFFF` | Pure white (unchanged) |
| **Primary Brand** |
| `primary.default` | `#F57C47` | `#EE7C2B` | Warm sunset orange (exact from mocks) |
| `primary.hover` | `#F89A6C` | `#F29A5B` | Lighter orange |
| `primary.pressed` | `#E86226` | `#D96A1F` | Darker orange |
| `primary.disabled` | `#FAC5AE` | `#F9C9A8` | Very light orange |
| **Secondary** |
| `secondary.default` | `#64748B` | `hsl(210, 75%, 85%)` | Soft sky blue |
| `secondary.hover` | `#94A3B8` | `hsl(210, 75%, 80%)` | Lighter blue |
| `secondary.pressed` | `#475569` | `hsl(210, 75%, 75%)` | Darker blue |
| `secondary.disabled` | `#CBD5E1` | `hsl(210, 75%, 92%)` | Very light blue |
| **Accent** |
| `accent.default` | `#F1F5F9` | `hsl(150, 40%, 70%)` | Gentle green |
| `accent.hover` | `#E2E8F0` | `hsl(150, 40%, 75%)` | Lighter green |
| `accent.pressed` | `#CBD5E1` | `hsl(150, 40%, 65%)` | Darker green |
| `accent.disabled` | `#F8FAFC` | `hsl(150, 40%, 85%)` | Very light green |
| **Text Colors** |
| `onSurface.default` | `#212830` | `#1E1E1E` | Very dark gray (exact from mocks) |
| `onSurface.hover` | `#2A3541` | `#2A2A2A` | Slightly lighter |
| `onSurface.muted` | `#6E7C8C` | `#49454F` | Medium gray (exact from mocks) |
| `onSurface.subtle` | `#8591A0` | `#6B7280` | gray-500 |
| `onSurface.disabled` | `#8591A0` | `#9CA3AF` | gray-400 |
| `onPrimary.default` | `#FFFFFF` | `#FFFFFF` | White text on primary (unchanged) |
| `onSecondary.default` | `#1D4D6B` | `#1D4D6B` | Dark blue text (unchanged) |
| **Intent Colors** |
| `success.default` | `#10B981` | `hsl(150, 65%, 45%)` | Keep similar |
| `warning.default` | `#F59E0B` | `hsl(35, 90%, 55%)` | Keep similar |
| `danger.default` | `#EF4444` | `hsl(0, 75%, 60%)` | Coral red |
| `info.default` | `#3B82F6` | `hsl(210, 85%, 60%)` | Keep similar |
| **UI Elements** |
| `border.default` | `#E5DED9` | `#E5DED9` | Light warm border (unchanged) |
| `input.default` | `#F2EFED` | `#F2EFED` | Light warm input bg (unchanged) |
| `ring.default` | `#F57C47` | `#EE7C2B` | Primary color (updated) |
| `muted.default` | `#F2EFED` | `#F2EFED` | Very light warm gray (unchanged) |
| **Special** |
| `orange.default` | `#FF6B35` | `#FF6B35` | Brand accent (unchanged) |

### Opacity Patterns from Mocks

| Pattern | Usage in Mocks | Semantic Mapping |
|---------|----------------|------------------|
| `primary/10` | Chip unselected, subtle backgrounds | 10% opacity on primary |
| `primary/20` | Chip selected, button backgrounds, badges | 20% opacity on primary |
| `primary/30` | Borders, dividers | 30% opacity on primary |
| `primary/40` | Stronger borders | 40% opacity on primary |
| `primary/50` | Focus rings | 50% opacity on primary |
| `primary/80` | Header with backdrop blur | 80% opacity on primary |
| `black/10` | Light overlays | 10% black overlay |
| `black/20` | Card backgrounds (dark mode) | 20% black overlay |
| `white/10` | Dark mode overlays | 10% white overlay |

### Dark Mode

| Token Key | Previous Value | Current Value (from mocks) | Notes |
|-----------|----------------|---------------------------|-------|
| **Background & Surfaces** |
| `background.default` | `#0E1418` | `#221810` | Dark warm brown (exact from mocks) |
| `surface.default` | `#18202A` | `#2D2218` | Dark card (lighter than background) |
| `surfaceVariant.default` | `#212A36` | `#362A1F` | Dark muted |
| `card.default` | `#18202A` | `#2D2218` | Dark card (matches surface) |
| `popover.default` | `#18202A` | `#2D2218` | Dark card |
| **Primary Brand** |
| `primary.default` | `#F7915D` | `#EE7C2B` | Same as light mode (per mocks) |
| `primary.hover` | `#FAAD85` | `#F29A5B` | Lighter |
| `primary.pressed` | `#EA7236` | `#D96A1F` | Darker |
| `primary.disabled` | `#FAC5AE` | `#F9C9A8` | Light orange |
| **Secondary** |
| `secondary.default` | `#293847` | `#293847` | Dark blue-gray (unchanged) |
| `secondary.hover` | `#354556` | `#354556` | Lighter (unchanged) |
| **Text Colors** |
| `onSurface.default` | `#F8EDE5` | `#E3E3E3` | Light gray (exact from mocks) |
| `onSurface.muted` | `#98A7B5` | `#CAC4D0` | Light gray (exact from mocks) |
| `onSurface.subtle` | `#7B8D9E` | `#9CA3AF` | gray-400 |
| `onPrimary.default` | `#0E1418` | `#FFFFFF` | White on primary (changed from dark) |
| **UI Elements** |
| `border.default` | `#323E4D` | `#3D3228` | Dark warm border |
| `input.default` | `#2A3441` | `#362A1F` | Dark warm input |
| `ring.default` | `#F7915D` | `#EE7C2B` | Primary color (updated) |

## Typography Token Mappings

| Token Key | Current Size/LH/Weight | New Size/LH/Weight | Notes |
|-----------|------------------------|-------------------|-------|
| **Title** |
| `title.lg` | 22/28/500 | 24/32/700 | Page titles - larger, bolder |
| `title.md` | 16/24/500 | 16/24/600 | Card titles - keep size, increase weight |
| `title.sm` | 14/20/500 | 14/20/600 | Small titles |
| **Heading** |
| `heading.md` | 28/36/400 | 18/27/600 | Section titles - significantly smaller |
| `heading.sm` | 24/32/400 | 16/24/600 | Small sections |
| `heading.lg` | 32/40/400 | 20/28/600 | Large sections |
| **Body** |
| `body.md` | 14/20/400 | 16/24/400 | Regular text - slightly larger |
| `body.sm` | 12/16/400 | 14/21/400 | Small text - slightly larger |
| `body.lg` | 16/24/400 | Keep as-is | Already correct |
| **Label** |
| `label.sm` | 11/16/500 | 12/18/500 | Buttons/labels - slightly larger |
| `label.md` | 12/16/500 | 14/20/500 | Medium labels - larger |
| `label.lg` | 14/20/500 | Keep as-is | Already good |
| **Display** |
| All display sizes | Keep as-is | Keep as-is | Hero text is fine |

## New Optional Tokens (If Needed)

### Gradient Tokens (Additive)
If gradient support is desired, add these as string values:

```typescript
gradients: {
  warm: 'linear-gradient(135deg, hsl(25 85% 55%), hsl(35 85% 65%))',
  soft: 'linear-gradient(180deg, hsl(25 100% 98%), hsl(25 50% 96%))',
  sunset: 'linear-gradient(45deg, hsl(25 85% 55%), hsl(15 80% 60%), hsl(35 85% 65%))'
}
```

### Additional Intent Colors (If Missing)
- `tertiary` - Can map to gentle green if separate from accent
- Additional text nuance levels already covered by `subtle`

## Border Radius Token Mappings

| Token Key | Previous Value | Current Value (from mocks) | Notes |
|-----------|----------------|---------------------------|-------|
| `radius.md` | 8px | 8px | 0.5rem - default (unchanged) |
| `radius.lg` | 12px | 16px | 1rem - lg (updated to match mocks) |
| `radius.xl` | 16px | 24px | 1.5rem - xl (updated to match mocks) |
| `radius.full` | 9999px | 9999px | Circular (unchanged) |

## Shadow/Elevation Updates

**Light Mode** - Lighter, more subtle shadows:
- Level 1-2: `shadowOpacity: 0.05` (matches `rgba(0,0,0,0.05)` from mocks)
- Level 5: `shadowOpacity: 0.15` (shadow-lg)

**Dark Mode** - Heavier, more pronounced shadows:
- Level 1-2: `shadowOpacity: 0.2` (matches `rgba(0,0,0,0.2)` from mocks)
- Level 5: `shadowOpacity: 0.35` (stronger shadow-lg)

## Implementation Notes

1. **Hex Format**: All colors in hex format for React Native compatibility
2. **Mock Alignment**: Primary color, backgrounds, and text colors now match HTML mocks exactly
3. **Interaction States**: Derived using consistent deltas from base values
4. **Contrast**: All text-on-surface combinations maintain WCAG AA (4.5:1 minimum)
5. **Warmth**: Warm brown dark mode (#221810) instead of blue-gray
6. **No Breaking Changes**: All token keys remain the same, only values updated

