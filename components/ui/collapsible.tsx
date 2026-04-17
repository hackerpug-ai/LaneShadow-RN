import { type PropsWithChildren, useState } from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'

import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { ThemedText } from '../themed-text'
import { ThemedView } from '../themed-view'
import { IconSymbol } from '../ui/icon-symbol'

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const { semantic } = useSemanticTheme()

  return (
    <ThemedView>
      <TouchableOpacity
        style={[
          styles.heading,
          {
            gap: semantic.space.sm,
          },
        ]}
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.8}
      >
        <IconSymbol
          name="chevron-right"
          size={18}
          weight="medium"
          color={semantic.color.onSurface.muted || semantic.color.onSurface.default}
          style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
        />

        <ThemedText type="defaultSemiBold">{title}</ThemedText>
      </TouchableOpacity>
      {isOpen && (
        <ThemedView
          style={{
            marginTop: semantic.space.sm,
            marginLeft: semantic.space.xl,
          }}
        >
          {children}
        </ThemedView>
      )}
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
