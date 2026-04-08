/**
 * WaypointMarker Component Story
 * Map marker for waypoints with status-based color coding and interactive states
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { WaypointMarker } from '../../components/map/waypoint-marker'

const meta: Meta<typeof WaypointMarker> = {
  title: 'Map/WaypointMarker',
  component: WaypointMarker,
  parameters: {
    docs: {
      description: {
        component: 'Map marker for waypoints with status-based color coding. Shows on-route (green), off-route (orange), or mixed (blue) status. Supports interactive states and optional index numbers.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    id: {
      control: 'text',
      description: 'Unique identifier for the waypoint',
    },
    kind: {
      control: {
        type: 'select',
        options: ['on_route', 'off_route', 'mixed'],
      },
      description: 'Waypoint kind determines color coding',
    },
    state: {
      control: {
        type: 'select',
        options: ['default', 'selected', 'pressed', 'disabled'],
      },
      description: 'Interactive state of the marker',
    },
    size: {
      control: { type: 'number', min: 16, max: 64, step: 4 },
      description: 'Size of the marker in pixels',
    },
    showIndex: {
      control: 'boolean',
      description: 'Whether to show the waypoint index number',
    },
    index: {
      control: 'number',
      description: 'Index number to display (1-based)',
    },
  },
  args: {
    id: 'waypoint-1',
    coordinate: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
    kind: 'on_route',
    state: 'default',
    size: 32,
    showIndex: false,
    index: 1,
  },
}

export default meta
type Story = StoryObj<typeof WaypointMarker>

export const Default: Story = {
  args: {
    id: 'waypoint-1',
    kind: 'on_route',
    state: 'default',
  },
}

export const OnRoute: Story = {
  args: {
    id: 'waypoint-on-route',
    kind: 'on_route',
  },
  parameters: {
    docs: {
      description: {
        story: 'On-route waypoint displayed in green. Indicates the waypoint is along the planned route.',
      },
    },
  },
}

export const OffRoute: Story = {
  args: {
    id: 'waypoint-off-route',
    kind: 'off_route',
  },
  parameters: {
    docs: {
      description: {
        story: 'Off-route waypoint displayed in orange. Indicates the waypoint requires a detour from the planned route.',
      },
    },
  },
}

export const Mixed: Story = {
  args: {
    id: 'waypoint-mixed',
    kind: 'mixed',
  },
  parameters: {
    docs: {
      description: {
        story: 'Mixed-status waypoint displayed in blue. Indicates the waypoint has both on-route and off-route characteristics.',
      },
    },
  },
}

export const Selected: Story = {
  args: {
    id: 'waypoint-selected',
    kind: 'on_route',
    state: 'selected',
  },
  parameters: {
    docs: {
      description: {
        story: 'Selected state with tertiary color ring. Used when the waypoint is currently selected or active.',
      },
    },
  },
}

export const Pressed: Story = {
  args: {
    id: 'waypoint-pressed',
    kind: 'off_route',
    state: 'pressed',
  },
  parameters: {
    docs: {
      description: {
        story: 'Pressed state with darker color. Provides visual feedback during touch interaction.',
      },
    },
  },
}

export const Disabled: Story = {
  args: {
    id: 'waypoint-disabled',
    kind: 'on_route',
    state: 'disabled',
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state with muted color. Used when the waypoint cannot be interacted with.',
      },
    },
  },
}

export const SizeVariants: Story = {
  render: () => (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Size Variants
      </Text>
      <View style={styles.row}>
        <View style={styles.item}>
          <WaypointMarker id="small" coordinate={{ latitude: 37.7749, longitude: -122.4194 }} size={20} />
          <Text style={styles.label}>20px</Text>
        </View>
        <View style={styles.item}>
          <WaypointMarker id="medium" coordinate={{ latitude: 37.7749, longitude: -122.4194 }} size={32} />
          <Text style={styles.label}>32px</Text>
        </View>
        <View style={styles.item}>
          <WaypointMarker id="large" coordinate={{ latitude: 37.7749, longitude: -122.4194 }} size={48} />
          <Text style={styles.label}>48px</Text>
        </View>
      </View>
    </View>
  ),
}

export const KindComparison: Story = {
  render: () => (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Waypoint Kinds
      </Text>
      <View style={styles.row}>
        <View style={styles.item}>
          <WaypointMarker
            id="on-route"
            coordinate={{ latitude: 37.7749, longitude: -122.4194 }}
            kind="on_route"
          />
          <Text style={styles.label}>On Route</Text>
        </View>
        <View style={styles.item}>
          <WaypointMarker
            id="off-route"
            coordinate={{ latitude: 37.7749, longitude: -122.4194 }}
            kind="off_route"
          />
          <Text style={styles.label}>Off Route</Text>
        </View>
        <View style={styles.item}>
          <WaypointMarker id="mixed" coordinate={{ latitude: 37.7749, longitude: -122.4194 }} kind="mixed" />
          <Text style={styles.label}>Mixed</Text>
        </View>
      </View>
    </View>
  ),
}

export const InteractiveStates: Story = {
  render: () => (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Interactive States
      </Text>
      <View style={styles.row}>
        <View style={styles.item}>
          <WaypointMarker
            id="default"
            coordinate={{ latitude: 37.7749, longitude: -122.4194 }}
            state="default"
          />
          <Text style={styles.label}>Default</Text>
        </View>
        <View style={styles.item}>
          <WaypointMarker
            id="selected"
            coordinate={{ latitude: 37.7749, longitude: -122.4194 }}
            state="selected"
          />
          <Text style={styles.label}>Selected</Text>
        </View>
        <View style={styles.item}>
          <WaypointMarker
            id="pressed"
            coordinate={{ latitude: 37.7749, longitude: -122.4194 }}
            state="pressed"
          />
          <Text style={styles.label}>Pressed</Text>
        </View>
        <View style={styles.item}>
          <WaypointMarker
            id="disabled"
            coordinate={{ latitude: 37.7749, longitude: -122.4194 }}
            state="disabled"
          />
          <Text style={styles.label}>Disabled</Text>
        </View>
      </View>
    </View>
  ),
}

export const OnMapBackground: Story = {
  render: () => (
    <View style={styles.mapContainer}>
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapGrid}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View key={i} style={styles.gridLine} />
          ))}
        </View>
        <View style={styles.markerOverlay}>
          <View style={styles.markerRow}>
            <WaypointMarker
              id="map-on-route"
              coordinate={{ latitude: 37.7749, longitude: -122.4194 }}
              kind="on_route"
            />
            <WaypointMarker
              id="map-off-route"
              coordinate={{ latitude: 37.775, longitude: -122.418 }}
              kind="off_route"
            />
            <WaypointMarker id="map-mixed" coordinate={{ latitude: 37.7751, longitude: -122.417 }} kind="mixed" />
          </View>
          <Text style={styles.overlayLabel}>Waypoint markers on map</Text>
        </View>
      </View>
    </View>
  ),
}

export const ClusteredMarkers: Story = {
  render: () => (
    <View style={styles.mapContainer}>
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapGrid}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View key={i} style={styles.gridLine} />
          ))}
        </View>
        <View style={styles.markerOverlay}>
          <View style={styles.clusterGrid}>
            {Array.from({ length: 12 }, (_, i) => (
              <WaypointMarker
                key={i}
                id={`cluster-${i}`}
                coordinate={{ latitude: 37.7749 + i * 0.001, longitude: -122.4194 + i * 0.001 }}
                kind={i % 3 === 0 ? 'off_route' : 'on_route'}
                size={24}
              />
            ))}
          </View>
          <Text style={styles.overlayLabel}>Clustered waypoints (10+)</Text>
        </View>
      </View>
    </View>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple waypoints displayed together. For 10+ waypoints, markers are shown at smaller sizes to prevent visual clutter.',
      },
    },
  },
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
  markerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerRow: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 16,
  },
  overlayLabel: {
    marginTop: 16,
    fontSize: 14,
    color: '#4B5563',
  },
  clusterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    width: '80%',
  },
})
