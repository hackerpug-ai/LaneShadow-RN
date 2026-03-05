# Lane Shadow Design Analysis Report

> Extracted from legacy HTML mockups in `.spec/epics/epic-1/designs/legacy/`

---

## 1. Design Paradigm

### 1.1 Color Palette

#### Surface & Background Colors
| Token | Value | Usage |
|-------|-------|-------|
| `surface.primary` | `#0E0F11` / `#121212` | Main background, deep charcoal |
| `surface.secondary` | `#1A1C1F` / `#1C1917` | Bottom sheets and secondary containers |
| `surface.elevated` | `#24272B` / `#2E2926` | Cards, input fields, elevated panels |
| `surface.divider` | `rgba(255,255,255,0.08)` | Thin lines and borders |
| `surface.sheetScrim` | `rgba(0,0,0,0.55)` / `rgba(0,0,0,0.6)` | Dimming background for overlays |
| `background-dark` | `#1f1913` / `#221810` | Warm-tinted dark background |
| `surface-dark` | `#25211e` / `#2a241e` | Warm elevated surfaces |
| `input-bg` | `#36302b` / `#393028` | Input field backgrounds |

#### Typography Colors
| Token | Value | Usage |
|-------|-------|-------|
| `text.primary` | `rgba(255,255,255,0.92)` | High emphasis text |
| `text.secondary` | `rgba(255,255,255,0.72)` | Medium emphasis text |
| `text.muted` | `rgba(255,255,255,0.55)` / `#b4aba2` | Placeholders and disabled text |
| `text.inverse` | `#0E0F11` | Dark text for light backgrounds (buttons) |

#### Intent & Brand Colors
| Token | Value | Usage |
|-------|-------|-------|
| `intent.primary` | `#B87333` / `#b87332` / `#ec7813` / `#f27c0d` / `#D98E63` | Copper - Main brand/action color (variations across screens) |
| `intent.primaryPressed` | `#8C5A2B` / `#a06228` | Active state for copper buttons |
| `intent.secondary` | `rgba(255,255,255,0.12)` | Subtle background for secondary actions |

#### Route & Status Colors
| Token | Value | Usage |
|-------|-------|-------|
| `route.selected` | `#B87333` (copper) | Active route on map |
| `route.alternate` | `rgba(255,255,255,0.45)` | Alternative route options |
| `status.error` | `#E35D6A` | Destructive actions and errors |
| `status.warning` | `#D98E04` / amber variants | Wind advisories and alerts |

#### Wind Legend Colors
| Level | Color | Range |
|-------|-------|-------|
| Low | `slate-400` | 0-15 mph |
| Moderate | `slate-500` / `slate-600` | 15-25 mph |
| High | `amber-700` | 25+ mph |

---

### 1.2 Typography System

#### Font Families
| Role | Font | Usage |
|------|------|-------|
| Display | **Space Grotesk** | Headers, branding, headlines |
| UI/Body | **Inter** | Functional text, labels, body copy |
| Fallback | **Noto Sans** | Secondary sans-serif |

#### Type Scale
| Token | Size | Weight | Font Family |
|-------|------|--------|-------------|
| `xxl` | 32px | Semibold (600) | Space Grotesk |
| `xl` | 24px-28px | Semibold/Bold (600-700) | Space Grotesk |
| `lg` | 20px | Semibold (600) | Inter |
| `md` | 16px | Regular (400) | Inter |
| `sm` | 14px | Medium (500) | Inter |
| `xs` | 12px | Regular (400) | Inter |
| `xxs` | 10px | Semibold (600) | Inter (uppercase tracking) |

#### Text Styles Observed
- **Headlines**: Bold/Semibold, tight tracking (`tracking-tight`)
- **Labels**: Uppercase, wide tracking (`tracking-wider` / `tracking-widest`)
- **Body**: Normal weight, relaxed line-height
- **Meta/Timestamps**: Extra small, uppercase, wide tracking

---

### 1.3 Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 6px | Tight gaps |
| `sm` | 8px | Small controls |
| `md` | 12px-16px | Standard spacing |
| `lg` | 20px-24px | Section spacing |
| `xl` | 24px-32px | Large separations |

**Common Patterns:**
- Sheet padding: `px-6 py-6` (24px)
- Card padding: `p-4` (16px)
- Input padding: `py-3.5 px-4` (14px/16px)
- Button height: `h-12` to `h-14` (48-56px)
- Icon button size: `size-10` to `size-12` (40-48px)

---

### 1.4 Border Radius System

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 8px | Small controls, pills |
| `md` / `DEFAULT` | 12px | Buttons, inputs |
| `lg` | 16px | Cards, overlays |
| `xl` | 20px-24px | Bottom sheet top corners |
| `2xl` | 32px | Large sheets |
| `full` | 9999px | Pills, circular buttons |

---

### 1.5 Shadow System

| Type | Value | Usage |
|------|-------|-------|
| Button glow | `shadow-[0_8px_16px_rgba(184,115,50,0.4)]` | Primary FAB buttons |
| Card shadow | `shadow-lg` / `shadow-2xl` | Elevated cards |
| Sheet shadow | `shadow-[0_-8px_30px_rgba(0,0,0,0.5)]` | Bottom sheets |
| Primary action | `shadow-lg shadow-orange-900/20` | CTA buttons |
| Error action | `shadow-lg shadow-red-900/20` | Destructive buttons |

---

### 1.6 Motion & Animation

| Property | Value | Usage |
|----------|-------|-------|
| Duration short | 140ms | Quick feedback |
| Duration medium | 220ms | Standard transitions |
| Easing | `ease-out` | Material-style curve |
| Scale feedback | `active:scale-[0.98]` | Button press feedback |
| Hover scale | `group-hover:scale-110` | Icon hover effects |
| Transition | `transition-all` / `transition-colors` | Smooth state changes |

---

### 1.7 Iconography

**Icon System:** Google Material Symbols (Outlined)
- Base settings: `'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24`
- Sizes: 14px, 16px, 18px, 20px, 24px, 26px, 28px

**Common Icons Used:**
| Icon | Context |
|------|---------|
| `map` | Explore tab |
| `bookmark` / `bookmarks` | Saved routes |
| `two_wheeler` | Rides/motorcycle |
| `person` | Profile |
| `explore` | Plan ride FAB |
| `navigation` | Start navigation |
| `my_location` | Current location |
| `layers` | Map layers |
| `search` | Search input |
| `arrow_back` | Navigation back |
| `settings` | Settings |
| `menu` | Hamburger menu |
| `add` / `remove` | Zoom controls |
| `swap_vert` | Swap locations |
| `near_me` | GPS/location |
| `air` | Wind indicator |
| `warning` | Alert/caution |
| `delete` | Delete action |
| `check_circle` | Selection indicator |
| `chevron_right` | List disclosure |
| `history` | Recent items |
| `landscape` | Scenic indicator |
| `straight` | Default route |
| `add_road` | Highway toggle |
| `toll` | Toll toggle |
| `distance` | Distance metric |
| `schedule` | Duration metric |
| `info` | Information |
| `close` | Dismiss |
| `cancel` | Clear input |
| `route` | App logo icon |

---

## 2. Screen Inventory

### 2.1 Home / Map View
**File:** `home.mapview.designs.html`

| Attribute | Value |
|-----------|-------|
| **Screen ID** | `home-map` |
| **Purpose** | Main map exploration screen with navigation to core features |
| **Key Components** | Map background, Top app bar, Search bar, Map controls (zoom, location, layers), FAB (Plan Ride), Bottom navigation |
| **States** | Default idle state shown |

**Component Details:**
- Transparent top app bar with blur effect
- Floating search bar with microphone input
- Vertical map control stack (zoom in/out, my location, layers)
- Extended FAB with icon and label
- Bottom tab bar (Explore, Saved, Rides, Profile)

---

### 2.2 Plan Ride Sheet
**File:** `home.planridesheet.design.html`

| Attribute | Value |
|-----------|-------|
| **Screen ID** | `plan-ride-sheet` |
| **Purpose** | Input origin/destination and route preferences |
| **Key Components** | Bottom sheet, Route timeline (origin/destination), Location inputs, Scenic bias toggle, Preference switches, Primary action button |
| **States** | Expanded sheet with form |

**Component Details:**
- Drag handle at top
- Visual timeline connecting origin to destination dots
- Segmented control for scenic bias (Default / High Scenic)
- Toggle switches for "Avoid highways" and "Avoid tolls"
- Full-width primary CTA

---

### 2.3 Route Options Sheet
**File:** `home.routeoptions.designs.html`

| Attribute | Value |
|-----------|-------|
| **Screen ID** | `route-options-sheet` |
| **Purpose** | Display and select from multiple route alternatives |
| **Key Components** | Bottom sheet, Route option cards (selected/unselected), Destination header, Map controls |
| **States** | One route selected, others collapsed |

**Component Details:**
- Destination pill in top header
- Selected route card (expanded with full details, badges, CTA)
- Unselected route cards (compact, clickable)
- Route badges: "Most Scenic", "Low Wind", "Fastest", "Advanced Only"
- Duration/distance display

---

### 2.4 Route Overview Sheet
**File:** `routeoverview.designs.html`

| Attribute | Value |
|-----------|-------|
| **Screen ID** | `route-overview-sheet` |
| **Purpose** | Display detailed route information with leg breakdown |
| **Key Components** | Bottom sheet, Route header, Stats row, Condition pill, Leg list with wind indicators, Action buttons |
| **States** | Full route detail view |

**Component Details:**
- Route name and description
- Stats: Distance, Duration, Legs count
- Wind condition pill (overall)
- Segmented leg list with individual wind bars
- Primary: "Save Route", Secondary: "Back to Options"
- Wind legend link

---

### 2.5 Saved Routes List
**File:** `saved.routes.designs.html`

| Attribute | Value |
|-----------|-------|
| **Screen ID** | `saved-routes` |
| **Purpose** | Browse and manage saved motorcycle routes |
| **Key Components** | Top app bar, Search input, Route cards (thumbnail, info, meta), FAB, Bottom navigation |
| **States** | List with items, search available |

**Component Details:**
- "Edit" action in header
- Search with icon
- Route cards with map thumbnail, route path visualization, distance/duration, timestamp
- Chevron disclosure indicator
- Add new route FAB

---

### 2.6 Login / Authentication
**File:** `login.designs.html`

| Attribute | Value |
|-----------|-------|
| **Screen ID** | `auth-login` |
| **Purpose** | User authentication via social or email/password |
| **Key Components** | Brand header (logo + tagline), Social auth buttons, Divider, Email/password form, Primary CTA, Links |
| **States** | Default login form |

**Component Details:**
- App icon with glow effect
- "Continue with Apple" / "Continue with Google" buttons
- "or email" divider
- Labeled inputs with focus ring
- "Forgot?" password link
- "Create account" link
- Terms & Privacy footer

---

### 2.7 Place Search Sheet
**File:** `placesearch.designs.html`

| Attribute | Value |
|-----------|-------|
| **Screen ID** | `place-search-sheet` |
| **Purpose** | Search for destinations with autocomplete results |
| **Key Components** | Bottom sheet (85vh), Search input, Recent searches chips, Search results list |
| **States** | With results populated |

**Component Details:**
- Full-height sheet covering most of screen
- Search input with icon
- Recent search chips (horizontal scroll)
- Results with category icons (location_on, landscape, water, signpost)
- Result item: icon, title, subtitle, arrow

---

### 2.8 Rename Route Sheet
**File:** `renameroute.designs.html`

| Attribute | Value |
|-----------|-------|
| **Screen ID** | `rename-route-sheet` |
| **Purpose** | Edit the name of a saved route |
| **Key Components** | Modal sheet, Headline, Body text, Text input with clear button, Button group |
| **States** | Default with existing name populated |

**Component Details:**
- Centered headline
- Descriptive body text
- Single text input (autofocus, clear button)
- Two-column button group: Cancel (secondary), Save (primary)

---

### 2.9 Delete Route Confirmation
**File:** `deleteroute.designs.html`

| Attribute | Value |
|-----------|-------|
| **Screen ID** | `delete-route-sheet` |
| **Purpose** | Confirm permanent deletion of a saved route |
| **Key Components** | Modal sheet, Warning headline, Warning card, Destructive button, Cancel button |
| **States** | Confirmation dialog |

**Component Details:**
- Centered headline and body
- Warning card with icon explaining consequences
- Full-width destructive primary button (red)
- Full-width secondary cancel button
- Scrim backdrop with blur

---

### 2.10 Wind Legend Sheet
**File:** `whind-legend.designs.html`

| Attribute | Value |
|-----------|-------|
| **Screen ID** | `wind-legend-sheet` |
| **Purpose** | Explain wind condition levels and their meanings |
| **Key Components** | Modal sheet, Close button, Legend rows, Disclaimer, Dismiss button |
| **States** | Information modal |

**Component Details:**
- Close button in header
- Three legend rows (Low, Moderate, High)
- Color swatches with labels and speed ranges
- Info disclaimer about estimates
- "Got it" dismissal button

---

## 3. User Flows

### 3.1 Route Planning Flow

```
[Home Map View]
    |
    | tap "Plan Ride" FAB
    v
[Plan Ride Sheet]
    |
    | enter origin/destination
    | set scenic bias & preferences
    | tap "Plan Ride"
    v
[Route Options Sheet]
    |
    | browse route alternatives
    | tap to select route
    v
[Route Overview Sheet]
    |
    |-- tap "Save Route" --> [Saved Routes]
    |-- tap "Back to Options" --> [Route Options Sheet]
    |-- tap "Start Navigation" --> [External Navigation]
```

### 3.2 Saved Routes Flow

```
[Home Map View]
    |
    | tap "Saved" tab
    v
[Saved Routes List]
    |
    |-- tap route card --> [Route Overview Sheet]
    |-- tap "Edit" --> [Edit Mode]
    |-- tap FAB --> [Plan Ride Sheet]
    |
[Route Overview Sheet]
    |
    |-- long press / menu --> [Rename Route Sheet]
    |                         [Delete Route Sheet]
```

### 3.3 Authentication Flow

```
[App Launch (unauthenticated)]
    |
    v
[Login Screen]
    |
    |-- tap "Continue with Apple" --> [Apple OAuth]
    |-- tap "Continue with Google" --> [Google OAuth]
    |-- enter email/password, tap "Sign In" --> [Authenticated]
    |-- tap "Create account" --> [Registration Flow]
    |-- tap "Forgot?" --> [Password Reset Flow]
```

### 3.4 Location Search Flow

```
[Plan Ride Sheet]
    |
    | tap destination input
    v
[Place Search Sheet]
    |
    | type search query / tap recent
    | tap result
    v
[Plan Ride Sheet (destination populated)]
```

---

## 4. Component Library

### 4.1 Buttons

#### Primary Button (CTA)
```
- Height: 48-56px (h-12 to h-14)
- Background: intent.primary (#B87333 / copper variants)
- Text: White, bold, base size
- Border radius: rounded-xl (1.5rem)
- Shadow: shadow-lg shadow-orange-900/20
- States: hover (brightness-110), active (scale-[0.98])
- Full width in sheets
```

#### Secondary Button
```
- Height: 48px (h-12)
- Background: transparent
- Border: 1px solid surface.divider
- Text: White, medium weight
- Border radius: rounded-xl
- States: hover (bg-white/5), active (scale-[0.98])
```

#### Destructive Button
```
- Same as Primary but:
- Background: status.error (#E35D6A)
- Shadow: shadow-lg shadow-red-900/20
```

#### Icon Button (Map Controls)
```
- Size: 40-48px (size-10 to size-12)
- Background: surface.elevated with backdrop-blur
- Border: 1px solid white/10
- Border radius: rounded-full or rounded-xl
- Icon: Material Symbols, 24px
```

#### FAB (Floating Action Button)
```
- Height: 56px (h-14)
- Padding: pl-5 pr-6
- Background: intent.primary
- Shadow: shadow-[0_8px_16px_rgba(184,115,50,0.4)]
- Contains icon + label
- Border radius: rounded-xl
```

---

### 4.2 Inputs

#### Text Input
```
- Height: 48-56px (h-12 to h-14)
- Background: input-bg (#36302b)
- Border: none (or 1px ring on focus)
- Border radius: rounded-xl
- Padding: py-3.5 px-4
- Focus: ring-1 ring-primary
- Placeholder: text-muted
```

#### Search Input
```
- Same as text input
- Leading icon: search
- Trailing icon: mic (optional)
- Elevated container with backdrop-blur
```

#### Location Input (with timeline)
```
- Paired inputs (origin/destination)
- Visual timeline connector (dots + line)
- Leading indicator: colored dot (origin hollow, destination filled)
- Trailing icon: near_me / search
```

---

### 4.3 Cards

#### Route Option Card (Selected)
```
- Background: surface.elevated
- Border: 2px solid intent.primary
- Border radius: rounded-xl
- Padding: p-4
- Contains: title, badges, stats, CTA button
- Check icon in corner
```

#### Route Option Card (Unselected)
```
- Background: surface.elevated (dimmed)
- Border: 1px solid white/5
- Compact layout: title, badges, stats inline
- Hover: bg-surface-elevated
- Active: scale-[0.99]
```

#### Saved Route Card
```
- Background: surface.elevated
- Border: 1px solid white/5
- Border radius: rounded-xl
- Layout: thumbnail + content + chevron
- Footer with meta (distance, duration, timestamp)
- Thumbnail: 96x96px with map preview
- Active: scale-[0.99]
```

---

### 4.4 Sheets

#### Bottom Sheet (Partial)
```
- Background: surface.secondary
- Border radius: rounded-t-[32px] (top corners only)
- Shadow: shadow-[0_-8px_30px_rgba(0,0,0,0.5)]
- Ring: ring-1 ring-white/5
- Drag handle: 12x1.5px pill, bg-white/20
- Max height: 65vh-85vh
- Content: scrollable with no-scrollbar
```

#### Modal Sheet (Full-width)
```
- Same as bottom sheet
- Scrim backdrop: rgba(0,0,0,0.6) with backdrop-blur
- Centered on screen bottom
- Fixed positioning
```

---

### 4.5 Navigation

#### Top App Bar
```
- Position: absolute top
- Background: gradient from black/60 to transparent
- Height: includes safe area (pt-12 on mobile)
- Contains: back button, title/destination, action button
- Backdrop blur for map overlay
```

#### Bottom Tab Bar
```
- Height: 84px (includes safe area)
- Background: surface.primary with backdrop-blur
- Border top: 1px solid white/5
- 3-4 tabs: icon + label
- Active state: intent.primary color, filled icon
- Inactive: text-muted
```

---

### 4.6 Toggles & Controls

#### Segmented Control (Scenic Bias)
```
- Container: p-1, bg-input-bg, rounded-xl
- Segments: flex-1, py-2.5 px-4
- Active segment: bg-primary text-white
- Inactive: bg-transparent text-muted
- Icon + label per segment
```

#### Toggle Switch
```
- Width: 44px (w-11)
- Height: 24px (h-6)
- Track: bg-surface.elevated
- Thumb: 20px circle
- Active: bg-primary, thumb-white
- Inactive: bg-surface.elevated, thumb-muted
```

#### Toggle Row
```
- Full width row in card
- Leading icon in square container
- Label text
- Trailing toggle switch
- Border bottom between rows
```

---

### 4.7 Badges & Pills

#### Route Badge
```
- Padding: px-2 py-1
- Border radius: rounded-md
- Font: text-xs font-medium
- Variants:
  - Primary: bg-primary/20 text-primary ring-1 ring-primary/30
  - Neutral: bg-white/5 text-gray-400 ring-1 ring-white/10
  - Warning: bg-red-900/30 text-red-400 border border-red-900/50
```

#### Condition Pill
```
- Inline-flex with icon + text
- Background: industrial-grey/40
- Border: 1px solid white/5
- Border radius: rounded-full
- Icon: colored by condition
```

#### Speed Range Pill
```
- Background: bg-white/5
- Border: 1px solid white/5
- Border radius: rounded-full
- Text: font-bold text-sm
```

---

### 4.8 Lists

#### Search Result Row
```
- Padding: px-4 py-4
- Border bottom: 1px solid divider
- Leading: 40px icon circle
- Content: title (semibold) + subtitle (secondary)
- Trailing: arrow icon
- Hover: bg-surface-elevated
```

#### Route Leg Row
```
- Padding: py-4
- Border bottom: 1px solid white/5
- Leading dot (colored by status)
- Content: leg info + label
- Trailing: wind bar visualization
- Hover: text-primary
```

---

### 4.9 Specialized Components

#### Wind Bar Visualization
```
- 4 segments, each 8x12px
- Gap: 2px
- Filled segments: bg-primary
- Empty segments: bg-white/10
- Levels: 1 (Low), 2 (Moderate), 3-4 (High)
```

#### Route Timeline (Origin/Destination)
```
- Vertical layout
- Origin dot: hollow circle with primary border
- Connector: gradient line (primary to muted)
- Destination dot: filled circle (muted)
- Adjacent to input fields
```

#### Map Thumbnail
```
- Size: 96x96px
- Border radius: rounded-lg
- Background: grayscale map image
- Opacity: 80%
- Hover: scale-110 transition
```

---

## 5. Design Patterns Summary

### Visual Language
- **Dark Mode First**: All designs are dark-themed with warm undertones
- **Industrial Aesthetic**: Muted colors, functional typography, utilitarian feel
- **Copper Accent**: Primary brand color used sparingly for CTAs and highlights
- **Glassmorphism**: Backdrop blur on overlays and floating controls
- **Depth Through Layers**: Multiple z-index levels (map < controls < sheets < modals)

### Interaction Patterns
- **Bottom Sheet Navigation**: Primary interaction model for mobile
- **Progressive Disclosure**: Collapsed cards expand on selection
- **Touch Feedback**: Scale transforms on active state
- **Swipe Gestures**: Implied by drag handles on sheets

### Accessibility Considerations
- **sr-only Labels**: Screen reader support for form inputs
- **Color Contrast**: High contrast text on dark backgrounds
- **Touch Targets**: Minimum 40px for interactive elements
- **Focus States**: Ring indicators for keyboard navigation

---

## 6. Implementation Notes

### Tailwind Configuration
The designs use custom Tailwind configuration with:
- Extended color palette (primary, surface variants)
- Custom font families (Space Grotesk, Inter)
- Custom border radius scale
- Dark mode class strategy

### Component Architecture
Suggested React/React Native component hierarchy:
```
- App
  - MapView
  - BottomSheet
    - PlanRideSheet
    - RouteOptionsSheet
    - RouteOverviewSheet
    - PlaceSearchSheet
    - RenameRouteSheet
    - DeleteConfirmSheet
    - WindLegendSheet
  - TabBar
  - FloatingControls
```

### State Management
Key state considerations:
- Route planning form state
- Selected route state
- Saved routes collection
- Authentication state
- Sheet visibility/height state
