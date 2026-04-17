## **COMPONENT LIBRARY STATUS**

### Implemented Components

All atomic UI components have been successfully implemented following the design system specifications:

| Component | File | Status | Description |
|-----------|------|--------|-------------|
| **Button** | `button.tsx` | ✅ Complete | Multiple variants (default, secondary, outline, ghost, destructive, link), 3 sizes + icon-only |
| **Input** | `input.tsx` | ✅ Complete | Text input with focus states, error handling, and semantic theming |
| **Textarea** | `textarea.tsx` | ✅ Complete | Multi-line text input with 80px minimum height |
| **Avatar** | `avatar.tsx` | ✅ Complete | 3 sizes with image support, initials fallback, status badges |
| **Badge** | `badge.tsx` | ✅ Complete | Pill-shaped labels with 6 variants and icon support |
| **Card** | `card.tsx` | ✅ Complete | Container with compound components (Header, Title, Content, Description) |
| **Separator** | `separator.tsx` | ✅ Complete | Horizontal and vertical dividers |
| **Switch** | `switch.tsx` | ✅ Complete | Animated toggle control with semantic theming |
| **Checkbox** | `checkbox.tsx` | ✅ Complete | Checkbox with checkmark, supports indeterminate state |
| **Slider** | `slider.tsx` | ✅ Complete | Custom range slider with pan gesture support |
| **Toggle** | `toggle.tsx` | ✅ Complete | Toggle button with default and outline variants |
| **Toggle Group** | `toggle-group.tsx` | ✅ Complete | Container for toggle buttons with single/multiple selection |
| **Progress** | `progress.tsx` | ✅ Complete | Progress bar with determinate and indeterminate modes |
| **Skeleton** | `skeleton.tsx` | ✅ Complete | Loading placeholders with pulse animation |
| **AppHeader** | `app-header.tsx` | ✅ Complete | Reusable header with left/center/right slots, icon or avatar support |
| **FAB** | `fab.tsx` | ✅ Complete | Floating Action Button wrapper (React Native Paper) with semantic theme |
| **Chip** | `chip.tsx` | ✅ Complete | Chip wrapper (React Native Paper) with selected states and semantic theme |
| **Banner** | `banner.tsx` | ✅ Complete | Banner wrapper (React Native Paper) for alerts/notices with semantic theme |
| **DrawerMenu** | `drawer-menu.tsx` | ✅ Complete | Reusable slide-out drawer menu that pushes content right |

### Usage Example

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useSemanticTheme } from '@/hooks/use-semantic-theme'

export const MyComponent = () => {
  const { semantic } = useSemanticTheme()
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default" onPress={() => console.log('Pressed')}>
          Click Me
        </Button>
      </CardContent>
    </Card>
  )
}
```

### Component Architecture

All components follow these standards:
- ✅ Use `useSemanticTheme()` hook exclusively (no hardcoded values)
- ✅ StyleSheet.create() for static layout + inline semantic values
- ✅ Support interactive states (default, hover, pressed, disabled, focus)
- ✅ Named exports only (no default exports)
- ✅ TypeScript strict mode with explicit return types
- ✅ Accessibility props support (accessibilityLabel, accessibilityRole, etc.)
- ✅ Automatic light/dark mode support via semantic theme

---

## **1. DESIGN PHILOSOPHY**

### Core Principles
- **Warm & Approachable**: Use soft colors and rounded elements to create a welcoming, non-intimidating interface
- **Clear & Efficient**: Prioritize clarity and quick comprehension for busy parents and teachers
- **Trust & Safety**: Visual indicators for important information (allergies, medical notes) with appropriate urgency levels
- **Playful Yet Professional**: Balance childlike wonder with professional competence
- **Mobile-First**: Designed primarily for mobile devices with touch-friendly interactions

### Visual Personality
- **Nurturing Warmth**: Sunset oranges and soft gradients
- **Gentle Comfort**: Rounded corners and soft shadows throughout
- **Clear Communication**: High contrast text, distinct status indicators
- **Subtle Delight**: Smooth transitions and thoughtful micro-interactions

---

## **2. COLOR SYSTEM**

### 2.1 Primary Color Palette

#### **Light Mode**
| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--primary` | `25 85% 55%` | Main brand color - warm sunset orange |
| `--primary-light` | `25 85% 70%` | Hover states, lighter accents |
| `--primary-dark` | `25 85% 45%` | Active states, pressed buttons |
| `--primary-foreground` | `0 0% 100%` | Text on primary backgrounds |

#### **Dark Mode**
| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--primary` | `25 85% 60%` | Main brand color (slightly brighter) |
| `--primary-light` | `25 85% 75%` | Hover states, lighter accents |
| `--primary-dark` | `25 85% 50%` | Active states, pressed buttons |
| `--primary-foreground` | `210 25% 8%` | Text on primary backgrounds |

### 2.2 Secondary Colors

#### **Light Mode**
| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--secondary` | `210 75% 85%` | Soft sky blue for secondary actions |
| `--secondary-dark` | `210 60% 65%` | Darker secondary for hover/active |
| `--secondary-foreground` | `210 60% 25%` | Text on secondary backgrounds |

#### **Dark Mode**
| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--secondary` | `210 25% 20%` | Muted secondary for dark mode |
| `--secondary-dark` | `210 25% 15%` | Darker secondary variant |
| `--secondary-foreground` | `25 50% 95%` | Text on secondary backgrounds |

### 2.3 Accent & Support Colors

#### **Light Mode**
| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--accent` | `150 40% 70%` | Gentle green for positive actions |
| `--accent-foreground` | `150 60% 25%` | Text on accent backgrounds |
| `--destructive` | `0 75% 60%` | Error states, warnings, delete actions |
| `--destructive-foreground` | `0 0% 100%` | Text on destructive backgrounds |

### 2.4 Neutral Colors

#### **Light Mode**
| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--background` | `25 100% 98%` | Main app background (warm white) |
| `--foreground` | `210 20% 15%` | Primary text color |
| `--card` | `0 0% 100%` | Card backgrounds |
| `--muted` | `25 25% 95%` | Disabled states, subtle backgrounds |
| `--muted-foreground` | `210 15% 50%` | Secondary text, placeholders |
| `--border` | `25 20% 90%` | Dividers and borders |
| `--input` | `25 20% 95%` | Input field backgrounds |

#### **Dark Mode**
| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--background` | `210 25% 8%` | Main app background (dark blue-gray) |
| `--foreground` | `25 50% 95%` | Primary text color |
| `--card` | `210 20% 12%` | Card backgrounds |
| `--muted` | `210 20% 15%` | Disabled states, subtle backgrounds |
| `--muted-foreground` | `210 15% 65%` | Secondary text, placeholders |
| `--border` | `210 20% 20%` | Dividers and borders |
| `--input` | `210 20% 18%` | Input field backgrounds |

### 2.5 Semantic Status Colors

**Attendance States:**
- ✅ **Present**: `text-green-600` / `bg-green-100`
- ⏰ **Late**: `text-amber-600` / `bg-amber-100`
- ❌ **Absent**: `text-red-600` / `bg-red-100`

**Alert Levels:**
- 🚨 **Critical (Allergies)**: `bg-destructive` with `text-destructive-foreground`
- 💊 **Medical Info**: `border-amber-500` with `text-amber-700`
- ⚠️ **Attention Needed**: `text-amber-500` with `bg-amber-50`

**Post/Activity Status:**
- **Has Post**: `bg-green-500` (3px dot indicator)
- **No Post**: `bg-gray-300` (3px dot indicator)

### 2.6 Gradients

#### **Gradient Tokens**
```css
--gradient-warm: linear-gradient(135deg, hsl(25 85% 55%), hsl(35 85% 65%))
--gradient-soft: linear-gradient(180deg, hsl(25 100% 98%), hsl(25 50% 96%))
--gradient-sunset: linear-gradient(45deg, hsl(25 85% 55%), hsl(15 80% 60%), hsl(35 85% 65%))
```

**Usage Guidelines:**
- `gradient-warm`: Primary CTAs, progress indicators, highlighted status cards
- `gradient-soft`: Page backgrounds, subtle section dividers
- `gradient-sunset`: Hero sections, important announcements, celebration states

---

## **3. ELEVATION & SHADOWS**

### 3.1 Shadow System

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-soft` | `0 4px 20px -8px hsl(25 85% 55% / 0.15)` | Cards, floating elements |
| `--shadow-warm` | `0 8px 30px -12px hsl(25 85% 55% / 0.25)` | Modals, elevated cards, hover states |
| `--shadow-glow` | `0 0 40px hsl(25 85% 70% / 0.3)` | Active selections, focus states |

### 3.2 Elevation Hierarchy
1. **Base (0dp)**: Background color, no shadow
2. **Resting (2dp)**: Cards use `shadow-soft`
3. **Raised (4dp)**: Hovered cards use `shadow-warm`
4. **Modal (8dp)**: Dialogs, sheets use `shadow-warm` + `backdrop-blur`
5. **Floating (12dp)**: FABs, tooltips use `shadow-glow`

### 3.3 Special Effects
- **Frosted Glass**: Header/navigation uses `bg-background/95 backdrop-blur-md`
- **Subtle Gradient Overlays**: Image cards use `bg-gradient-to-t from-black/60 via-transparent`
- **Status Rings**: Selected highlights use `ring-2 ring-primary ring-offset-2`

---

## **4. TYPOGRAPHY**

### 4.1 Font System
- **Primary Font**: System font stack (Tailwind default)
  - `font-sans: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`
- **Font Weights**: 
  - Regular: `font-normal` (400)
  - Medium: `font-medium` (500)
  - Semi-Bold: `font-semibold` (600)
  - Bold: `font-bold` (700)

### 4.2 Type Scale

| Element | Class | Size | Line Height | Weight | Usage |
|---------|-------|------|-------------|--------|-------|
| **Page Title** | `text-2xl` | 24px | 32px | Bold | Main page headings |
| **Card Title** | `text-xl` | 20px | 28px | Bold | Card headers, modal titles |
| **Section Header** | `text-lg` | 18px | 28px | Semi-Bold | Section dividers |
| **Body Large** | `text-base` | 16px | 24px | Regular | Primary content |
| **Body** | `text-sm` | 14px | 20px | Regular | Secondary content, labels |
| **Caption** | `text-xs` | 12px | 16px | Medium | Metadata, badges, timestamps |
| **Micro** | `text-xs` | 11px | 14px | Medium | Icon labels, tiny details |

### 4.3 Text Color Hierarchy

| Usage | Light Mode Class | Dark Mode Class |
|-------|-----------------|-----------------|
| **Primary Text** | `text-foreground` | `text-foreground` |
| **Secondary Text** | `text-muted-foreground` | `text-muted-foreground` |
| **Tertiary/Metadata** | `text-foreground/80` | `text-foreground/80` |
| **Disabled** | `text-muted-foreground/50` | `text-muted-foreground/50` |
| **On Color Backgrounds** | `text-primary-foreground` | `text-primary-foreground` |

### 4.4 Text Styles

- **Truncation**: `truncate` (single line), `line-clamp-2` (two lines)
- **Letter Spacing**: Default (system), tighter for all-caps: `tracking-tight`
- **Leading**: `leading-relaxed` for long-form content, `leading-none` for labels
- **Alignment**: Left-aligned default, `text-center` for empty states and stats

---

## **5. SPACING SYSTEM**

### 5.1 Base Unit
- **Foundation**: 4px base unit (Tailwind default)
- **Scale**: `0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64`

### 5.2 Component Spacing Patterns

#### **Cards**
- Padding: `p-4` (16px all sides)
- Inner content spacing: `space-y-3` (12px vertical gaps)
- Hover state: `hover:shadow-soft`

#### **Modals/Sheets**
- Content padding: `p-4` to `p-6`
- Header spacing: `pb-0` (no bottom padding on header)
- Section gaps: `space-y-4`

#### **Lists & Grids**
- List item gap: `gap-3` (12px)
- Grid gap: `gap-2` (8px for dense grids), `gap-3` (12px for comfortable)
- Section margins: `my-6` (24px vertical)

#### **Form Elements**
- Label-to-input: `space-y-2` (8px)
- Form field groups: `space-y-4` (16px)
- Button groups: `space-x-2` (8px horizontal)

#### **Page Layout**
- Container padding: `px-4 py-4` (16px sides and top/bottom)
- Max width: `max-w-md mx-auto` (448px centered)
- Bottom navigation spacing: `pb-20` (80px to clear fixed nav)

---

## **6. BORDER RADIUS**

### 6.1 Radius Tokens
```css
--radius: 0.5rem (8px)
```

### 6.2 Radius Scale

| Usage | Class | Value | Application |
|-------|-------|-------|-------------|
| **Large** | `rounded-lg` | 8px | Cards, modals, main containers |
| **Medium** | `rounded-md` | 6px | Buttons, inputs, badges |
| **Small** | `rounded-sm` | 4px | Small buttons, toggles |
| **Full** | `rounded-full` | 9999px | Avatars, pills, indicators, dots |

### 6.3 Component-Specific Radius

- **Avatars**: Always `rounded-full`
- **Cards**: `rounded-lg` with optional `overflow-hidden` for image cards
- **Buttons**: `rounded-md` (default), `rounded-full` for FABs and icon-only
- **Badges**: `rounded-full` for pills, `rounded-md` for rectangular tags
- **Inputs**: `rounded-md` for consistency with buttons
- **Image Containers**: `rounded-lg overflow-hidden` with `aspect-square` for photo grids

---

## **7. ATOMIC COMPONENT SPECIFICATIONS**

### 7.1 Button

#### **Visual Specs**
- **Default Height**: 40px (`h-10`)
- **Small Height**: 36px (`h-9`)
- **Large Height**: 44px (`h-11`)
- **Icon-Only Size**: 40×40px (`h-10 w-10`)
- **Border Radius**: `rounded-md`
- **Padding**: Horizontal `px-4` (default), `px-3` (small), `px-8` (large)
- **Font**: `text-sm font-medium`
- **Gap**: `gap-2` (8px between icon and text)

#### **Variants & Colors**

**Default (Primary)**
- Background: `bg-primary`
- Text: `text-primary-foreground`
- Hover: `hover:bg-primary/90` (10% transparency)
- Focus: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`

**Secondary**
- Background: `bg-secondary`
- Text: `text-secondary-foreground`
- Hover: `hover:bg-secondary/80`

**Outline**
- Border: `border border-input`
- Background: `bg-background`
- Hover: `hover:bg-accent hover:text-accent-foreground`

**Ghost**
- Background: Transparent
- Hover: `hover:bg-accent hover:text-accent-foreground`

**Destructive**
- Background: `bg-destructive`
- Text: `text-destructive-foreground`
- Hover: `hover:bg-destructive/90`

**Link**
- Background: Transparent
- Text: `text-primary`
- Decoration: `underline-offset-4 hover:underline`

#### **States**
- **Disabled**: `disabled:pointer-events-none disabled:opacity-50`
- **Active/Pressed**: Slightly darker via `:active` pseudo-state
- **Focus**: Prominent ring with offset

#### **Icon Handling**
- SVG sizing: `[&_svg]:size-4` (16px)
- Icon color: Inherits text color
- Icon placement: Auto-gap via `gap-2`

---

### 7.2 Input & Textarea

#### **Input Visual Specs**
- **Height**: 40px (`h-10`)
- **Padding**: `px-3 py-2`
- **Border**: `border border-input`
- **Border Radius**: `rounded-md`
- **Background**: `bg-background`
- **Font**: `text-base md:text-sm` (16px mobile, 14px desktop)
- **Ring Offset**: `ring-offset-background`

#### **Textarea Visual Specs**
- **Min Height**: 80px (`min-h-[80px]`)
- **Padding**: `px-3 py-2`
- **Font**: `text-sm`
- All other properties match Input

#### **States**
- **Default**: `border-input`
- **Focus**: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- **Disabled**: `disabled:cursor-not-allowed disabled:opacity-50`
- **Placeholder**: `placeholder:text-muted-foreground`

---

### 7.3 Avatar

#### **Visual Specs**
- **Default Size**: 40×40px (`h-10 w-10`)
- **Large Size**: 64×64px (`h-16 w-16`)
- **Extra Large**: 96×96px (`h-24 w-24`)
- **Shape**: Always `rounded-full`
- **Overflow**: `overflow-hidden` to clip images
- **Fallback Background**: `bg-muted`
- **Fallback Text**: Centered initials in `text-foreground`

#### **Border Treatment**
- Optional border: `border-2 border-border/20`
- Dashed border for "add new": `border-2 border-dashed border-border/40`

#### **Status Indicators**
- **Alert Badge**: Position `absolute -top-1 -right-1`, size `h-5 w-5 rounded-full`
- **Active Ring**: `ring-2 ring-primary ring-offset-2`
- **Checkmark**: White checkmark on primary background badge

---

### 7.4 Badge

#### **Visual Specs**
- **Shape**: `rounded-full` (pill-shaped)
- **Padding**: `px-2.5 py-0.5`
- **Font**: `text-xs font-semibold`
- **Border**: `border` (variant-dependent)

#### **Variants**

**Default**
- Background: `bg-primary`
- Text: `text-primary-foreground`
- Border: Transparent

**Secondary**
- Background: `bg-secondary`
- Text: `text-secondary-foreground`
- Hover: `hover:bg-secondary/80`

**Destructive**
- Background: `bg-destructive`
- Text: `text-destructive-foreground`
- Usage: Allergy alerts, critical warnings

**Outline**
- Background: Transparent
- Text: `text-foreground`
- Border: `border-current`
- Usage: Medical notes, less critical info

#### **Icon Integration**
- Leading emoji: `🚨`, `💊`, `⚕️` placed before text
- No gap class needed (emoji spacing is natural)

---

### 7.5 Card

#### **Visual Specs**
- **Background**: `bg-card`
- **Text**: `text-card-foreground`
- **Border**: `border border-border` (optional, can be removed)
- **Border Radius**: `rounded-lg`
- **Shadow**: `shadow-soft` (on hover: `hover:shadow-warm`)
- **Transitions**: `transition-all` for smooth hover effects

#### **Layout Patterns**

**Standard Card**
```
Card (rounded-lg)
└── CardHeader (optional)
│   └── CardTitle (text-lg font-semibold)
└── CardContent (p-4)
    └── Content with space-y-3
```

**Compact Card** (Student cards, photo cards)
```
Card (rounded-lg p-4)
└── Flex layout with gap-3
    ├── Avatar
    ├── Content (flex-1)
    └── Actions
```

**Image Card** (Gallery items)
```
Card (aspect-square overflow-hidden)
└── Image (object-cover)
└── Gradient Overlay (group-hover:opacity-100)
    └── Text Content (absolute bottom)
```

---

### 7.6 Switch

#### **Visual Specs**
- **Track Size**: 44×24px (`w-11 h-6`)
- **Thumb Size**: 20×20px (`h-5 w-5`)
- **Border Radius**: `rounded-full` (track and thumb)
- **Border**: `border-2 border-transparent`
- **Shadow**: `shadow-lg` on thumb

#### **States**
- **Unchecked**: Track `bg-input`, thumb at left
- **Checked**: Track `bg-primary`, thumb at right (`translate-x-5`)
- **Focus**: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- **Disabled**: `disabled:cursor-not-allowed disabled:opacity-50`

#### **Animation**
- Smooth transition on thumb: `transition-transform`
- Duration: ~200ms (Radix default)

---

### 7.7 Checkbox

#### **Visual Specs**
- **Size**: 16×16px (`h-4 w-4`)
- **Border Radius**: `rounded-sm`
- **Border**: `border border-primary`
- **Checkmark Icon**: Lucide `Check` at 16px
- **Checked Background**: `bg-primary`
- **Checked Text**: `text-primary-foreground`

#### **States**
- **Unchecked**: Border only, transparent background
- **Checked**: Filled with checkmark
- **Focus**: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- **Disabled**: `disabled:cursor-not-allowed disabled:opacity-50`

---

### 7.8 Slider

#### **Visual Specs**
- **Track Height**: 8px (`h-2`)
- **Track Background**: `bg-secondary`
- **Track Radius**: `rounded-full`
- **Range Fill**: `bg-primary` (absolute positioned)
- **Thumb Size**: 20×20px (`h-5 w-5`)
- **Thumb Shape**: `rounded-full`
- **Thumb Border**: `border-2 border-primary`
- **Thumb Background**: `bg-background`

#### **States**
- **Focus**: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- **Disabled**: `disabled:pointer-events-none disabled:opacity-50`

---

### 7.9 Progress Bar

#### **Visual Specs**
- **Container Height**: 16px (`h-4`)
- **Container Background**: `bg-secondary`
- **Container Radius**: `rounded-full`
- **Indicator Background**: `bg-primary`
- **Indicator Animation**: Smooth translate transform based on percentage

#### **Usage Patterns**
- Daily updates completion: Displayed in header with percentage
- Attendance tracking: Visual representation of present/absent ratio
- Task completion: Shows progress through required actions

---

### 7.10 Separator

#### **Visual Specs**
- **Horizontal**: `h-[1px] w-full`
- **Vertical**: `h-full w-[1px]`
- **Color**: `bg-border`
- **Margins**: Apply externally via `my-4` or `mx-4`

#### **Usage**
- Section dividers in settings
- Between list items when borders are too heavy
- Modal content separation

---

### 7.11 Skeleton

#### **Visual Specs**
- **Background**: `bg-muted`
- **Border Radius**: `rounded-md`
- **Animation**: `animate-pulse` (built-in Tailwind)
- **Sizing**: Match target element dimensions

#### **Common Patterns**
- Avatar skeleton: `h-10 w-10 rounded-full`
- Text line: `h-4 w-full` or `w-3/4` for varied widths
- Card skeleton: Full card dimensions with `p-4` and nested skeletons

---

### 7.12 Toggle & Toggle Group

#### **Toggle Visual Specs**
- **Default Height**: 40px (`h-10`)
- **Small**: 36px (`h-9`)
- **Large**: 44px (`h-11`)
- **Padding**: `px-3`
- **Border Radius**: `rounded-md`
- **Font**: `text-sm font-medium`

#### **Variants**
**Default**
- Background: Transparent
- Hover: `hover:bg-muted hover:text-muted-foreground`
- Active: `data-[state=on]:bg-accent data-[state=on]:text-accent-foreground`

**Outline**
- Border: `border border-input`
- Active: `data-[state=on]:bg-accent`

#### **Toggle Group Specs**
- Layout: `flex gap-1`
- Context provides variants/sizes to children
- Common use: View switchers, filter options

---

## **8. LAYOUT PATTERNS**

### 8.1 Page Container
```
Pattern: max-w-md mx-auto px-4 py-4
- Max width: 448px (mobile-optimized)
- Centered horizontally
- 16px side padding
- 16px top/bottom padding
- Bottom padding: pb-20 when fixed navigation present
```

### 8.2 Header (Sticky)
```
Structure:
- Position: sticky top-0 z-10
- Background: bg-card border-b
- Frosted effect: bg-background/95 backdrop-blur-md
- Content: max-w-md mx-auto p-4
- Height: Auto (typically 60-80px)
```

**Header Content Pattern:**
- Back button (left) + Title (center/left) + Actions (right)
- Role switcher in top-right
- Optional progress banner below title

### 8.3 Bottom Navigation
```
Structure:
- Position: fixed bottom-0 left-0 right-0
- Z-index: z-50
- Background: bg-card/95 backdrop-blur-lg
- Border: border-t border-border/50
- Height: 72px (including safe area)
- Grid: grid-cols-4 or grid-cols-5
```

**Nav Item Pattern:**
- Icon (18px) centered
- Label (text-xs) below icon
- Active state: bg-gradient-warm with text-primary-foreground
- Padding: py-3 px-2

### 8.4 Modal/Dialog
```
Structure:
- Max width: max-w-sm (384px) to max-w-md (448px)
- Padding: p-0 gap-0 (custom inner padding)
- Border radius: rounded-lg
- Shadow: shadow-warm
- Backdrop: backdrop-blur-sm
```

**Modal Content Pattern:**
```
Dialog
└── DialogContent (max-w-sm p-0)
    ├── Header (p-4 pb-0)
    │   └── Title + Close button
    ├── Content Area (p-4 space-y-3)
    └── Footer (p-4 pt-0)
        └── Action buttons
```

### 8.5 Grid Layouts

**Photo Gallery Grid**
```
grid grid-cols-3 gap-2
- 3 columns
- 8px gaps
- Square aspect ratio (aspect-square)
- Overflow hidden for images
```

**Student Cards / List Items**
```
grid gap-3
- Single column
- 12px gaps
- Full-width cards
```

**Quick Trackers**
```
grid grid-cols-3 gap-2
- 3 columns for balanced mobile layout
- 8px gaps
- Flexible height buttons (h-16 typical)
- Icon + label vertically stacked
```

### 8.6 Feed/Story Layout
```
Pattern:
- Vertical scroll container
- Cards with consistent spacing (space-y-4)
- Full-width cards with internal padding
- Optional sticky date headers
```

**Story Highlights Horizontal Scroll:**
```
- Container: px-4 py-3
- Flex layout: flex space-x-4 overflow-x-auto
- Scrollbar hidden: scrollbar-hide
- Item size: 64×64px avatars with labels
```

---

## **9. INTERACTIVE STATES**

### 9.1 Hover States
- **Cards**: `hover:shadow-soft` or `hover:shadow-warm`
- **Buttons**: 10-20% background transparency change
- **Images**: `group-hover:scale-105` (105% scale with parent group hover)
- **Links**: `hover:underline` for text links
- **Scale Effect**: `hover-scale` class applies `hover:scale-105`

### 9.2 Active/Pressed States
- **Buttons**: Darker version of color (primary-dark token)
- **Toggles**: Distinct `data-[state=on]` styling
- **Navigation**: Full background with `bg-gradient-warm`
- **Checkmarks**: Visual confirmation (✓ badge or indicator)

### 9.3 Focus States
- **All Interactive Elements**: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- **Ring Color**: Uses `--ring` token (matches primary)
- **Ring Offset**: 2px for clear separation from element
- **Keyboard Navigation**: Only shows on keyboard focus (`:focus-visible`)

### 9.4 Disabled States
- **Pointer Events**: `disabled:pointer-events-none`
- **Opacity**: `disabled:opacity-50` (50% transparency)
- **Cursor**: `disabled:cursor-not-allowed` (when pointer events not disabled)
- **Color**: No color change, just opacity

### 9.5 Loading States
- **Skeleton**: `animate-pulse` with `bg-muted`
- **Spinner**: Rotating icon with `animate-spin`
- **Progress**: Animated progress bar with smooth transitions

---

## **10. ANIMATIONS & TRANSITIONS**

### 10.1 Duration Scale
- **Instant**: 100ms (micro-interactions)
- **Fast**: 200ms (hover, focus, toggle)
- **Normal**: 300ms (modals, sheets, page transitions)
- **Slow**: 500ms (complex animations, page loads)

### 10.2 Easing Functions
- **ease-out**: Default for entrances
- **ease-in**: Exits
- **ease-in-out**: State changes
- **cubic-bezier**: Custom for specific needs

### 10.3 Common Animation Patterns

**Scale In** (used throughout)
```
@keyframes scale-in {
  from: opacity 0, scale(0.8), translateY(10px)
  to: opacity 1, scale(1), translateY(0)
}
Class: animate-scale-in
Duration: 200ms ease-out
```

**Fade In/Out**
```
transition-opacity duration-300
opacity-0 → opacity-100
```

**Slide Overlays**
```
Image hover overlays:
- Default: opacity-0
- Hover: opacity-100
- Duration: 200ms
- Transition: transition-opacity
```

**Accordion**
```
animate-accordion-down / animate-accordion-up
- Height transition from 0 to content-height
- Duration: 200ms ease-out
```

### 10.4 Micro-Interactions
- **Button Click**: Subtle scale-down to 98% on `:active`
- **Toggle Switch**: Smooth thumb translation with `transition-transform`
- **Checkbox Check**: Instant appearance (no delay for clarity)
- **Hover Scale**: 105% scale on cards and images
- **Status Dots**: No animation (instant color change for clarity)

---

## **11. ICON SYSTEM**

### 11.1 Icon Library
**Primary**: Lucide React (`lucide-react`)
- Clean, consistent 24px base size
- 2px stroke width default
- Designed for clarity at small sizes

### 11.2 Icon Sizes

| Context | Size Class | Pixels | Usage |
|---------|-----------|--------|-------|
| **Micro** | `size-3` | 12px | Tiny indicators, inline badges |
| **Small** | `size-4` | 16px | Buttons, list items, inline text |
| **Default** | `size-5` or `size-6` | 20-24px | Navigation, headers, standalone |
| **Large** | `size-8` | 32px | Empty states, feature highlights |
| **Hero** | `size-12` | 48px | Landing pages, major empty states |

### 11.3 Icon Colors
- **Inherit**: Default (follows text color)
- **Semantic**: `text-green-600`, `text-amber-600`, `text-red-600` for status
- **Muted**: `text-muted-foreground` for secondary icons
- **On Color**: `text-primary-foreground` when on colored backgrounds

### 11.4 Icon Placement
- **Before Text**: Auto gap-2 in buttons
- **After Text**: Manual gap with `ml-2`
- **Standalone**: Centered in icon-only buttons
- **In Badges**: Inline with text, no gap needed for emoji

### 11.5 Common Icons by Function
- **Navigation**: `Home`, `Calendar`, `MessageSquare`, `Users`, `Settings`
- **Actions**: `Plus`, `Edit`, `Trash2`, `Download`, `Upload`, `Send`
- **Status**: `CheckCircle`, `XCircle`, `Clock`, `AlertTriangle`, `Info`
- **Media**: `Camera`, `Image`, `Mic`, `Play`, `Pause`
- **UI Controls**: `ChevronDown`, `ChevronRight`, `X`, `Menu`, `Search`

---

## **12. RESPONSIVE DESIGN**

### 12.1 Breakpoints (Tailwind Defaults)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### 12.2 Mobile-First Strategy
**Default (Mobile: <640px)**
- Single column layouts
- Full-width cards
- Larger touch targets (minimum 44×44px)
- Simplified navigation
- Collapsible sections

**Tablet (md: 768px+)**
- Slightly increased max-width if needed
- More comfortable spacing
- Potential 2-column layouts for grids

**Desktop (lg: 1024px+)**
- Maintain mobile-optimized layout (centered container)
- Enhanced hover states
- Keyboard shortcuts enabled
- Larger modals if beneficial

### 12.3 Touch-Friendly Design
- **Minimum Target Size**: 44×44px for all interactive elements
- **Touch Gestures**: Swipe for navigation, pull-to-refresh
- **Thumb Zone**: Primary actions within bottom third of screen
- **Spacing**: Generous gaps between touch targets (minimum 8px)

### 12.4 Typography Responsiveness
- **Font Sizes**: Use `text-base md:text-sm` pattern for inputs (16px mobile to prevent zoom)
- **Line Heights**: Slightly larger on mobile for readability
- **Max Width**: Narrow for optimal reading (448px max)

---

## **13. ACCESSIBILITY**

### 13.1 Focus Management
- **Visible Focus Rings**: Always visible on keyboard navigation
- **Focus Order**: Logical tab order following visual hierarchy
- **Skip Links**: For long forms or complex layouts
- **Focus Trapping**: Modals trap focus within dialog

### 13.2 Color Contrast
- **Minimum Ratios**: 
  - Normal text: 4.5:1
  - Large text (18px+): 3:1
  - UI components: 3:1
- **Testing**: All color combinations verified against WCAG AA standards
- **High Contrast Mode**: Support system high contrast preferences

### 13.3 ARIA & Semantics
- **Landmark Roles**: Proper use of ``, ``, ``, ``
- **Button vs Link**: Buttons for actions, links for navigation
- **Hidden Text**: `sr-only` class for screen reader-only content
- **Live Regions**: Announcements use `role="alert"` or `aria-live`

### 13.4 Motion Preferences
- **Reduced Motion**: Respect `prefers-reduced-motion`
- **Fallback**: Instant transitions instead of animations
- **Critical Animations**: Keep essential feedback, remove decorative

---

## **14. DARK MODE**

### 14.1 Implementation
- **Method**: CSS custom properties with `.dark` class on root
- **Toggle**: User preference stored, system preference as fallback
- **Scope**: All color tokens have dark mode equivalents

### 14.2 Dark Mode Adjustments
- **Contrast Inversion**: Light backgrounds become dark, maintain readability
- **Reduced Shadows**: Lighter shadows with more transparency
- **Warmer Tones**: Slightly warmer primary colors for comfort
- **Border Subtlety**: More subtle borders in dark mode

### 14.3 Testing Checklist
- ✓ All text remains readable
- ✓ Focus indicators clearly visible
- ✓ Images have appropriate overlays
- ✓ Status colors maintain meaning
- ✓ No pure black backgrounds (use dark blue-gray)

---

## **15. PERFORMANCE & OPTIMIZATION**

### 15.1 Asset Loading
- **Images**: Lazy loading below fold, eager loading above
- **Placeholders**: Skeleton loaders or blur placeholders
- **Formats**: WebP with fallbacks, appropriate compression

### 15.2 Animation Performance
- **GPU Acceleration**: Use `transform` and `opacity` only
- **Will-Change**: Apply sparingly for complex animations
- **RequestAnimationFrame**: For smooth custom animations

### 15.3 Perceived Performance
- **Optimistic UI**: Show success immediately, rollback on error
- **Skeleton Screens**: Better than spinners for content loading
- **Instant Feedback**: All interactions have immediate visual response

---

## **16. QUICK REFERENCE**

### 16.1 Most Common Class Combinations

**Card Component:**
```
className="bg-card rounded-lg p-4 shadow-soft hover:shadow-warm transition-all"
```

**Primary Button:**
```
className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 font-medium text-sm"
```

**Avatar:**
```
className="h-10 w-10 rounded-full overflow-hidden"
```

**Badge (Alert):**
```
className="bg-destructive text-destructive-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold"
```

**Container:**
```
className="max-w-md mx-auto px-4 py-4"
```

**Modal Content:**
```
className="max-w-sm p-0 gap-0"
```

**Grid (Photos):**
```
className="grid grid-cols-3 gap-2"
```

**Section Spacing:**
```
className="space-y-6"  // Between major sections
className="space-y-3"  // Within components
className="space-y-2"  // Tight groupings
```

---

## **17. DESIGN TOKENS SUMMARY**

### 17.1 Color Tokens Reference
```css
/* Primary Brand */
--primary: 25 85% 55%
--primary-foreground: 0 0% 100%

/* Secondary */
--secondary: 210 75% 85%
--secondary-foreground: 210 60% 25%

/* Neutrals */
--background: 25 100% 98%
--foreground: 210 20% 15%
--muted: 25 25% 95%
--muted-foreground: 210 15% 50%

/* UI Elements */
--border: 25 20% 90%
--input: 25 20% 95%
--ring: 25 85% 55%

/* Gradients */
--gradient-warm: linear-gradient(135deg, hsl(25 85% 55%), hsl(35 85% 65%))
--gradient-soft: linear-gradient(180deg, hsl(25 100% 98%), hsl(25 50% 96%))
--gradient-sunset: linear-gradient(45deg, hsl(25 85% 55%), hsl(15 80% 60%), hsl(35 85% 65%))

/* Shadows */
--shadow-soft: 0 4px 20px -8px hsl(25 85% 55% / 0.15)
--shadow-warm: 0 8px 30px -12px hsl(25 85% 55% / 0.25)
--shadow-glow: 0 0 40px hsl(25 85% 70% / 0.3)

/* Spacing Base */
--radius: 0.5rem
```

### 17.2 Component Sizing Reference
```
Button Heights: 36px (sm), 40px (default), 44px (lg)
Input Height: 40px
Avatar Sizes: 40px (default), 64px (lg), 96px (xl)
Badge Height: ~24px (auto)
Switch: 44×24px
Checkbox: 16×16px
Icon Sizes: 12px, 16px, 20px, 24px, 32px, 48px
```

