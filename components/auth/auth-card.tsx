import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

type AuthCardProps = {
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export const AuthCard = ({ title, children, footer }: AuthCardProps) => {
  const { semantic } = useSemanticTheme()

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: semantic.color.card.default,
          borderColor: semantic.color.border.default,
          borderRadius: semantic.radius.lg,
          padding: semantic.space.lg,
          gap: semantic.space.md,
        },
      ]}
    >
      {title ? (
        <Text variant="titleMedium" style={{ color: semantic.color.onSurface.default }}>
          {title}
        </Text>
      ) : null}
      <View style={{ gap: semantic.space.md }}>{children}</View>
      {footer}
    </View>
  )
}

export const AuthDivider = ({ label }: { label: string }) => {
  const { semantic } = useSemanticTheme()

  return (
    <View
      style={[
        styles.dividerRow,
        {
          gap: semantic.space.sm,
        },
      ]}
    >
      <View style={[styles.dividerLine, { backgroundColor: semantic.color.divider.default }]} />
      <Text variant="labelMedium" style={{ color: semantic.color.onSurface.subtle }}>
        {label}
      </Text>
      <View style={[styles.dividerLine, { backgroundColor: semantic.color.divider.default }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
})
