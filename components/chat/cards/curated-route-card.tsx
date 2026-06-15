'use client'

import { Pressable, StyleSheet, View } from 'react-native'
import { Icon, Text } from 'react-native-paper'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'

interface CuratedRouteCardProps {
  routeOptionId: string
  label: string
  rationale?: string
  compositeScore?: number
  isSelected: boolean
  onSelect: () => void
  onViewOnMap?: () => void
}

export const CuratedRouteCard = ({
  routeOptionId,
  label,
  rationale,
  compositeScore,
  isSelected,
  onSelect,
}: CuratedRouteCardProps) => {
  const { semantic } = useSemanticTheme()
  const scorePercent = compositeScore != null ? `${Math.round(compositeScore * 100)}/100` : null

  return (
    <Pressable
      onPress={onSelect}
      testID={`curated-route-card-${routeOptionId}`}
      accessibilityLabel={`Curated route: ${label}`}
      accessibilityRole="button"
    >
      {({ pressed }) => (
        <View
          style={[
            styles.card,
            {
              backgroundColor: pressed
                ? semantic.color.surfaceVariant.default
                : semantic.color.surface.default,
              borderColor: isSelected
                ? semantic.color.primary.default
                : semantic.color.border.default,
            },
          ]}
        >
          <View style={[styles.header, { gap: semantic.space.sm }]}>
            <View style={styles.headerLeft}>
              <Icon source="road-variant" size={18} color={semantic.color.primary.default} />
              <Text
                style={[
                  semantic.type.body.md,
                  {
                    color: semantic.color.onSurface.default,
                    fontWeight: '600',
                  },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
            {scorePercent && (
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: semantic.color.primary.default,
                }}
              >
                {scorePercent}
              </Text>
            )}
          </View>
          {rationale && (
            <Text
              style={[
                semantic.type.body.sm,
                {
                  color: semantic.color.onSurface.muted,
                },
              ]}
              numberOfLines={2}
            >
              {rationale}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 60,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
})
