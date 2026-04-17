/**
 * CompassPlusIcon Component Story
 * Compass icon with a plus badge in the bottom-right quadrant
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { CompassPlusIcon } from '../../components/map/compass-plus-icon'

const meta: Meta<typeof CompassPlusIcon> = {
  title: 'Map/CompassPlusIcon',
  component: CompassPlusIcon,
  parameters: {
    docs: {
      description: {
        component: 'Compass icon with a plus badge in the bottom-right quadrant. Uses semantic theme colors and spacing-derived stroke widths. Commonly used for map navigation or adding waypoints.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    size: {
      control: { type: 'number', min: 20, max: 64, step: 4 },
      description: 'Icon size in pixels',
    },
  },
  args: {
    size: 28,
  },
}

export default meta
type Story = StoryObj<typeof CompassPlusIcon>

export const Default: Story = {
  args: {
    size: 28,
  },
}

export const Small: Story = {
  args: {
    size: 20,
  },
}

export const Medium: Story = {
  args: {
    size: 32,
  },
}

export const Large: Story = {
  args: {
    size: 48,
  },
}

export const ExtraLarge: Story = {
  args: {
    size: 64,
  },
}

export const SizeComparison: Story = {
  render: () => (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Size Variants
      </Text>
      <View style={styles.row}>
        <View style={styles.item}>
          <CompassPlusIcon size={20} />
          <Text style={styles.label}>20px</Text>
        </View>
        <View style={styles.item}>
          <CompassPlusIcon size={28} />
          <Text style={styles.label}>28px</Text>
        </View>
        <View style={styles.item}>
          <CompassPlusIcon size={36} />
          <Text style={styles.label}>36px</Text>
        </View>
        <View style={styles.item}>
          <CompassPlusIcon size={48} />
          <Text style={styles.label}>48px</Text>
        </View>
      </View>
    </View>
  ),
}

export const OnLightBackground: Story = {
  render: () => (
    <View style={[styles.container, styles.lightBg]}>
      <CompassPlusIcon size={48} />
      <Text style={styles.bgLabel}>Light background</Text>
    </View>
  ),
}

export const OnDarkBackground: Story = {
  render: () => (
    <View style={[styles.container, styles.darkBg]}>
      <CompassPlusIcon size={48} />
      <Text style={[styles.bgLabel, styles.lightText]}>Dark background</Text>
    </View>
  ),
}

export const OnMapBackground: Story = {
  render: () => (
    <View style={styles.mapContainer}>
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapGrid}>
          {Array.from({ length: 15 }).map((_, i) => (
            <View key={i} style={styles.gridLine} />
          ))}
        </View>
        <View style={styles.iconOverlay}>
          <CompassPlusIcon size={40} />
          <Text style={styles.overlayLabel}>Compass with add</Text>
        </View>
      </View>
    </View>
  ),
}

export const InButton: Story = {
  render: () => (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        In Button Context
      </Text>
      <View style={styles.buttonRow}>
        <View style={[styles.fakeButton, styles.fakeButtonLight]}>
          <CompassPlusIcon size={24} />
        </View>
        <View style={[styles.fakeButton, styles.fakeButtonPrimary]}>
          <CompassPlusIcon size={24} />
        </View>
        <View style={[styles.fakeButton, styles.fakeButtonDark]}>
          <CompassPlusIcon size={24} />
        </View>
      </View>
    </View>
  ),
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 32,
    alignItems: 'center',
  },
  item: {
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
  },
  title: {
    marginBottom: 8,
  },
  lightBg: {
    backgroundColor: '#F3F4F6',
  },
  darkBg: {
    backgroundColor: '#1F2937',
  },
  bgLabel: {
    fontSize: 14,
    color: '#374151',
  },
  lightText: {
    color: '#F9FAFB',
  },
  mapContainer: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#9CA3AF',
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    flexWrap: 'wrap',
    opacity: 0.2,
  },
  gridLine: {
    width: '20%',
    height: 2,
    backgroundColor: '#6B7280',
    marginVertical: 20,
  },
  iconOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayLabel: {
    marginTop: 16,
    fontSize: 14,
    color: '#4B5563',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  fakeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fakeButtonLight: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fakeButtonPrimary: {
    backgroundColor: '#3B82F6',
  },
  fakeButtonDark: {
    backgroundColor: '#1F2937',
  },
})
