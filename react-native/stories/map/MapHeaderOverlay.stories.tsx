/**
 * MapHeaderOverlay Component Story
 * Transparent glass-morphic header overlay for map screens
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { MapHeaderOverlay } from '../../components/map/map-header-overlay'
import { IconSymbol } from '../../components/ui/icon-symbol'

const meta: Meta<typeof MapHeaderOverlay> = {
  title: 'Map/MapHeaderOverlay',
  component: MapHeaderOverlay,
  parameters: {
    docs: {
      description: {
        component: 'Transparent glass-morphic header overlay for map screens with gradient fade. Supports left/right action buttons and centered title.',
      },
    },
    layout: 'fullscreen',
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Center title text',
    },
    showBackground: {
      control: 'boolean',
      description: 'Toggle gradient background visibility',
    },
  },
  args: {
    title: 'Map',
    showBackground: true,
  },
}

export default meta
type Story = StoryObj<typeof MapHeaderOverlay>

export const Default: Story = {
  render: (args) => (
    <View style={styles.mapContainer}>
      <MapHeaderOverlay {...args} />
      <View style={styles.mapPlaceholder}>
        <Text style={styles.placeholderText}>Map content area</Text>
      </View>
    </View>
  ),
}

export const WithTitle: Story = {
  render: (args) => (
    <View style={styles.mapContainer}>
      <MapHeaderOverlay title="Salt Lake City" {...args} />
      <View style={styles.mapPlaceholder}>
        <Text style={styles.placeholderText}>Viewing Salt Lake City area</Text>
      </View>
    </View>
  ),
}

export const WithLeftAction: Story = {
  render: (args) => (
    <View style={styles.mapContainer}>
      <MapHeaderOverlay
        title="Route Planning"
        leftAction={{
          icon: 'arrow-left',
          onPress: () => console.log('Back pressed'),
        }}
        {...args}
      />
      <View style={styles.mapPlaceholder}>
        <Text style={styles.placeholderText}>Planning a route</Text>
      </View>
    </View>
  ),
}

export const WithRightAction: Story = {
  render: (args) => (
    <View style={styles.mapContainer}>
      <MapHeaderOverlay
        title="Saved Routes"
        rightAction={{
          icon: 'plus',
          onPress: () => console.log('Add pressed'),
        }}
        {...args}
      />
      <View style={styles.mapPlaceholder}>
        <Text style={styles.placeholderText}>Managing saved routes</Text>
      </View>
    </View>
  ),
}

export const WithBothActions: Story = {
  render: (args) => (
    <View style={styles.mapContainer}>
      <MapHeaderOverlay
        title="Active Route"
        leftAction={{
          icon: 'close',
          onPress: () => console.log('Close pressed'),
          testID: 'close-route',
        }}
        rightAction={{
          icon: 'dots-vertical',
          onPress: () => console.log('More options'),
          testID: 'route-options',
        }}
        {...args}
      />
      <View style={styles.mapPlaceholder}>
        <Text style={styles.placeholderText}>Route in progress</Text>
      </View>
    </View>
  ),
}

export const WithoutBackground: Story = {
  render: (args) => (
    <View style={styles.mapContainer}>
      <MapHeaderOverlay
        title="Navigation Mode"
        leftAction={{
          icon: 'chevron-left',
          onPress: () => console.log('Back'),
        }}
        showBackground={false}
        {...args}
      />
      <View style={styles.mapPlaceholder}>
        <Text style={styles.placeholderText}>Clean header without gradient</Text>
      </View>
    </View>
  ),
}

export const OnMapBackground: Story = {
  render: (args) => (
    <View style={styles.mapContainer}>
      <MapHeaderOverlay
        title="Big Cottonwood Canyon"
        leftAction={{
          icon: 'arrow-left',
          onPress: () => console.log('Back'),
        }}
        {...args}
      />
      <View style={styles.mapSimulated}>
        <View style={styles.mapGrid}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View key={i} style={styles.gridLine} />
          ))}
        </View>
        <View style={styles.canyonRoute} />
        <Text style={styles.mapLabel}>Canyon route visualization</Text>
      </View>
    </View>
  ),
}

export const LongTitle: Story = {
  render: (args) => (
    <View style={styles.mapContainer}>
      <MapHeaderOverlay
        title="Planning: Downtown SLC to University of Utah via Salt Lake City Proper"
        leftAction={{
          icon: 'chevron-down',
          onPress: () => console.log('Collapse'),
        }}
        {...args}
      />
      <View style={styles.mapPlaceholder}>
        <Text style={styles.placeholderText}>Long title test</Text>
      </View>
    </View>
  ),
}

export const IconOnly: Story = {
  render: (args) => (
    <View style={styles.mapContainer}>
      <MapHeaderOverlay
        title=""
        leftAction={{
          icon: 'close',
          onPress: () => console.log('Close'),
        }}
        {...args}
      />
      <View style={styles.mapPlaceholder}>
        <Text style={styles.placeholderText}>Minimal header</Text>
      </View>
    </View>
  ),
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapSimulated: {
    flex: 1,
    backgroundColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#4B5563',
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    flexWrap: 'wrap',
    opacity: 0.2,
  },
  gridLine: {
    width: '15%',
    height: 2,
    backgroundColor: '#D1D5DB',
    marginVertical: 15,
  },
  canyonRoute: {
    width: 4,
    height: 200,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  mapLabel: {
    position: 'absolute',
    bottom: 100,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
})
