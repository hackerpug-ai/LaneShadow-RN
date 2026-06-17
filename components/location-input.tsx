/**
 * Location Input Component
 * Input field with Google Places autocomplete support
 *
 * Follows project patterns: semantic theme, uses @components/ui/input.tsx
 */

import { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { usePlaceAutocomplete } from '../hooks/use-place-autocomplete'
import { useSemanticTheme } from '../hooks/use-semantic-theme'
import type { RouteStop } from '../shared/models/saved-routes'
import type { IconName } from './ui/icon-symbol'
import { Input } from './ui/input'

type LocationInputProps = {
  label: string
  value: string
  onChangeText?: (text: string) => void
  placeholder: string
  iconName: IconName
  testID: string
  inputType: 'current' | 'destination'
  focusedInput: 'current' | 'destination' | null
  setFocusedInput: (input: 'current' | 'destination' | null) => void
  onPlaceSelected?: (place: RouteStop) => void
}

export const LocationInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  iconName,
  testID,
  inputType,
  focusedInput,
  setFocusedInput,
  onPlaceSelected,
}: LocationInputProps) => {
  const { semantic } = useSemanticTheme()
  const { predictions, isLoading, search, selectPlace, clear } = usePlaceAutocomplete()

  const limitedPredictions = useMemo(() => predictions.slice(0, 3), [predictions])
  const isFocused = focusedInput === inputType
  const hasSuggestions = isFocused && (isLoading || limitedPredictions.length > 0)

  const handleSelectPlace = useMemo(
    () => async (placeId: string, label: string) => {
      const details = await selectPlace(placeId)
      if (!details) return

      onChangeText?.(label || details.label || '')
      onPlaceSelected?.(details)

      clear()
      setFocusedInput(null)
    },
    [clear, onChangeText, onPlaceSelected, selectPlace, setFocusedInput],
  )

  return (
    <View style={styles.inputContainer}>
      <View style={[styles.innerInputWrapper]}>
        <View style={styles.inputInner}>
          <Input
            label={label}
            value={value}
            onChangeText={(text) => {
              onChangeText?.(text)
              search(text)
            }}
            placeholder={placeholder}
            rightIcon={iconName}
            inputStyle={{
              paddingHorizontal: semantic.space.sm,
              // Remove bottom border radius when suggestions are showing
              ...(hasSuggestions
                ? {
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                  }
                : {}),
            }}
            testID={testID}
            onFocus={() => setFocusedInput(inputType)}
          />
        </View>
      </View>

      {/* Suggestions — flush with input, no border gap, fixed container height */}
      {hasSuggestions && (
        <View
          style={[
            styles.suggestions,
            {
              backgroundColor: semantic.color.surface.default,
              borderColor: semantic.color.border.default,
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderBottomWidth: 1,
              borderBottomLeftRadius: semantic.radius.lg,
              borderBottomRightRadius: semantic.radius.lg,
            },
          ]}
          testID={`${inputType}-suggestions`}
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
                  testID={`${inputType}-skeleton-${index}`}
                >
                  <View
                    style={{
                      height: semantic.space.md,
                      width: '70%',
                      borderRadius: semantic.radius.md,
                      backgroundColor: semantic.color.surface.default,
                    }}
                  />
                </View>
              ))
            : limitedPredictions.map((item, index) => (
                <Pressable
                  key={item.placeId}
                  onPress={() =>
                    handleSelectPlace(item.placeId, item.primaryText || item.description)
                  }
                  style={({ pressed }) => [
                    styles.suggestionRow,
                    {
                      paddingHorizontal: semantic.space.md,
                      paddingVertical: semantic.space.sm,
                      backgroundColor: pressed
                        ? semantic.color.surfaceVariant.pressed
                        : transparent,
                    },
                  ]}
                  testID={`${inputType}-suggestion-${index}`}
                >
                  <Text
                    variant="bodySmall"
                    style={{ color: semantic.color.onSurface.default }}
                    numberOfLines={1}
                  >
                    {item.primaryText || item.description}
                  </Text>
                </Pressable>
              ))}
        </View>
      )}
    </View>
  )
}

const transparent = 'transparent'

const styles = StyleSheet.create({
  inputContainer: {
    width: '100%',
  },
  innerInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputInner: {
    flex: 1,
  },
  suggestions: {
    // Flush with input — no gap, continuous visual
    marginTop: -1,
  },
  suggestionRow: {
    gap: 4,
  },
})
