/**
 * EnrichmentStatusBadge
 *
 * Badge showing enrichment status with color-coded indicator.
 * Status variants: draft, partial, complete, failed.
 * Uses semantic tokens for all colors, respects reduce-motion for icon animation.
 *
 * Accessibility:
 *   - Screen reader announces status label
 *   - 44px minimum touch target when interactive
 *
 * Reuses Badge component pattern from components/ui/badge.tsx
 */

import type React from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { type IconName, IconSymbol } from '../ui/icon-symbol'
import type { EnrichmentStatus } from './enrichment-progress-provider'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EnrichmentStatusBadgeProps {
  /** Current enrichment status */
  status: EnrichmentStatus
  /** Compact size variant for card headers */
  size?: 'small' | 'medium'
  /** Test ID for testing */
  testID?: string
}

// ---------------------------------------------------------------------------
// Status configuration
// ---------------------------------------------------------------------------

interface StatusConfig {
  label: string
  icon: IconName
  getColor: (semantic: ReturnType<typeof useSemanticTheme>['semantic']) => string
}

const STATUS_CONFIG: Record<EnrichmentStatus, StatusConfig> = {
  draft: {
    label: 'Draft',
    icon: 'clock-outline',
    getColor: (semantic) => semantic.color.onSurface.subtle!,
  },
  partial: {
    label: 'Partial',
    icon: 'check-circle-outline',
    getColor: (semantic) => semantic.color.enrichmentFast!.default,
  },
  complete: {
    label: 'Complete',
    icon: 'star-outline',
    getColor: (semantic) => semantic.color.enrichmentExtended!.default,
  },
  failed: {
    label: 'Failed',
    icon: 'alert-circle-outline',
    getColor: (semantic) => semantic.color.danger.default,
  },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const EnrichmentStatusBadge = ({
  status,
  size = 'small',
  testID,
}: EnrichmentStatusBadgeProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  const config = STATUS_CONFIG[status]
  const color = config.getColor(semantic)
  const isSmall = size === 'small'

  const backgroundColor = color + '1A' // 10% opacity
  const borderColor = color + '4D' // 30% opacity

  return (
    <View
      style={[
        styles.container,
        isSmall ? styles.smallPadding : styles.mediumPadding,
        {
          backgroundColor,
          borderColor,
          borderRadius: semantic.radius.lg,
        },
      ]}
      accessibilityLabel={`Enrichment status: ${config.label}`}
      accessibilityRole="text"
      testID={testID ?? `enrichment-status-badge-${status}`}
    >
      <IconSymbol
        name={config.icon}
        size={isSmall ? 14 : 16}
        color={color}
        testID={`${testID ?? 'enrichment-status-badge'}-icon`}
      />
      <Text
        style={[
          isSmall ? semantic.type.label.sm : semantic.type.label.md,
          { color, marginLeft: semantic.space.xs },
        ]}
        testID={`${testID ?? 'enrichment-status-badge'}-label`}
      >
        {config.label}
      </Text>
    </View>
  )
}

EnrichmentStatusBadge.displayName = 'EnrichmentStatusBadge'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  smallPadding: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  mediumPadding: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
})
