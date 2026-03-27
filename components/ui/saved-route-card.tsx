/**
 * SavedRouteCard Component
 *
 * Saved route card with thumbnail, name, path, and stats
 * Follows the design system card patterns
 */

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Pressable, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../../styles/types'
import { RouteThumbnail } from './route-thumbnail'
import type { SavedRouteCardProps } from './saved-route-card.types'

export type { SavedRouteCardProps }

/**
 * SavedRouteCard component for saved routes list
 * Displays route with thumbnail, name, path, and stats
 */
export const SavedRouteCard = ({
  name,
  path,
  dateSaved,
  duration = '',
  distance = '',
  onPress,
  thumbnailRotation = -10,
}: SavedRouteCardProps) => {
  const theme = useTheme<ExtendedTheme>()
  const { semantic } = theme

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View route: ${name}`}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          gap: semantic.space.md,
          borderRadius: semantic.radius.lg,
          padding: semantic.space.lg,
          marginBottom: semantic.space.md,
          borderWidth: 1,
          backgroundColor: semantic.color.card.default,
          borderColor: semantic.color.divider.default,
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      <RouteThumbnail rotation={thumbnailRotation} />

      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={[
            semantic.type.title.md,
            {
              color: semantic.color.onSurface.default,
              marginBottom: semantic.space.xs,
            },
          ]}
        >
          {name}
        </Text>
        {dateSaved && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: semantic.space.xs,
              marginBottom: semantic.space.xs,
            }}
          >
            <MaterialCommunityIcons
              name="calendar-outline"
              size={14}
              color={semantic.color.onSurface.subtle}
            />
            <Text
              style={[
                semantic.type.label.sm,
                { color: semantic.color.onSurface.subtle },
              ]}
            >
              {dateSaved}
            </Text>
          </View>
        )}
        <Text
          style={[
            semantic.type.body.sm,
            {
              color: semantic.color.onSurface.default,
              marginBottom: semantic.space.sm,
            },
          ]}
        >
          {path}
        </Text>

        {(duration || distance) && (
          <View style={{ flexDirection: 'row', gap: semantic.space.md }}>
            {duration && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: semantic.space.xs,
                }}
              >
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={16}
                  color={semantic.color.onSurface.subtle}
                />
                <Text
                  style={[
                    semantic.type.label.sm,
                    { color: semantic.color.onSurface.subtle },
                  ]}
                >
                  {duration}
                </Text>
              </View>
            )}
            {distance && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: semantic.space.xs,
                }}
              >
                <MaterialCommunityIcons
                  name="map-marker-distance"
                  size={16}
                  color={semantic.color.onSurface.subtle}
                />
                <Text
                  style={[
                    semantic.type.label.sm,
                    { color: semantic.color.onSurface.subtle },
                  ]}
                >
                  {distance}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={semantic.color.onSurface.subtle}
        />
      </View>
    </Pressable>
  )
}
