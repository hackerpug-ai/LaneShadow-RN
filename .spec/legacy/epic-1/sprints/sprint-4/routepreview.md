# Refactor Plan: Plan Ride Sheet Component

## Overview

Refactor `components/sheets/plan-ride-sheet.tsx` to match design specification in `.spec/designs/home.planridesheet.design.html` while maintaining consistency with project patterns (semantic theme, React Native Paper, composition over inheritance).

## Current Issues

### 1. Missing Timeline Visualization

- **Current**: Text display of start/end coordinates or "Tap map" placeholders
- **Design**: Visual timeline with two dots connected by gradient line
- **Gap**: No visual representation of route/start/end points

### 2. Missing Input Fields

- **Current**: No input fields for route entry
- **Design**: Two inputs - "Current Location" (with location icon) and "Where to?" (with search icon)
- **Gap**: Cannot enter start/end stops manually

### 3. Scenic Bias UX

- **Current**: Button-based selection (secondary/outline variants)
- **Design**: Segmented control with radio buttons (straight icon vs landscape icon)
- **Gap**: Less intuitive visual selection, no clear grouping

### 4. Missing Swap Button

- **Current**: No swap functionality between inputs
- **Design**: Swap button with icon between two input fields
- **Gap**: Cannot easily swap input values

### 5. Toggles UX

- **Current**: Button-based toggles (avoid highways/tolls)
- **Design**: Labeled switches with icons (road icon + toggle switch, toll icon + toggle switch)
- **Gap**: Buttons don't clearly indicate what they toggle

### 6. Action Button Hierarchy

- **Current**: Simple "Plan Ride" button with text
- **Design**: Large primary button with "two-wheeler" Material Symbol icon + "Plan Ride" label
- **Gap**: Less prominent CTA, missing icon and badge

## Refactoring Plan

### Phase 1: Input Fields & Timeline

**Files to modify:**

- `components/sheets/plan-ride-sheet.tsx`
- `types/routes.ts` (extend existing `PlanRideInput` type)

**Changes:**

1. **Add Visual Timeline Component**
   ```typescript
   // New component for route visualization
   type RouteTimelineProps = {
     startPoint?: RouteStop | null
     endPoint?: RouteStop | null
   }
   
   export const RouteTimeline = ({ startPoint, endPoint }: RouteTimelineProps) => {
     const { semantic } = useSemanticTheme()
     
     return (
       <View style={[styles.timelineContainer, { paddingVertical: semantic.space.sm }]}>
         <View style={styles.timelineContent}>
           {/* Start dot */}
           {startPoint && (
             <View
               style={[
                 styles.timelineDot,
                 {
                   width: semantic.space.sm,
                   height: semantic.space.sm,
                   borderRadius: semantic.radius.full,
                   backgroundColor: semantic.color.primary.default,
                 }
               ]}
             />
           )}
           
           {/* Gradient line */}
           {(startPoint || endPoint) && (
             <View
               style={[
                 styles.timelineLine,
                 {
                   flex: 1,
                   height: 2,
                   backgroundColor: semantic.color.border.default,
                 }
               ]}
             />
           )}
           
           {/* End dot */}
           {endPoint && (
             <View
               style={[
                 styles.timelineDot,
                 {
                   width: semantic.space.sm,
                   height: semantic.space.sm,
                   borderRadius: semantic.radius.full,
                   backgroundColor: semantic.color.muted.default,
                 }
               ]}
             />
           )}
         </View>
       </View>
     )
   }
   
   const styles = StyleSheet.create({
     timelineContainer: {
       alignItems: 'center',
     },
     timelineContent: {
       flexDirection: 'row',
       alignItems: 'center',
       width: '100%',
     },
     timelineDot: {
       elevation: 2,
     },
     timelineLine: {
       marginHorizontal: semantic.space.sm,
     }
   })
   ```

2. **Extend Input Fields Type**
   ```typescript
   // Extend existing PlanRideInput type in types/routes.ts:
   export type PlanRideInput = {
     currentLocation?: string | null
     destination?: string | null
     onCurrentLocationChange?: (value: string) => void
     onDestinationChange?: (value: string) => void
   }
   ```

3. **Update Component Layout**

   - Insert RouteTimeline component at top (below header, above controls)
   - Replace text-based start/end display with timeline
   - Add input fields section with swap button

**New structure:**

```tsx
<View style={[styles.container, { gap: semantic.space.lg }]}>
  {/* Timeline visualization */}
  <RouteTimeline startPoint={startStop} endPoint={endStop} />
  
  {/* Input fields with swap */}
  <PlanRideInputs
    currentLocation={currentLocation}
    destination={destination}
    onCurrentLocationChange={onCurrentLocationChange}
    onDestinationChange={onDestinationChange}
  />
  
  {/* Existing controls (scenic bias, toggles) */}
  <View style={[styles.row, { gap: semantic.space.sm }]}>
    {/* Keep scenic bias controls */}
  </View>
  
  {/* Existing action button */}
</View>
```

### Phase 2: Scenic Bias Control

**Changes:**

1. **Replace button-based selection with ToggleGroup component**
   ```typescript
   // Import existing ToggleGroup from components/ui/toggle-group.tsx
   import { ToggleGroup, type ToggleGroupItem } from '../ui/toggle-group'
   import { IconSymbol } from '../ui/icon-symbol'
   
   // Replace scenic bias buttons with:
   <View style={[styles.section, { gap: semantic.space.md }]}>
     <Text variant="labelSmall" style={{ color: semantic.color.onSurface.muted }}>
       Scenic Bias
     </Text>
     <ToggleGroup
       value={scenicBias}
       onValueChange={(value) => onSetScenicBias(value as ScenicBias)}
       items={[
         {
           value: 'default',
           icon: <IconSymbol name="arrow-right" size={20} color={semantic.color.onSurface.default} />,
           label: 'Default',
         },
         {
           value: 'high',
           icon: <IconSymbol name="image" size={20} color={semantic.color.onSurface.default} />,
           label: 'Scenic',
         },
       ] as ToggleGroupItem[]}
     />
   </View>
   ```

### Phase 3: Toggles Refactoring

**Changes:**

1. **Replace button-based toggles with existing Switch component**
   ```typescript
   // Import existing Switch from components/ui/switch.tsx
   import { Switch } from '../ui/switch'
   import { IconSymbol } from '../ui/icon-symbol'
   
   // Replace toggle sections with:
   <View style={[styles.section, { gap: semantic.space.md }]}>
     <View style={[styles.toggleRow, { justifyContent: 'space-between' }]}>
       <View style={styles.toggleLabel}>
         <IconSymbol
           name="road-variant"
           size={20}
           color={semantic.color.onSurface.muted}
         />
         <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.default }}>
           Avoid highways
         </Text>
       </View>
       <Switch
         value={avoidHighways}
         onValueChange={onToggleAvoidHighways}
         testID="pref-avoid-highways"
       />
     </View>
     
     <View style={[styles.toggleRow, { justifyContent: 'space-between' }]}>
       <View style={styles.toggleLabel}>
         <IconSymbol
           name="cash"
           size={20}
           color={semantic.color.onSurface.muted}
         />
         <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.default }}>
           Avoid tolls
         </Text>
       </View>
       <Switch
         value={avoidTolls}
         onValueChange={onToggleAvoidTolls}
         testID="pref-avoid-tolls"
       />
     </View>
   </View>
   
   // Add to styles:
   const styles = StyleSheet.create({
     // ... existing styles
     section: {
       paddingVertical: semantic.space.sm,
     },
     toggleRow: {
       flexDirection: 'row',
       alignItems: 'center',
       paddingVertical: semantic.space.xs,
     },
     toggleLabel: {
       flexDirection: 'row',
       alignItems: 'center',
       gap: semantic.space.sm,
       flex: 1,
     },
   })
   ```

### Phase 4: Action Button & Header

**Changes:**

1. **Add "Motorcycle" badge to header**
   ```typescript
   import { Badge } from '../ui/badge'
   
   // Update header:
   <View style={[styles.header, { alignItems: 'center', gap: semantic.space.sm }]}>
     <Text variant="titleMedium" style={{ color: semantic.color.onSurface.default }}>
       Plan Ride
     </Text>
     <Badge
       variant="default"
       size="sm"
       testID="motorcycle-badge"
     >
       Motorcycle
     </Badge>
   </View>
   
   // Add to styles:
   const styles = StyleSheet.create({
     // ... existing styles
     header: {
       flexDirection: 'row',
       justifyContent: 'center',
     },
   })
   ```

2. **Enhance action button with icon**
   ```typescript
   import { IconSymbol } from '../ui/icon-symbol'
   
   // Update action button:
   <Button
     variant="default"
     size="lg"
     disabled={!startStop || !endStop || isPlanning}
     onPress={onPlanRide}
     icon={<IconSymbol name="motorbike" size={20} color={semantic.color.onPrimary.default} />}
     style={{ marginTop: semantic.space.md }}
     testID="plan-ride-submit"
   >
     {isPlanning ? 'Planning...' : 'Plan Ride'}
   </Button>
   ```

### Phase 5: New Component Extraction

**New components to create:**

1. **`components/sheets/route-timeline.tsx`** - Timeline visualization component
2. **`components/sheets/plan-ride-inputs.tsx`** - Input fields with swap functionality
3. **Use existing components**: `Switch` from `components/ui/switch.tsx`, `ToggleGroup` from `components/ui/toggle-group.tsx`, `Badge` from `components/ui/badge.tsx`, `IconSymbol` from `components/ui/icon-symbol.tsx`

## Implementation Details

### RouteTimeline Component

```typescript
// components/sheets/route-timeline.tsx
import { View } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { StyleSheet } from 'react-native'
import type { RouteStop } from '../../types/routes'

type RouteTimelineProps = {
  startPoint?: RouteStop | null
  endPoint?: RouteStop | null
}

export const RouteTimeline = ({ startPoint, endPoint }: RouteTimelineProps) => {
  const { semantic } = useSemanticTheme()
  
  return (
    <View style={[styles.timelineContainer, { paddingVertical: semantic.space.sm }]}>
      <View style={styles.timelineContent}>
        {/* Start dot */}
        {startPoint && (
          <View
            style={[
              styles.timelineDot,
              {
                width: semantic.space.sm,
                height: semantic.space.sm,
                borderRadius: semantic.radius.full,
                backgroundColor: semantic.color.primary.default,
              }
            ]}
          />
        )}
        
        {/* Gradient line */}
        {(startPoint || endPoint) && (
          <View
            style={[
              styles.timelineLine,
              {
                flex: 1,
                height: 2,
                backgroundColor: semantic.color.border.default,
              }
            ]}
          />
        )}
        
        {/* End dot */}
        {endPoint && (
          <View
            style={[
              styles.timelineDot,
              {
                width: semantic.space.sm,
                height: semantic.space.sm,
                borderRadius: semantic.radius.full,
                backgroundColor: semantic.color.muted.default,
              }
            ]}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  timelineContainer: {
    alignItems: 'center',
  },
  timelineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  timelineDot: {
    elevation: 2,
  },
  timelineLine: {
    marginHorizontal: 8, // Fixed spacing for consistency
  }
})
```

### PlanRideInputs Component

```typescript
// components/sheets/plan-ride-inputs.tsx
import { View, Pressable } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { Input } from '../ui/input'
import { IconSymbol } from '../ui/icon-symbol'
import { StyleSheet } from 'react-native'
import type { PlanRideInput } from '../../types/routes'

type PlanRideInputsProps = PlanRideInput

export const PlanRideInputs = ({
  currentLocation,
  destination,
  onCurrentLocationChange,
  onDestinationChange,
}: PlanRideInputsProps) => {
  const { semantic } = useSemanticTheme()
  
  const handleSwap = () => {
    if (onCurrentLocationChange && onDestinationChange) {
      const temp = currentLocation
      onCurrentLocationChange(destination || '')
      onDestinationChange(temp || '')
    }
  }
  
  return (
    <View style={[styles.container, { gap: semantic.space.sm }]}>
      <Input
        label="Current Location"
        value={currentLocation || ''}
        onChangeText={onCurrentLocationChange}
        placeholder="Enter current location"
        left={<IconSymbol name="map-marker" size={20} color={semantic.color.onSurface.muted} />}
        testID="current-location-input"
      />
      
      <View style={styles.swapContainer}>
        <Pressable
          onPress={handleSwap}
          style={[
            styles.swapButton,
            {
              backgroundColor: semantic.color.surface.default,
              borderColor: semantic.color.border.default,
            }
          ]}
          testID="swap-locations-button"
        >
          <IconSymbol
            name="swap-vertical"
            size={20}
            color={semantic.color.onSurface.muted}
          />
        </Pressable>
      </View>
      
      <Input
        label="Where to?"
        value={destination || ''}
        onChangeText={onDestinationChange}
        placeholder="Enter destination"
        left={<IconSymbol name="magnify" size={20} color={semantic.color.onSurface.muted} />}
        testID="destination-input"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  swapContainer: {
    alignItems: 'center',
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
```

## Benefits

1. ✅ **Improved UX**: Visual timeline provides clear route visualization
2. ✅ **Better Input Flow**: Dedicated input fields with swap button for easy editing
3. ✅ **Clearer Controls**: ToggleGroup and labeled switches more intuitive than button toggles
4. ✅ **Design Fidelity**: Matches design specification with proper visual hierarchy
5. ✅ **Component Reusability**: Extracted components can be used elsewhere
6. ✅ **Maintains Patterns**: Follows semantic theme, React Native Paper, and project standards
7. ✅ **Accessibility**: Better labeled controls and visual indicators
8. ✅ **Consistent Styling**: Uses existing UI components (Switch, ToggleGroup, Badge, IconSymbol)
9. ✅ **Proper TypeScript**: Extends existing types rather than duplicating

## Testing Strategy

### E2E Tests to Add

1. **Input Field Tests**
   - Verify current location input accepts text
   - Verify destination input accepts text
   - Verify swap button exchanges values

2. **Timeline Visualization Tests**
   - Verify timeline dots appear when start/end points are set
   - Verify timeline line connects dots

3. **Toggle Controls Tests**
   - Verify scenic bias toggle group works
   - Verify avoid highways switch toggles
   - Verify avoid tolls switch toggles

4. **Action Button Tests**
   - Verify motorcycle badge appears in header
   - Verify motorbike icon appears in action button
   - Verify button is disabled without start/end points

## Implementation Notes

1. **Follow Project Patterns**: All components use semantic theme, no hardcoded values
2. **Use Existing Components**: Leverage UI components from `components/ui/` rather than creating new ones
3. **StyleSheet Best Practices**: Use StyleSheet.create() for static styles, inline for dynamic theme values
4. **Icon Handling**: Use `IconSymbol` component for consistent icon rendering across platforms
5. **Type Safety**: Extend existing types rather than duplicating
6. **Test IDs**: Add testID props to all interactive elements for E2E testing