import { Pressable, StyleSheet, View } from 'react-native'
import { ActivityIndicator, Icon } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { Input } from './input'

export type FloatingSearchInputProps = {
  value: string
  onChangeText: (text: string) => void
  placeholder: string
  onClear?: () => void
  onPress?: () => void
  isLoading?: boolean
  onCancelLoading?: () => void
  testID?: string
}

export const FloatingSearchInput = ({
  value,
  onChangeText,
  placeholder,
  onClear,
  onPress,
  isLoading = false,
  onCancelLoading,
  testID,
}: FloatingSearchInputProps) => {
  const { semantic } = useSemanticTheme()

  const handleClear = () => {
    onClear?.()
  }

  const searchIconSize = semantic.space.xl
  const rightPadding = isLoading ? semantic.space['4xl'] : semantic.space['2xl']

  const isPressableOnly = Boolean(onPress)
  const canClear = value.length > 0 && !isLoading
  const canCancel = isLoading && onCancelLoading

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
            paddingRight: rightPadding,
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

      {isLoading ? (
        <View style={[styles.rightActions, { right: semantic.space.sm }]}>
          <ActivityIndicator
            size={semantic.space.md}
            color={semantic.color.onSurface.subtle}
            testID={testID ? `${testID}-loading` : 'floating-search-loading'}
          />
          {canCancel ? (
            <Pressable
              onPress={onCancelLoading}
              accessibilityLabel="Cancel planning"
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
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              testID={testID ? `${testID}-cancel-loading` : 'floating-search-cancel-loading'}
            >
              <Icon source="close" size={18} color={semantic.color.onSurface.default} />
            </Pressable>
          ) : null}
        </View>
      ) : canClear ? (
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
  rightActions: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
})
