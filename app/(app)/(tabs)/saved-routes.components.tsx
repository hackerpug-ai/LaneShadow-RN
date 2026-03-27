import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'

import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import { Skeleton } from '../../../components/ui/skeleton'

// ---------------------------------------------------------------------------
// SkeletonCard – loading placeholder for a single saved-route row
// ---------------------------------------------------------------------------

export const SkeletonCard = () => {
  const { semantic } = useSemanticTheme()
  return (
    <View
      testID="skeleton-card"
      style={[
        styles.skeletonCard,
        {
          backgroundColor: semantic.color.card.default,
          borderRadius: semantic.radius.lg,
          padding: semantic.space.md,
          marginBottom: semantic.space.md,
          gap: semantic.space.md,
        },
      ]}
    >
      <Skeleton width={96} height={96} shape="rounded" />
      <View style={styles.skeletonText}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="80%" height={14} style={{ marginTop: semantic.space.sm }} />
        <Skeleton width="40%" height={13} style={{ marginTop: semantic.space.sm }} />
      </View>
    </View>
  )
}

// ---------------------------------------------------------------------------
// EmptyPlaceholder – shown when the user has no saved routes
// ---------------------------------------------------------------------------

export const EmptyPlaceholder = () => {
  const { semantic } = useSemanticTheme()
  return (
    <View
      testID="empty-state"
      style={[styles.emptyContainer, { paddingTop: semantic.space['4xl'] }]}
    >
      <Text
        variant="bodyLarge"
        style={{ color: semantic.color.onSurface.muted, textAlign: 'center' }}
      >
        No saved routes yet. Plan a ride to get started!
      </Text>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  skeletonCard: {
    flexDirection: 'row',
  },
  skeletonText: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
