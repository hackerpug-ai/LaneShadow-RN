import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

type RouteSearchBarProps = {
  onSearch: (query: string) => void
  testID?: string
}

export const RouteSearchBar = ({ onSearch, testID = 'route-search-bar' }: RouteSearchBarProps) => {
  const { semantic } = useSemanticTheme()
  const [text, setText] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = (value: string) => {
    setText(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onSearch(value), 300)
  }

  const handleClear = () => {
    setText('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    onSearch('')
  }

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    },
    []
  )

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: semantic.color.surfaceVariant.default,
          borderRadius: semantic.radius.lg,
          paddingVertical: semantic.space.sm,
          paddingHorizontal: semantic.space.md,
          gap: semantic.space.sm,
        },
      ]}
    >
      <MaterialCommunityIcons
        name="magnify"
        size={20}
        color={semantic.color.onSurface.subtle}
        testID={`${testID}-icon`}
      />
      <TextInput
        testID={`${testID}-input`}
        value={text}
        onChangeText={handleChange}
        placeholder="Search routes..."
        placeholderTextColor={semantic.color.onSurface.subtle}
        style={[
          styles.input,
          {
            color: semantic.color.onSurface.default,
            ...semantic.type.body.md,
          },
        ]}
      />
      {text.length > 0 && (
        <Pressable onPress={handleClear} testID={`${testID}-clear`}>
          <MaterialCommunityIcons
            name="close-circle"
            size={18}
            color={semantic.color.onSurface.subtle}
          />
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: 0,
  },
})
