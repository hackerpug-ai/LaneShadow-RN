/**
 * FavoriteRoadCard Component
 *
 * Card component that displays a favorite road with name and mini map preview.
 * Follows the design system card patterns and supports delete action with confirmation.
 */

import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { Doc } from '../../convex/_generated/dataModel'
import { Card } from './card'
import { RouteThumbnail } from './route-thumbnail'
import { Button } from './button'

export type FavoriteRoadCardProps = {
  /** Favorite road document from Convex */
  favorite: Doc<'favorite_roads'>
  /** Callback when delete is confirmed */
  onDelete: () => void
  /** Test ID for testing */
  testID?: string
}

/**
 * FavoriteRoadCard component for favorite roads list
 * Displays road with mini map preview, name, and delete action
 */
export const FavoriteRoadCard = ({
  favorite,
  onDelete,
  testID = 'favorite-road-card',
}: FavoriteRoadCardProps) => {
  const { semantic } = useSemanticTheme()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDeleteConfirm = () => {
    setShowDeleteDialog(false)
    onDelete()
  }

  return (
    <>
      <View testID={testID}>
        <Card>
        <View style={styles.content}>
          <RouteThumbnail
            testID="route-thumbnail"
            width={60}
            height={60}
            bounds={favorite.bounds ?? undefined}
          />

          <View style={styles.textContainer}>
            <Text
              numberOfLines={1}
              style={[
                semantic.type.title.md,
                { color: semantic.color.onSurface.default },
              ]}
            >
              {favorite.name}
            </Text>
            <Text
              style={[
                semantic.type.body.sm,
                {
                  color: semantic.color.onSurface.muted,
                  marginTop: semantic.space.xs,
                },
              ]}
            >
              Favorite road
            </Text>
          </View>

          <Button
            testID="delete-button"
            variant="ghost"
            size="icon"
            icon="trash-can-outline"
            accessibilityLabel="Delete favorite"
            onPress={() => setShowDeleteDialog(true)}
          />
        </View>
        </Card>
      </View>

      <DeleteFavoriteDialog
        visible={showDeleteDialog}
        favoriteName={favorite.name}
        onConfirm={handleDeleteConfirm}
        onDismiss={() => setShowDeleteDialog(false)}
        testID="delete-favorite-dialog"
      />
    </>
  )
}

/**
 * Delete confirmation dialog for favorite roads
 */
type DeleteFavoriteDialogProps = {
  visible: boolean
  favoriteName: string
  onConfirm: () => void
  onDismiss: () => void
  testID?: string
}

const DeleteFavoriteDialog = ({
  visible,
  favoriteName,
  onConfirm,
  onDismiss,
  testID = 'delete-favorite-dialog',
}: DeleteFavoriteDialogProps) => {
  const { semantic } = useSemanticTheme()

  if (!visible) {
    return null
  }

  return (
    <View
      testID={testID}
      style={[
        styles.dialogOverlay,
        { backgroundColor: semantic.color.surface.default },
      ]}
    >
      <View
        style={[
          styles.dialogContent,
          {
            backgroundColor: semantic.color.surface.default,
            borderRadius: semantic.radius.lg,
            padding: semantic.space.lg,
            ...semantic.elevation[4],
          },
        ]}
      >
        <Text
          style={[
            semantic.type.title.lg,
            {
              color: semantic.color.onSurface.default,
              marginBottom: semantic.space.md,
            },
          ]}
        >
          Delete Favorite Road
        </Text>
        <Text
          style={[
            semantic.type.body.md,
            {
              color: semantic.color.onSurface.default,
              marginBottom: semantic.space.lg,
            },
          ]}
        >
          Remove &ldquo;{favoriteName}&rdquo; from your favorites?
        </Text>
        <View style={styles.dialogActions}>
          <Button
            testID={`${testID}-cancel`}
            variant="secondary"
            onPress={onDismiss}
            style={{ flex: 1, marginRight: semantic.space.sm }}
          >
            Cancel
          </Button>
          <Button
            testID={`${testID}-confirm`}
            variant="destructive"
            onPress={onConfirm}
            style={{ flex: 1, marginLeft: semantic.space.sm }}
          >
            Delete
          </Button>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16, // semantic.space.md
  },
  textContainer: {
    flex: 1,
  },
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  dialogContent: {
    width: '80%',
    maxWidth: 400,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
})
