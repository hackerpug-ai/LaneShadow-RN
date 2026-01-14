import { Pressable, StyleSheet, View } from 'react-native'
import { Icon } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { Input } from './input'

export type FloatingSearchInputProps = {
  value: string
  onChangeText: (text: string) => void
  placeholder: string
  onClear?: () => void
  onPress?: () => void
  testID?: string
}

export const FloatingSearchInput = ({
  value,
  onChangeText,
  placeholder,
  onClear,
  onPress,
  testID,
}: FloatingSearchInputProps) => {
  const { semantic } = useSemanticTheme()

  const handleClear = () => {
    onClear?.()
  }

  const searchIconSize = semantic.space.xl

  const isPressableOnly = Boolean(onPress)

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: semantic.color.surfaceVariant.default,
          borderColor: semantic.color.border.default,
          borderRadius: semantic.radius.xl,
          paddingHorizontal: semantic.space.md,
          paddingVertical: semantic.space.xs,
        },
      ]}
      testID={testID ? `${testID}-pressable` : 'floating-search-pressable'}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? placeholder : undefined}
    >
      <View style={[styles.leftIcon, { marginRight: semantic.space.sm }]}>
        <Icon source="magnify" size={searchIconSize} color={semantic.color.onSurface.subtle} />
      </View>

      <View style={styles.inputWrap} pointerEvents={isPressableOnly ? 'none' : 'auto'}>
        <Input
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          testID={testID ? `${testID}-input` : 'floating-search-input'}
          autoCorrect={false}
          autoCapitalize="none"
          numberOfLines={1}
          scrollEnabled={false}
          editable={!isPressableOnly}
          style={{
            backgroundColor: 'transparent',
            borderWidth: 0,
            paddingHorizontal: 0,
            paddingRight: semantic.space['2xl'],
            flex: 1,
            minWidth: 0,
            flexShrink: 1,
            maxWidth: '100%',
          }}
          inputStyle={{
            paddingHorizontal: 0,
            height: undefined,
            flex: 1,
            minWidth: 0,
            flexShrink: 1,
            maxWidth: '100%',
          }}
        />
      </View>

      {value.length > 0 ? (
        <Pressable
          onPress={handleClear}
          accessibilityLabel="Clear search"
          hitSlop={{
            top: semantic.space.xs,
            bottom: semantic.space.xs,
            left: semantic.space.xs,
            right: semantic.space.xs,
          }}
          style={({ pressed }) => [
            styles.clearButton,
            {
              paddingHorizontal: semantic.space.xs,
              paddingVertical: semantic.space.xs,
              right: semantic.space.sm,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          testID={testID ? `${testID}-clear` : 'floating-search-clear'}
        >
          <Icon source="close" size={18} color={semantic.color.onSurface.default} />
        </Pressable>
      ) : null}
    </Pressable>
  )
}

FloatingSearchInput.displayName = 'FloatingSearchInput'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
  },
  leftIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    minWidth: 0,
  },
  clearButton: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
