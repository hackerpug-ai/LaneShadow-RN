/**
 * OverlayToggle Component Story
 * Toggle control for switching between wind, rain, and temperature overlays on map
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React, { useState } from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { OverlayToggle } from '../../components/map/overlay-toggle'
import type { OverlayType } from '../../components/map/overlay-toggle'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

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

const WindSelectedDemo = () => {
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
}

export const WindSelected: Story = {
  render: () => <WindSelectedDemo />,
}

const RainSelectedDemo = () => {
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
}

export const RainSelected: Story = {
  render: () => <RainSelectedDemo />,
}

const TemperatureSelectedDemo = () => {
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
}

export const TemperatureSelected: Story = {
  render: () => <TemperatureSelectedDemo />,
}

const RainUnavailableDemo = () => {
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
}

export const RainUnavailable: Story = {
  render: () => <RainUnavailableDemo />,
}

const OnlyWindAvailableDemo = () => {
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
}

export const OnlyWindAvailable: Story = {
  render: () => <OnlyWindAvailableDemo />,
}

const InteractiveDemo = () => {
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
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
}

const WithMapBackgroundDemo = () => {
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
}

export const WithMapBackground: Story = {
  render: () => <WithMapBackgroundDemo />,
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
    color: 'rgba(115, 115, 115, 0.92)',
  },
  controls: {
    gap: 8,
    marginTop: 8,
  },
  controlLabel: {
    fontSize: 14,
    color: '#88C7A6',
  },
  mapContainer: {
    width: '100%',
    height: 400,
    position: 'relative',
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F2EFED',
  },
  overlayContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
  },
})
