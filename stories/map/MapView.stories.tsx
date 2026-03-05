/**
 * MapView Component Story
 * Interactive map with Google Maps, centered on Salt Lake City, Utah
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React, { useRef } from 'react'
import { View } from 'react-native'
import { MapViewWrapper, type MapViewHandle } from '../../components/map/map-view'
import { getRainColor } from '../../lib/map/overlay-colors'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

// Salt Lake City, Utah coordinates
const SLC_CENTER = {
  latitude: 40.7608,
  longitude: -111.891,
}

const meta: Meta<typeof MapViewWrapper> = {
  title: 'Map/MapView',
  component: MapViewWrapper,
  parameters: {
    docs: {
      description: {
        component: 'Interactive map wrapper using Google Maps. Supports markers, polylines, camera control, and user location. Automatically styled based on semantic theme.',
      },
    },
    layout: 'fullscreen',
  },
  argTypes: {
    cameraPosition: {
      control: 'object',
      description: 'Initial camera position with coordinates, zoom, and animation duration',
    },
    markers: {
      control: 'object',
      description: 'Array of map markers with coordinates and titles',
    },
    polylines: {
      control: 'object',
      description: 'Array of polylines for route visualization',
    },
  },
  args: {
    cameraPosition: {
      coordinates: SLC_CENTER,
      zoom: 12,
      duration: 500,
    },
  },
}

export default meta
type Story = StoryObj<typeof MapViewWrapper>

export const Default: Story = {
  args: {
    cameraPosition: {
      coordinates: SLC_CENTER,
      zoom: 12,
    },
  },
}

export const WithZoom: Story = {
  args: {
    cameraPosition: {
      coordinates: SLC_CENTER,
      zoom: 15,
    },
  },
}

export const WithSLCMarkers: Story = {
  args: {
    cameraPosition: {
      coordinates: SLC_CENTER,
      zoom: 11,
    },
    markers: [
      {
        id: 'downtown',
        title: 'Downtown Salt Lake City',
        coordinates: { latitude: 40.7608, longitude: -111.891 },
      },
      {
        id: 'capitol',
        title: 'Utah State Capitol',
        coordinates: { latitude: 40.7794, longitude: -111.888 },
      },
      {
        id: 'temple',
        title: 'Temple Square',
        coordinates: { latitude: 40.7705, longitude: -111.8931 },
      },
      {
        id: 'university',
        title: 'University of Utah',
        coordinates: { latitude: 40.7656, longitude: -111.8474 },
      },
    ],
  },
}

export const WithRoutePolyline: Story = {
  render: (args) => {
    const mapRef = useRef<MapViewHandle>(null)

    // Simple route from Downtown to University of Utah
    const routeCoords = [
      { latitude: 40.7608, longitude: -111.891 }, // Downtown
      { latitude: 40.762, longitude: -111.878 },
      { latitude: 40.764, longitude: -111.865 },
      { latitude: 40.7656, longitude: -111.8474 }, // University
    ]

    return (
      <View style={{ flex: 1 }}>
        <MapViewWrapper
          ref={mapRef}
          {...args}
          polylines={[
            {
              id: 'route-1',
              coordinates: routeCoords,
              strokeColor: '#3B82F6',
              strokeWidth: 6,
            },
          ]}
          markers={[
            {
              id: 'start',
              title: 'Start: Downtown SLC',
              coordinates: routeCoords[0],
            },
            {
              id: 'end',
              title: 'End: University of Utah',
              coordinates: routeCoords[routeCoords.length - 1],
            },
          ]}
        />
      </View>
    )
  },
}

export const MultipleRoutes: Story = {
  render: (args) => {
    const mapRef = useRef<MapViewHandle>(null)

    // Route 1 - I-15 route
    const route1Coords = [
      { latitude: 40.7608, longitude: -111.891 },
      { latitude: 40.755, longitude: -111.895 },
      { latitude: 40.75, longitude: -111.89 },
      { latitude: 40.745, longitude: -111.885 },
    ]

    // Route 2 - Alternative
    const route2Coords = [
      { latitude: 40.7608, longitude: -111.891 },
      { latitude: 40.762, longitude: -111.88 },
      { latitude: 40.764, longitude: -111.87 },
      { latitude: 40.765, longitude: -111.86 },
    ]

    return (
      <View style={{ flex: 1 }}>
        <MapViewWrapper
          ref={mapRef}
          {...args}
          cameraPosition={{
            coordinates: SLC_CENTER,
            zoom: 13,
          }}
          polylines={[
            {
              id: 'route-selected',
              coordinates: route1Coords,
              strokeColor: '#3B82F6',
              strokeWidth: 6,
            },
            {
              id: 'route-alternate',
              coordinates: route2Coords,
              strokeColor: '#9CA3AF',
              strokeWidth: 4,
            },
          ]}
          markers={[
            {
              id: 'start',
              title: 'Start',
              coordinates: route1Coords[0],
            },
            {
              id: 'end1',
              title: 'End Route 1',
              coordinates: route1Coords[route1Coords.length - 1],
            },
            {
              id: 'end2',
              title: 'End Route 2',
              coordinates: route2Coords[route2Coords.length - 1],
            },
          ]}
        />
      </View>
    )
  },
}

export const WithWindOverlay: Story = {
  render: (args) => {
    const mapRef = useRef<MapViewHandle>(null)

    // Route with colored segments simulating wind conditions
    const baseCoords = [
      { latitude: 40.7608, longitude: -111.891 },
      { latitude: 40.762, longitude: -111.878 },
      { latitude: 40.764, longitude: -111.865 },
      { latitude: 40.7656, longitude: -111.8474 },
    ]

    // Low wind segment (green)
    const lowWindSegment = baseCoords.slice(0, 2)
    // Moderate wind segment (yellow)
    const moderateWindSegment = baseCoords.slice(1, 3)
    // High wind segment (red)
    const highWindSegment = baseCoords.slice(2, 4)

    return (
      <View style={{ flex: 1 }}>
        <MapViewWrapper
          ref={mapRef}
          {...args}
          cameraPosition={{
            coordinates: SLC_CENTER,
            zoom: 13,
          }}
          polylines={[
            {
              id: 'wind-low',
              coordinates: lowWindSegment,
              strokeColor: '#10B981', // Green
              strokeWidth: 6,
            },
            {
              id: 'wind-moderate',
              coordinates: moderateWindSegment,
              strokeColor: '#F59E0B', // Yellow
              strokeWidth: 6,
            },
            {
              id: 'wind-high',
              coordinates: highWindSegment,
              strokeColor: '#EF4444', // Red
              strokeWidth: 6,
            },
          ]}
        />
      </View>
    )
  },
}

export const CanyonRoute: Story = {
  render: (args) => {
    const mapRef = useRef<MapViewHandle>(null)

    // Simulated route up a canyon (e.g., Big Cottonwood Canyon)
    const canyonRoute = [
      { latitude: 40.7608, longitude: -111.891 }, // Start at SLC
      { latitude: 40.75, longitude: -111.82 },
      { latitude: 40.72, longitude: -111.78 },
      { latitude: 40.68, longitude: -111.74 }, // Canyon entrance
      { latitude: 40.65, longitude: -111.71 },
    ]

    return (
      <View style={{ flex: 1 }}>
        <MapViewWrapper
          ref={mapRef}
          {...args}
          cameraPosition={{
            coordinates: { latitude: 40.7, longitude: -111.8 },
            zoom: 11,
          }}
          polylines={[
            {
              id: 'canyon-route',
              coordinates: canyonRoute,
              strokeColor: '#8B5CF6',
              strokeWidth: 5,
            },
          ]}
          markers={[
            {
              id: 'start',
              title: 'Salt Lake City',
              coordinates: canyonRoute[0],
            },
            {
              id: 'canyon',
              title: 'Big Cottonwood Canyon',
              coordinates: canyonRoute[canyonRoute.length - 1],
            },
          ]}
        />
      </View>
    )
  },
}

export const WithInteractions: Story = {
  render: (args) => {
    const mapRef = useRef<MapViewHandle>(null)

    const handleMapClick = (event: { coordinates?: { latitude: number; longitude: number } }) => {
      if (event.coordinates) {
        console.log('Map clicked at:', event.coordinates)
      }
    }

    const handleCameraMove = (event: {
      coordinates: { latitude: number; longitude: number }
      zoom: number
    }) => {
      console.log('Camera moved to:', event.coordinates, 'zoom:', event.zoom)
    }

    return (
      <View style={{ flex: 1 }}>
        <MapViewWrapper
          ref={mapRef}
          {...args}
          cameraPosition={{
            coordinates: SLC_CENTER,
            zoom: 12,
          }}
          onMapClick={handleMapClick}
          onCameraMove={handleCameraMove}
          markers={[
            {
              id: 'tap-me',
              title: 'Tap the map to see coordinates',
              coordinates: SLC_CENTER,
            },
          ]}
        />
      </View>
    )
  },
}

export const MountainView: Story = {
  args: {
    cameraPosition: {
      coordinates: {
        latitude: 40.6, // Slightly south to see mountains
        longitude: -111.85,
      },
      zoom: 10,
    },
    markers: [
      {
        id: 'wasatch',
        title: 'Wasatch Mountains',
        coordinates: { latitude: 40.6, longitude: -111.85 },
      },
    ],
  },
}

export const RegionalView: Story = {
  args: {
    cameraPosition: {
      coordinates: SLC_CENTER,
      zoom: 8,
    },
    markers: [
      {
        id: 'slc',
        title: 'Salt Lake City',
        coordinates: SLC_CENTER,
      },
      {
        id: 'park-city',
        title: 'Park City',
        coordinates: { latitude: 40.6464, longitude: -111.4979 },
      },
      {
        id: 'provo',
        title: 'Provo',
        coordinates: { latitude: 40.2338, longitude: -111.6585 },
      },
      {
        id: 'ogden',
        title: 'Ogden',
        coordinates: { latitude: 41.223, longitude: -111.9738 },
      },
    ],
  },
}

/**
 * Rain Overlay Story
 *
 * Demonstrates rain-based polyline coloring using semantic theme colors:
 * - Green (success): No rain
 * - Sky blue (routeAlternate): Light rain
 * - Blue (info): Moderate rain
 * - Red (danger): Heavy rain
 *
 * AC1: Light rain segments display in sky blue (routeAlternate)
 * AC2: Heavy rain segments display in red (danger)
 */
export const WithRainOverlay: Story = {
  render: (args) => {
    const mapRef = useRef<MapViewHandle>(null)
    const theme = useSemanticTheme()

    // Route with varying rain conditions
    const baseCoords = [
      { latitude: 40.7608, longitude: -111.891 },
      { latitude: 40.762, longitude: -111.878 },
      { latitude: 40.764, longitude: -111.865 },
      { latitude: 40.7656, longitude: -111.8474 },
      { latitude: 40.767, longitude: -111.83 },
      { latitude: 40.768, longitude: -111.81 },
    ]

    return (
      <View style={{ flex: 1 }}>
        <MapViewWrapper
          ref={mapRef}
          {...args}
          cameraPosition={{
            coordinates: SLC_CENTER,
            zoom: 13,
          }}
          polylines={[
            // No rain (green)
            {
              id: 'rain-none',
              coordinates: baseCoords.slice(0, 2),
              strokeColor: getRainColor('none', theme.semantic),
              strokeWidth: 6,
            },
            // Light rain (sky blue) - AC1
            {
              id: 'rain-light',
              coordinates: baseCoords.slice(1, 3),
              strokeColor: getRainColor('light', theme.semantic),
              strokeWidth: 6,
            },
            // Moderate rain (blue)
            {
              id: 'rain-moderate',
              coordinates: baseCoords.slice(2, 4),
              strokeColor: getRainColor('moderate', theme.semantic),
              strokeWidth: 6,
            },
            // Heavy rain (red) - AC2
            {
              id: 'rain-heavy',
              coordinates: baseCoords.slice(4, 6),
              strokeColor: getRainColor('heavy', theme.semantic),
              strokeWidth: 6,
            },
          ]}
          markers={[
            {
              id: 'start',
              title: 'Start: Downtown SLC',
              coordinates: baseCoords[0],
            },
            {
              id: 'end',
              title: 'End: University of Utah',
              coordinates: baseCoords[baseCoords.length - 1],
            },
          ]}
        />
      </View>
    )
  },
}
