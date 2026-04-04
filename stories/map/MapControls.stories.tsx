/**
 * MapControls Component Story
 * Floating map controls for zoom, recenter, and clear actions
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React, { useState } from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { MapControls } from '../../components/map/map-controls'

const meta: Meta<typeof MapControls> = {
  title: 'Map/MapControls',
  component: MapControls,
  parameters: {
    docs: {
      description: {
        component: 'Floating map control buttons with zoom in/out, recenter to user location, and clear/map state reset. Positioned absolutely on top of map with safe area insets.',
      },
    },
    layout: 'fullscreen',
  },
  argTypes: {
    onZoomIn: {
      description: 'Callback when zoom in button pressed',
    },
    onZoomOut: {
      description: 'Callback when zoom out button pressed',
    },
    onRecenter: {
      description: 'Callback when recenter button pressed',
    },
    onClear: {
      description: 'Callback when clear button pressed',
    },
  },
  args: {
    onZoomIn: () => console.log('Zoom in'),
    onZoomOut: () => console.log('Zoom out'),
  },
}

export default meta
type Story = StoryObj<typeof MapControls>

export const Default: Story = {
  render: (args) => (
    <View style={styles.mapContainer}>
      <View style={styles.placeholderMap}>
        <MapControls {...args} />
      </View>
    </View>
  ),
}

export const WithRecenter: Story = {
  render: (args) => (
    <View style={styles.mapContainer}>
      <View style={styles.placeholderMap}>
        <MapControls
          onZoomIn={args.onZoomIn}
          onZoomOut={args.onZoomOut}
          onRecenter={() => console.log('Recenter to user location')}
        />
      </View>
    </View>
  ),
}

export const WithClear: Story = {
  render: (args) => (
    <View style={styles.mapContainer}>
      <View style={styles.placeholderMap}>
        <MapControls
          onZoomIn={args.onZoomIn}
          onZoomOut={args.onZoomOut}
          onRecenter={() => console.log('Recenter')}
          onClear={() => console.log('Clear map state')}
        />
      </View>
    </View>
  ),
}

export const AllControls: Story = {
  render: (args) => (
    <View style={styles.mapContainer}>
      <View style={styles.placeholderMap}>
        <MapControls
          onZoomIn={() => console.log('Zoom in')}
          onZoomOut={() => console.log('Zoom out')}
          onRecenter={() => console.log('Recenter to user')}
          onClear={() => console.log('Clear map')}
        />
      </View>
    </View>
  ),
}

export const CustomPosition: Story = {
  render: (args) => (
    <View style={styles.mapContainer}>
      <View style={styles.placeholderMap}>
        <MapControls
          onZoomIn={args.onZoomIn}
          onZoomOut={args.onZoomOut}
          position={{
            top: 100,
            right: 20,
          }}
        />
      </View>
    </View>
  ),
}

export const Interactive: Story = {
  render: () => {
    const [zoom, setZoom] = useState(12)
    const [message, setMessage] = useState('')

    const handleZoomIn = () => {
      setZoom((prev) => Math.min(20, prev + 1))
      setMessage(`Zoomed in to level ${zoom + 1}`)
    }

    const handleZoomOut = () => {
      setZoom((prev) => Math.max(1, prev - 1))
      setMessage(`Zoomed out to level ${zoom - 1}`)
    }

    const handleRecenter = () => {
      setMessage('Recentered to user location')
    }

    const handleClear = () => {
      setMessage('Map state cleared')
      setZoom(12)
    }

    return (
      <View style={styles.mapContainer}>
        <View style={styles.placeholderMap}>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Zoom Level: {zoom}
            </Text>
            {message ? (
              <Text style={styles.messageText}>
                {message}
              </Text>
            ) : null}
          </View>
          <MapControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onRecenter={handleRecenter}
            onClear={handleClear}
          />
        </View>
      </View>
    )
  },
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  placeholderMap: {
    flex: 1,
    backgroundColor: '#D1D5DB',
  },
  infoBox: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  infoText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#6B7280',
  },
})
