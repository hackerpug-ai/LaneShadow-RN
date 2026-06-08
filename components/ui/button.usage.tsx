/**
 * Button Component Usage Examples
 * Demonstrates the new auto-icon rendering feature
 *
 * The Button component now automatically renders IconSymbol when you pass
 * an icon name (string) instead of requiring you to wrap it manually.
 */

import { Button } from './button'
import { IconSymbol } from './icon-symbol'

/**
 * OLD WAY (still works) - Manual IconSymbol wrapping
 */
export function OldButtonExample() {
  return (
    <Button icon={<IconSymbol name="motorbike" size={20} color="white" />} onPress={() => {}}>
      Plan Ride
    </Button>
  )
}

/**
 * NEW WAY - Just pass the icon name as a string
 * Button automatically renders IconSymbol with correct color based on variant/state
 */
export function NewButtonExample() {
  return (
    <Button icon="motorbike" onPress={() => {}}>
      Plan Ride
    </Button>
  )
}

/**
 * More examples with different icons
 */
export function IconExamples() {
  return (
    <>
      {/* Search icon */}
      <Button icon="search">Search</Button>

      {/* Map marker */}
      <Button icon="map-marker" variant="outline">
        Add Location
      </Button>

      {/* Navigation arrow */}
      <Button icon="arrow-right" iconPosition="right">
        Continue
      </Button>

      {/* Icon-only button */}
      <Button icon="close" size="icon" />

      {/* Custom icon element (old way still works for full control) */}
      <Button icon={<IconSymbol name="star" size={24} color="gold" />}>Favorite</Button>
    </>
  )
}

/**
 * Benefits of auto-icon rendering:
 *
 * 1. Less boilerplate - No need to import IconSymbol
 * 2. Automatic coloring - Icon color matches button state (pressed/disabled)
 * 3. Cleaner API - Just pass the icon name string
 * 4. Backward compatible - Still supports custom icon elements
 * 5. Consistent sizing - Default size of 20px matches button design
 */
