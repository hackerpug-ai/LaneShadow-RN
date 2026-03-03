/**
 * Spacing Token Stories
 * Showcases the Lane Shadow spacing and radius system
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import { BORDER_RADIUS, SPACING } from '../../styles/theme'
import type { ExtendedTheme } from '../../styles/types'

/**
 * Spacing bar visualization
 */
const SpacingBar = ({ name, value }: { name: string; value: number }) => (
  <View style={styles.spacingItem}>
    <View style={styles.spacingLabel}>
      <Text style={styles.spacingName}>{name}</Text>
      <Text style={styles.spacingValue}>{value}px</Text>
    </View>
    <View style={[styles.spacingBar, { width: value * 4, maxWidth: 300 }]} />
  </View>
)

/**
 * Radius preview
 */
const RadiusPreview = ({ name, value }: { name: string; value: number }) => (
  <View style={styles.radiusItem}>
    <View style={[styles.radiusBox, { borderRadius: value }]} />
    <Text style={styles.radiusName}>{name}</Text>
    <Text style={styles.radiusValue}>{value}px</Text>
  </View>
)

/**
 * Elevation preview
 */
const ElevationPreview = ({ level }: { level: 0 | 1 | 2 | 3 | 4 | 5 }) => {
  const theme = useTheme<ExtendedTheme>()
  const elevation = theme.semantic.elevation[level]

  return (
    <View style={[styles.elevationBox, elevation]}>
      <Text style={styles.elevationLabel}>Level {level}</Text>
    </View>
  )
}

/**
 * Main spacing display component
 */
const SpacingDisplay = () => {
  const spacingEntries = Object.entries(SPACING) as Array<[string, number]>
  const radiusEntries = Object.entries(BORDER_RADIUS) as Array<[string, number]>

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Lane Shadow Spacing System</Text>
      <Text style={styles.subtitle}>4pt Grid Foundation</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Spacing Scale</Text>
        {spacingEntries.map(([name, value]) => (
          <SpacingBar key={name} name={name} value={value} />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Border Radius</Text>
        <View style={styles.radiusGrid}>
          {radiusEntries.map(([name, value]) => (
            <RadiusPreview key={name} name={name} value={value} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Elevation</Text>
        <View style={styles.elevationGrid}>
          {([0, 1, 2, 3, 4, 5] as const).map((level) => (
            <ElevationPreview key={level} level={level} />
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 32,
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
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B87333',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184,115,51,0.3)',
    paddingBottom: 8,
  },
  spacingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  spacingLabel: {
    width: 80,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spacingName: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.72)',
  },
  spacingValue: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: 'rgba(255,255,255,0.45)',
  },
  spacingBar: {
    height: 16,
    backgroundColor: '#B87333',
    borderRadius: 4,
  },
  radiusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  radiusItem: {
    alignItems: 'center',
    gap: 8,
  },
  radiusBox: {
    width: 64,
    height: 64,
    backgroundColor: '#B87333',
  },
  radiusName: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.72)',
  },
  radiusValue: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: 'rgba(255,255,255,0.45)',
  },
  elevationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  elevationBox: {
    width: 80,
    height: 80,
    backgroundColor: '#24272B',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  elevationLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.72)',
  },
})

const meta: Meta<typeof SpacingDisplay> = {
  title: 'Tokens/Spacing',
  component: SpacingDisplay,
}

export default meta
type Story = StoryObj<typeof SpacingDisplay>

export const Default: Story = {}
