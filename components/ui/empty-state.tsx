/**
 * EmptyState Component
 * Generic reusable empty state with icon, headline, body, and optional CTA button.
 *
 * Usage:
 * ```tsx
 * <EmptyState
 *   icon="map-marker-path"
 *   headline="No saved routes yet"
 *   body="Plan a route and save it to see it here."
 *   ctaLabel="Plan your first route"
 *   onCtaPress={() => router.push('/(app)/(tabs)')}
 * />
 * ```
 */

import { IconSymbol, type IconName } from './icon-symbol'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'

import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { Button } from './button'

export type EmptyStateProps = {
  icon: IconName
  headline: string
  body: string
  ctaLabel?: string
  onCtaPress?: () => void
  testID?: string
}

export const EmptyState = ({
  icon,
  headline,
  body,
  ctaLabel,
  onCtaPress,
  testID,
}: EmptyStateProps) => {
  const { semantic } = useSemanticTheme()

  return (
    <View testID={testID ?? 'empty-state'} style={styles.container}>
      <View
        testID={testID ? `${testID}-icon` : 'empty-state-icon'}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <IconSymbol
          name={icon as IconName}
          size={64}
          color={semantic.color.onSurface.muted}
        />
      </View>
      <View
        accessible
        accessibilityLabel={`${headline}. ${body}`}
        style={{ marginTop: semantic.space.lg }}
      >
        <Text
          variant="titleMedium"
          style={{ color: semantic.color.onSurface.default, textAlign: 'center' }}
        >
          {headline}
        </Text>
        <Text
          variant="bodyMedium"
          style={{
            color: semantic.color.onSurface.subtle,
            textAlign: 'center',
            marginTop: semantic.space.sm,
          }}
        >
          {body}
        </Text>
      </View>
      {onCtaPress && ctaLabel ? (
        <Button
          variant="default"
          size="lg"
          onPress={onCtaPress}
          style={{ marginTop: semantic.space.xl }}
          testID={testID ? `${testID}-cta` : 'empty-state-cta'}
        >
          {ctaLabel}
        </Button>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
