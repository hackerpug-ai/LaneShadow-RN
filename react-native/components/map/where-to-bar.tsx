import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'

import { usePlaceAutocomplete } from '../../hooks/use-place-autocomplete'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { RouteStop } from '../../types/routes'
import { FloatingSearchInput } from '../ui/floating-search-input'

export type WhereToBarProps = {
  onPlaceSelected: (place: RouteStop) => void
  onClear?: () => void
}

/**
 * Bottom-anchored “Where to?” search + planner icon button.
 * - Uses Places autocomplete (search-only).
 * - Renders suggestions above the bar.
 */
export const WhereToBar = ({ onPlaceSelected, onClear }: WhereToBarProps) => {
  const { semantic } = useSemanticTheme()
  const { predictions, isLoading, search, selectPlace, clear } = usePlaceAutocomplete()
  const [query, setQuery] = useState('')
  const [shouldShowSuggestions, setShouldShowSuggestions] = useState(false)

  const limitedPredictions = useMemo(() => predictions.slice(0, 3), [predictions])
  const showSuggestions = shouldShowSuggestions && (isLoading || limitedPredictions.length > 0)

  const handleSelect = useMemo(
    () => async (placeId: string, label: string) => {
      const details = await selectPlace(placeId)
      if (!details) return
      setQuery(label || details.label || '')
      clear()
      setShouldShowSuggestions(false)
      onPlaceSelected(details)
    },
    [clear, onPlaceSelected, selectPlace],
  )

  return (
    <View style={styles.container}>
      {showSuggestions ? (
        <View
          style={[
            styles.suggestions,
            {
              backgroundColor: semantic.color.surface.default,
              borderColor: semantic.color.border.default,
              borderRadius: semantic.radius.lg,
              maxWidth: 700,
              gap: semantic.space.xs,
              paddingVertical: semantic.space.xs,
            },
          ]}
          testID="where-to-suggestions"
        >
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <View
                  key={`skeleton-${index}`}
                  style={[
                    styles.suggestionRow,
                    {
                      paddingHorizontal: semantic.space.md,
                      paddingVertical: semantic.space.sm,
                      backgroundColor: semantic.color.surfaceVariant.default,
                    },
                  ]}
                  testID={`where-to-skeleton-${index}`}
                >
                  <View
                    style={{
                      height: semantic.space.md,
                      width: '70%',
                      borderRadius: semantic.radius.md,
                      backgroundColor: semantic.color.surface.default,
                    }}
                  />
                  <View
                    style={{
                      height: semantic.space.sm,
                      width: '50%',
                      borderRadius: semantic.radius.sm,
                      backgroundColor: semantic.color.surface.default,
                    }}
                  />
                </View>
              ))
            : limitedPredictions.map((item, index) => (
                <Pressable
                  key={item.placeId}
                  onPress={() => handleSelect(item.placeId, item.primaryText || item.description)}
                  style={({ pressed }) => [
                    styles.suggestionRow,
                    {
                      paddingHorizontal: semantic.space.md,
                      paddingVertical: semantic.space.sm,
                      backgroundColor: pressed
                        ? semantic.color.surfaceVariant.pressed
                        : semantic.color.surface.default,
                    },
                  ]}
                  testID={`where-to-suggestion-${index}`}
                >
                  <Text
                    variant="bodyMedium"
                    style={{ color: semantic.color.onSurface.default }}
                    numberOfLines={1}
                  >
                    {item.primaryText || item.description}
                  </Text>
                  {item.secondaryText ? (
                    <Text
                      variant="bodySmall"
                      style={{ color: semantic.color.onSurface.subtle }}
                      numberOfLines={1}
                    >
                      {item.secondaryText}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
        </View>
      ) : null}

      <View
        style={[
          styles.row,
          {
            gap: semantic.space.sm,
          },
        ]}
      >
        <FloatingSearchInput
          value={query}
          onChangeText={(text) => {
            setQuery(text)
            setShouldShowSuggestions(text.trim().length > 0)
            search(text)
          }}
          placeholder="Where to?"
          testID="where-to"
          onClear={() => {
            setQuery('')
            setShouldShowSuggestions(false)
            clear()
            onClear?.()
          }}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 0,
    width: '100%',
    flexBasis: 'auto',
    alignSelf: 'stretch',
    gap: 8,
    backgroundColor: 'transparent',
  },
  row: {
    flex: 1,
    minWidth: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
  },
  suggestions: {
    flex: 1,
    minWidth: 0,
    width: '100%',
    marginBottom: 8,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  suggestionRow: {
    gap: 4,
  },
})
