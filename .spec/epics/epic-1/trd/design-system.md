# TRD Addendum: Design System Specifications

**Status**: Reference Document (Non-Breaking)
**Derived From**: Design mockups in `../designs/mocks/`

---

## Overview

This document specifies the reusable UI components, patterns, and design tokens derived from the HTML mockup designs. It serves as the bridge between visual design and implementation.

**Note**: This is an additive specification. It does not modify any existing API contracts from Sprints 1-3.

---

## Design Patterns

### Bottom Sheets Over Modals

**Rule: Never use centered modals. Always use bottom sheets.**

All contextual overlays, confirmations, and secondary interactions use bottom sheets that slide up from the bottom of the screen. This provides:
- Consistent interaction pattern across the app
- Better thumb reachability on mobile
- Native-feeling iOS/Android experience
- Swipe-to-dismiss gesture support

---

## 1. Design Tokens

### 1.1 Color Palette

```typescript
const semanticColors = {
  // Backgrounds
  bgPrimary: '#0E0F11',
  bgSecondary: '#1A1C1F',
  bgElevated: '#24272B',
  inputBg: '#36302b',

  // Brand
  primary: '#B87333',        // Copper
  primary20: 'rgba(184,115,51,0.2)',

  // Status
  warning: '#D98E04',
  warning15: 'rgba(217,142,4,0.15)',
  star: '#fbbf24',
  green: '#4ade80',
  red: '#f87171',

  // Text
  textPrimary: 'rgba(255,255,255,0.92)',
  textSecondary: 'rgba(255,255,255,0.72)',
  textMuted: 'rgba(255,255,255,0.55)',

  // Dividers
  divider: 'rgba(255,255,255,0.08)',

  // Wind Levels (overlay-specific)
  windLow: '#94a3b8',
  windModerate: '#64748b',
  windHigh: '#b45309',
}
```

### 1.2 Typography

```typescript
const typography = {
  fontFamilyDisplay: 'Space Grotesk',
  fontFamilyBody: 'Inter',

  sizes: {
    h1: { size: 24, weight: 600, family: 'display' },
    h2: { size: 20, weight: 600, family: 'display' },
    body: { size: 16, weight: 400, family: 'body' },
    bodySmall: { size: 14, weight: 400, family: 'body' },
    caption: { size: 12, weight: 600, family: 'body' },
    label: { size: 10, weight: 400, family: 'body' },
  }
}
```

### 1.3 Spacing & Radius

```typescript
const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
}

const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  pill: 9999,
  sheet: 32,
}
```

---

## 2. Reusable Components

### 2.1 Badge Component

Used across route cards, headers, and status displays.

```typescript
type BadgeVariant = 'primary' | 'neutral' | 'warning' | 'wind'

type BadgeProps = {
  variant: BadgeVariant
  label: string
  icon?: string  // Material Symbol name
}

// Variant styling
const badgeStyles: Record<BadgeVariant, BadgeStyle> = {
  primary: {
    background: 'rgba(184,115,51,0.2)',
    color: '#B87333',
    border: '1px solid rgba(184,115,51,0.3)',
  },
  neutral: {
    background: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.55)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  warning: {
    background: 'rgba(251,191,36,0.2)',
    color: '#fbbf24',
    border: 'none',
  },
  wind: {
    background: 'rgba(251,191,36,0.15)',
    color: '#fbbf24',
    border: 'none',
  },
}

// Common dimensions
const badgeDimensions = {
  padding: { horizontal: 8, vertical: 4 },
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 500,
  iconSize: 14,
  gap: 4,
}
```

### 2.2 Segmented Control

Used in PlanRideSheet (Route Style) and PreferencesScreen.

```typescript
type SegmentedControlProps = {
  options: Array<{
    value: string
    label: string
  }>
  selectedValue: string
  onChange: (value: string) => void
}

const segmentedControlStyle = {
  container: {
    background: '#36302b',  // inputBg
    borderRadius: 12,
    padding: 4,
  },
  segment: {
    height: 40,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
  },
  segmentInactive: {
    background: 'transparent',
    color: 'rgba(255,255,255,0.55)',
  },
  segmentActive: {
    background: '#B87333',
    color: 'rgba(255,255,255,0.92)',
  },
}
```

**Design-TRD Alignment Note**: The design shows 3 options ("Direct" | "Balanced" | "Scenic") which maps to the TRD's `scenicBias` preference. See §5 Future Considerations for mapping details.

### 2.3 Toggle Switch

Used in preferences and settings screens.

```typescript
type ToggleSwitchProps = {
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}

const toggleSwitchStyle = {
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
  },
  trackOff: {
    background: '#24272B',
  },
  trackOn: {
    background: '#B87333',
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    margin: 4,
  },
  thumbOff: {
    background: 'rgba(255,255,255,0.55)',
    translateX: 0,
  },
  thumbOn: {
    background: '#FFFFFF',
    translateX: 20,
  },
}
```

### 2.4 Chip Component

Used in PlaceSearchSheet (recent searches) and RateRouteSheet (tags).

```typescript
type ChipVariant = 'default' | 'selected'

type ChipProps = {
  label: string
  icon?: string  // Material Symbol name
  variant?: ChipVariant
  onPress?: () => void
}

const chipStyles: Record<ChipVariant, ChipStyle> = {
  default: {
    background: '#24272B',
    color: 'rgba(255,255,255,0.72)',
    padding: { horizontal: 16, vertical: 8 },
    borderRadius: 20,
    fontSize: 14,
  },
  selected: {
    background: 'rgba(184,115,51,0.2)',
    color: '#B87333',
    padding: { horizontal: 12, vertical: 8 },
    borderRadius: 16,
    fontSize: 14,
  },
}
```

### 2.5 Section Card

Container for grouped settings/content.

```typescript
type SectionCardProps = {
  children: React.ReactNode
}

const sectionCardStyle = {
  background: '#24272B',
  borderRadius: 16,
  overflow: 'hidden',
}
```

### 2.6 Advisory Card

Used for warnings and important notices.

```typescript
type AdvisoryCardProps = {
  icon: string
  text: string
  variant?: 'warning' | 'info'
}

const advisoryCardStyles = {
  warning: {
    background: 'rgba(217,142,4,0.15)',
    border: '1px solid rgba(217,142,4,0.3)',
    iconColor: '#D98E04',
  },
  info: {
    background: 'rgba(148,163,184,0.15)',
    border: '1px solid rgba(148,163,184,0.3)',
    iconColor: '#94a3b8',
  },
  common: {
    borderRadius: 12,
    padding: { horizontal: 16, vertical: 12 },
    gap: 12,
    textSize: 14,
    textColor: 'rgba(255,255,255,0.72)',
  },
}
```

### 2.7 Weather Pill

Inline weather summary display.

```typescript
type WeatherPillProps = {
  icon: string
  text: string
  severity?: 'low' | 'moderate' | 'high'
}

const weatherPillStyle = {
  background: 'rgba(251,191,36,0.15)',
  color: '#fbbf24',
  padding: { horizontal: 12, vertical: 6 },
  borderRadius: 20,
  fontSize: 13,
  iconSize: 16,
  gap: 6,
}
```

---

## 3. Bottom Sheet Specifications

### 3.1 Sheet Heights

| Sheet ID | Name | Default Height | Snap Points |
|----------|------|----------------|-------------|
| S001 | PlanRideSheet | 65% | [65%] |
| S002 | RouteOptionsSheet | 65% | [65%] |
| S003 | RouteOverviewSheet | 75% | [40%, 75%] |
| S004 | PlanningErrorSheet | 50% | [50%] |
| S005 | WindLegendSheet | 45% | [45%] |
| S005a | RainLegendSheet | 45% | [45%] |
| S005b | TemperatureLegendSheet | 45% | [45%] |
| S006 | PlaceSearchSheet | 85% | [50%, 85%] |
| S007 | AnnotationDetailSheet | 55% | [55%] |
| S008 | RenameRouteSheet | 40% | [40%] |
| S009 | ConfirmDeleteRouteSheet | 35% | [35%] |
| S010 | AddAvoidAreaSheet | 60% | [60%] |
| S011 | AddFavoriteRoadSheet | 55% | [55%] |
| S012 | ElevationProfileSheet | 40% | [40%] |
| S013 | RateRouteSheet | 60% | [60%] |
| S014 | DepartureOptimizerSheet | 70% | [70%] |
| S015 | RideDetailSheet | 70% | [70%] |

### 3.2 Common Sheet Elements

```typescript
const sheetCommon = {
  dragHandle: {
    width: 36,
    height: 4,
    background: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginTop: 8,
    marginBottom: 16,
  },
  borderRadius: 32,
  background: '#1A1C1F',
  shadow: '0 -8px 30px rgba(0,0,0,0.5)',
  headerPadding: { horizontal: 24, top: 0, bottom: 20 },
  contentPadding: { horizontal: 24 },
  actionPadding: { all: 24, bottom: 40 },
}
```

---

## 4. Navigation Components

### 4.1 Bottom Navigation Bar

```typescript
type BottomNavTab = {
  id: 'explore' | 'saved' | 'rides' | 'profile'
  icon: string  // Material Symbol name
  label: string
  targetScreen: string
}

const bottomNavTabs: BottomNavTab[] = [
  { id: 'explore', icon: 'map', label: 'Explore', targetScreen: 'V001' },
  { id: 'saved', icon: 'bookmark', label: 'Saved', targetScreen: 'V002' },
  { id: 'rides', icon: 'two_wheeler', label: 'Rides', targetScreen: 'V014' },
  { id: 'profile', icon: 'person', label: 'Profile', targetScreen: 'V011' },
]

const bottomNavStyle = {
  height: 84,
  background: '#1A1C1F',
  borderTop: '1px solid rgba(255,255,255,0.08)',
  paddingTop: 8,
  tab: {
    iconSize: 24,
    labelSize: 10,
    gap: 4,
    activeColor: '#B87333',
    inactiveColor: 'rgba(255,255,255,0.55)',
  },
}
```

**Note**: The "Rides" tab (V014 RideHistoryScreen) is Phase 3 scope. Render as disabled/hidden until Phase 3.

### 4.2 Overlay Toggle Pills

Used in RouteOptionsSheet to switch overlay visualization.

```typescript
type OverlayToggle = {
  id: 'wind' | 'rain' | 'temp'
  icon: string
  label: string
  phase: 1 | 2  // When available
}

const overlayToggles: OverlayToggle[] = [
  { id: 'wind', icon: 'air', label: 'Wind', phase: 1 },
  { id: 'rain', icon: 'water_drop', label: 'Rain', phase: 2 },
  { id: 'temp', icon: 'thermostat', label: 'Temp', phase: 2 },
]

const overlayPillStyle = {
  inactive: {
    background: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.55)',
  },
  active: {
    background: 'rgba(184,115,51,0.2)',
    color: '#B87333',
    border: '1px solid rgba(184,115,51,0.3)',
  },
  common: {
    padding: { horizontal: 12, vertical: 6 },
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 500,
    iconSize: 16,
    gap: 6,
  },
}
```

---

## 5. Wind Level Display Mapping

Maps backend wind levels to UI display properties.

```typescript
type WindDisplayLevel = {
  level: 'low' | 'moderate' | 'high' | 'unavailable'
  label: string
  color: string
  iconColor: string
  badgeBackground: string
}

const windDisplayLevels: Record<string, WindDisplayLevel> = {
  low: {
    level: 'low',
    label: 'Light',
    color: '#94a3b8',
    iconColor: '#94a3b8',
    badgeBackground: 'rgba(148,163,184,0.2)',
  },
  moderate: {
    level: 'moderate',
    label: 'Moderate',
    color: '#64748b',
    iconColor: '#64748b',
    badgeBackground: 'rgba(100,116,139,0.2)',
  },
  high: {
    level: 'high',
    label: 'High',
    color: '#b45309',
    iconColor: '#b45309',
    badgeBackground: 'rgba(180,83,9,0.2)',
  },
  unavailable: {
    level: 'unavailable',
    label: 'Unavailable',
    color: 'rgba(255,255,255,0.55)',
    iconColor: 'rgba(255,255,255,0.55)',
    badgeBackground: 'rgba(255,255,255,0.05)',
  },
}
```

---

## 6. Button Components

### 6.1 Primary Button

```typescript
const primaryButtonStyle = {
  height: 56,
  background: '#B87333',
  borderRadius: 20,
  fontSize: 16,
  fontWeight: 600,
  color: 'rgba(255,255,255,0.92)',
  shadow: '0 8px 16px rgba(184,115,50,0.4)',
  iconSize: 20,
  gap: 8,
}
```

### 6.2 Secondary Button

```typescript
const secondaryButtonStyle = {
  height: 48,
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 20,
  fontSize: 16,
  fontWeight: 500,
  color: 'rgba(255,255,255,0.72)',
  iconSize: 20,
  gap: 8,
}
```

---

## 7. Form Components

### 7.1 Location Input Field

Used in PlanRideSheet for start/end entry.

```typescript
type LocationInputProps = {
  value: string
  placeholder: string
  icon: 'circle' | 'location_on'  // Start vs End
  actionIcon?: 'near_me' | 'close'
  onPress: () => void
  onActionPress?: () => void
}

const locationInputStyle = {
  height: 56,
  background: '#36302b',
  borderRadius: 12,
  paddingHorizontal: 16,
  fontSize: 16,
  iconColor: '#B87333',
  actionIconColor: 'rgba(255,255,255,0.55)',
}
```

### 7.2 Search Input

Used in PlaceSearchSheet.

```typescript
const searchInputStyle = {
  background: '#36302b',
  borderRadius: 12,
  padding: { horizontal: 16, vertical: 14 },
  fontSize: 16,
  iconSize: 20,
  iconColor: 'rgba(255,255,255,0.55)',
  gap: 12,
}
```

### 7.3 Text Area

Used in RateRouteSheet for notes.

```typescript
const textAreaStyle = {
  height: 100,
  background: '#36302b',
  borderRadius: 12,
  padding: 16,
  fontSize: 16,
  color: 'rgba(255,255,255,0.92)',
  placeholderColor: 'rgba(255,255,255,0.55)',
}
```

---

## 8. Star Rating Component

Used in RateRouteSheet and RideDetailSheet.

```typescript
type StarRatingProps = {
  value: number  // 1-5
  onChange?: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
  readonly?: boolean
}

const starRatingSizes = {
  sm: { iconSize: 20, gap: 4 },
  md: { iconSize: 32, gap: 6 },
  lg: { iconSize: 40, gap: 8 },
}

const starRatingColors = {
  filled: '#fbbf24',
  empty: 'rgba(255,255,255,0.2)',
}
```

---

## 9. List Components

### 9.1 Setting Row

Used in PreferencesScreen and SettingsScreen.

```typescript
type SettingRowProps = {
  icon: string
  label: string
  value?: React.ReactNode  // Toggle, chevron, etc.
  onPress?: () => void
}

const settingRowStyle = {
  padding: { horizontal: 16, vertical: 16 },
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  iconSize: 20,
  iconColor: 'rgba(255,255,255,0.55)',
  labelSize: 16,
  gap: 12,
}
```

### 9.2 Navigation Row

Used for drill-down navigation (e.g., Avoid Areas, Favorite Roads).

```typescript
type NavRowProps = {
  icon: string
  label: string
  subtitle?: string
  onPress: () => void
}

const navRowStyle = {
  ...settingRowStyle,
  chevronColor: 'rgba(255,255,255,0.55)',
  subtitleSize: 14,
  subtitleColor: 'rgba(255,255,255,0.55)',
}
```

### 9.3 Search Result Item

Used in PlaceSearchSheet.

```typescript
type SearchResultItemProps = {
  icon: 'location_on' | 'my_location' | 'history'
  name: string
  address?: string
  onPress: () => void
}

const searchResultStyle = {
  padding: { vertical: 12 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: '#24272B',
  },
  iconSize: 20,
  nameSize: 16,
  addressSize: 14,
  addressColor: 'rgba(255,255,255,0.55)',
  gap: 16,
}
```

---

## Related Documents

- **Design Mockups**: `../designs/mocks/*.mobile.html`
- **Theme System**: `components/ui/semantic-theme.tsx`
- **Phase 1 TRD**: `phase-1-core.md`
- **Phase 2 TRD**: `phase-2-personalization.md`
- **Phase 3 TRD**: `phase-3-post-ride.md`
