/**
 * Location Input Component
 * Input field with Google Places autocomplete support
 *
 * Follows project patterns: semantic theme, uses @components/ui/input.tsx
 */

import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { usePlaceAutocomplete } from '../hooks/use-place-autocomplete'
import { useSemanticTheme } from '../hooks/use-semantic-theme'
import { RouteStop } from '../types'
import { IconSymbol, type IconName } from './ui/icon-symbol'
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
    [clear, onChangeText, onPlaceSelected, selectPlace, setFocusedInput]
  )

  return (
    <View style={[styles.inputContainer, hasSuggestions && styles.inputContainerWithSuggestions]}>
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
            }}
            testID={testID}
            onFocus={() => setFocusedInput(inputType)}
          />
        </View>
      </View>

      {/* Suggestions dropdown */}
      {hasSuggestions && (
        <View
          style={[
            styles.suggestions,
            {
              backgroundColor: semantic.color.surface.default,
              borderColor: semantic.color.border.default,
              borderRadius: semantic.radius.lg,
              borderWidth: 1,
              shadowOpacity: 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 2,
            },
          ]}
          testID={`${inputType}-suggestions`}
        >
          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
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
                    onPress={() => handleSelectPlace(item.placeId, item.primaryText || item.description)}
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
          </ScrollView>
        </View>
      )}
    </View>
  )
}

const transparent = 'transparent'

const styles = StyleSheet.create({
  inputContainer: {
    width: '100%',
    position: 'relative',
    zIndex: 1,
  },
  inputContainerWithSuggestions: {
    zIndex: 10,
  },
  innerInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputInner: {
    flex: 1,
  },
  suggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
  },
  suggestionRow: {
    gap: 4,
  },
})
