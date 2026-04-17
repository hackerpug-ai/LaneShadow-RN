/**
 * Color Token Stories
 * Showcases the Lane Shadow semantic color system
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../../styles/types'

/**
 * Color swatch component for displaying a single color
 */
const ColorSwatch = ({
  name,
  color,
  textColor = '#FFFFFF',
}: {
  name: string
  color: string
  textColor?: string
}) => (
  <View style={[styles.swatch, { backgroundColor: color }]}>
    <Text style={[styles.swatchName, { color: textColor }]}>{name}</Text>
    <Text style={[styles.swatchValue, { color: textColor }]}>{color}</Text>
  </View>
)

/**
 * Color group component for displaying related colors
 */
const ColorGroup = ({
  title,
  colors,
}: {
  title: string
  colors: { name: string; color: string; textColor?: string }[]
}) => (
  <View style={styles.group}>
    <Text style={styles.groupTitle}>{title}</Text>
    <View style={styles.swatchRow}>
      {colors.map((c) => (
        <ColorSwatch key={c.name} {...c} />
      ))}
    </View>
  </View>
)

/**
 * Main colors display component
 */
const ColorsDisplay = () => {
  const theme = useTheme<ExtendedTheme>()
  const { semantic } = theme

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Lane Shadow Color System</Text>
      <Text style={styles.subtitle}>Copper + Dark Industrial Palette</Text>

      <ColorGroup
        title="Brand Colors"
        colors={[
          { name: 'Primary (Copper)', color: semantic.color.primary.default, textColor: '#0E0F11' },
          { name: 'Primary Hover', color: semantic.color.primary.hover || '#C58545', textColor: '#0E0F11' },
          { name: 'Primary Pressed', color: semantic.color.primary.pressed || '#8C5A2B' },
          { name: 'Primary Disabled', color: semantic.color.primary.disabled || '#6A3F1F' },
        ]}
      />

      <ColorGroup
        title="Surface Colors"
        colors={[
          { name: 'Background', color: semantic.color.background.default },
          { name: 'Surface', color: semantic.color.surface.default },
          { name: 'Surface Variant', color: semantic.color.surfaceVariant.default },
          { name: 'Card', color: semantic.color.card.default },
        ]}
      />

      <ColorGroup
        title="Intent Colors"
        colors={[
          { name: 'Success', color: semantic.color.success.default },
          { name: 'Warning', color: semantic.color.warning.default, textColor: '#0E0F11' },
          { name: 'Danger', color: semantic.color.danger.default },
          { name: 'Info', color: semantic.color.info.default },
        ]}
      />

      <ColorGroup
        title="Text Colors (On Surface)"
        colors={[
          { name: 'Default', color: '#2B2725' },
          { name: 'Muted', color: '#4A4745' },
          { name: 'Subtle', color: '#6B6865' },
          { name: 'Disabled', color: '#9B9895' },
        ]}
      />

      <ColorGroup
        title="UI Elements"
        colors={[
          { name: 'Border', color: semantic.color.border.default },
          { name: 'Input', color: semantic.color.input.default },
          { name: 'Ring (Focus)', color: semantic.color.ring.default, textColor: '#0E0F11' },
          { name: 'Orange Accent', color: semantic.color.orange.default },
        ]}
      />

      <ColorGroup
        title="Route Colors"
        colors={[
          { name: 'Route Selected', color: semantic.color.routeSelected.default, textColor: '#0E0F11' },
          { name: 'Route Alternate', color: 'rgba(255,255,255,0.45)' },
        ]}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 16,
  },
  group: {
    gap: 12,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.72)',
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  swatch: {
    width: 140,
    height: 80,
    borderRadius: 8,
    padding: 8,
    justifyContent: 'flex-end',
  },
  swatchName: {
    fontSize: 12,
    fontWeight: '600',
  },
  swatchValue: {
    fontSize: 10,
    fontFamily: 'monospace',
    opacity: 0.8,
  },
})

const meta: Meta<typeof ColorsDisplay> = {
  title: 'Tokens/Colors',
  component: ColorsDisplay,
}

export default meta
type Story = StoryObj<typeof ColorsDisplay>

export const Default: Story = {}
