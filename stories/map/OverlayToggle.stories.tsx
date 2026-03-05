/**
 * OverlayToggle Component Story
 * Toggle control for switching between wind, rain, and temperature overlays on map
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React, { useState } from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { OverlayToggle } from '../../components/map/overlay-toggle'
import type { OverlayType } from '../../components/map/overlay-toggle'

const meta: Meta<typeof OverlayToggle> = {
  title: 'Map/OverlayToggle',
  component: OverlayToggle,
  parameters: {
    docs: {
      description: {
        component: 'Toggle control for switching between wind, rain, and temperature weather overlays on the map. Uses single-selection mode with disabled state indication for unavailable data.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    value: {
      control: 'select',
      options: ['', 'wind', 'rain', 'temperature'],
      description: 'Currently selected overlay',
    },
    availability: {
      control: 'object',
      description: 'Data availability for each overlay type',
    },
  },
  args: {
    value: 'wind',
    availability: { wind: true, rain: true, temperature: true },
  },
}

export default meta
type Story = StoryObj<typeof OverlayToggle>

export const Default: Story = {
  render: (args) => (
    <View style={styles.container}>
      <OverlayToggle {...args} />
    </View>
  ),
}

export const WindSelected: Story = {
  render: () => {
    const [value, setValue] = useState<OverlayType | ''>('wind')
    return (
      <View style={styles.container}>
        <OverlayToggle
          value={value}
          onValueChange={setValue}
          availability={{ wind: true, rain: true, temperature: true }}
        />
        <Text style={styles.label}>Selected: {value || 'none'}</Text>
      </View>
    )
  },
}

export const RainSelected: Story = {
  render: () => {
    const [value, setValue] = useState<OverlayType | ''>('rain')
    return (
      <View style={styles.container}>
        <OverlayToggle
          value={value}
          onValueChange={setValue}
          availability={{ wind: true, rain: true, temperature: true }}
        />
        <Text style={styles.label}>Selected: {value || 'none'}</Text>
      </View>
    )
  },
}

export const TemperatureSelected: Story = {
  render: () => {
    const [value, setValue] = useState<OverlayType | ''>('temperature')
    return (
      <View style={styles.container}>
        <OverlayToggle
          value={value}
          onValueChange={setValue}
          availability={{ wind: true, rain: true, temperature: true }}
        />
        <Text style={styles.label}>Selected: {value || 'none'}</Text>
      </View>
    )
  },
}

export const RainUnavailable: Story = {
  render: () => {
    const [value, setValue] = useState<OverlayType | ''>('wind')
    return (
      <View style={styles.container}>
        <OverlayToggle
          value={value}
          onValueChange={setValue}
          availability={{ wind: true, rain: false, temperature: true }}
        />
        <Text style={styles.label}>Rain data unavailable</Text>
      </View>
    )
  },
}

export const OnlyWindAvailable: Story = {
  render: () => {
    const [value, setValue] = useState<OverlayType | ''>('wind')
    return (
      <View style={styles.container}>
        <OverlayToggle
          value={value}
          onValueChange={setValue}
          availability={{ wind: true, rain: false, temperature: false }}
        />
        <Text style={styles.label}>Only wind data available</Text>
      </View>
    )
  },
}

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState<OverlayType | ''>('wind')
    const [availability, setAvailability] = useState({
      wind: true,
      rain: true,
      temperature: true,
    })

    const toggleRainAvailability = () => {
      setAvailability((prev) => ({ ...prev, rain: !prev.rain }))
    }

    const toggleTempAvailability = () => {
      setAvailability((prev) => ({ ...prev, temperature: !prev.temperature }))
    }

    return (
      <View style={styles.container}>
        <OverlayToggle
          value={value}
          onValueChange={setValue}
          availability={availability}
        />
        <Text style={styles.label}>
          Selected: {value || 'none'}
        </Text>
        <View style={styles.controls}>
          <Text style={styles.controlLabel} onPress={toggleRainAvailability}>
            Toggle Rain Data: {availability.rain ? 'Available' : 'Unavailable'}
          </Text>
          <Text style={styles.controlLabel} onPress={toggleTempAvailability}>
            Toggle Temp Data: {availability.temperature ? 'Available' : 'Unavailable'}
          </Text>
        </View>
      </View>
    )
  },
}

export const WithMapBackground: Story = {
  render: () => {
    const [value, setValue] = useState<OverlayType | ''>('wind')
    return (
      <View style={styles.mapContainer}>
        <View style={styles.mapBackground} />
        <View style={styles.overlayContainer}>
          <OverlayToggle
            value={value}
            onValueChange={setValue}
            availability={{ wind: true, rain: true, temperature: true }}
          />
        </View>
      </View>
    )
  },
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  controls: {
    gap: 8,
    marginTop: 8,
  },
  controlLabel: {
    fontSize: 14,
    color: '#007AFF',
  },
  mapContainer: {
    width: '100%',
    height: 400,
    position: 'relative',
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E5E7EB',
  },
  overlayContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
  },
})
