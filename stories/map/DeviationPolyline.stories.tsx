/**
 * DeviationPolyline Component Story
 * Polyline visualization for route deviations showing original route, detour path, and reconnection point
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { DeviationPolyline, buildDeviationSegments } from '../../components/map/deviation-polyline'

const meta: Meta<typeof DeviationPolyline> = {
  title: 'Map/DeviationPolyline',
  component: DeviationPolyline,
  parameters: {
    docs: {
      description: {
        component: 'Visualizes route deviation with three path types: original route (gray), detour path (orange), and reconnection point (green). Shows where a rider leaves the planned route and rejoins it.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    isActive: {
      control: 'boolean',
      description: 'Whether the deviation is currently active/selected',
    },
    strokeWidth: {
      control: { type: 'number', min: 2, max: 12, step: 1 },
      description: 'Stroke width for the polylines',
    },
  },
  args: {
    segments: [],
    isActive: false,
    strokeWidth: 4,
  },
}

export default meta
type Story = StoryObj<typeof DeviationPolyline>

const mockOriginalRoute = [
  { latitude: 37.7749, longitude: -122.4194 },
  { latitude: 37.775, longitude: -122.418 },
  { latitude: 37.7751, longitude: -122.4166 },
]

const mockDetourPath = [
  { latitude: 37.7751, longitude: -122.4166 },
  { latitude: 37.776, longitude: -122.415 },
  { latitude: 37.777, longitude: -122.413 },
  { latitude: 37.778, longitude: -122.411 },
]

const mockReconnectPoint = { latitude: 37.778, longitude: -122.411 }

const mockSegments = buildDeviationSegments(mockOriginalRoute, mockDetourPath, mockReconnectPoint)

export const Default: Story = {
  args: {
    segments: mockSegments,
    isActive: false,
  },
}

export const Active: Story = {
  args: {
    segments: mockSegments,
    isActive: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Active deviation state with increased stroke width for emphasis.',
      },
    },
  },
}

export const ThinStroke: Story = {
  args: {
    segments: mockSegments,
    strokeWidth: 2,
  },
}

export const ThickStroke: Story = {
  args: {
    segments: mockSegments,
    strokeWidth: 8,
  },
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
        <View style={styles.polylineOverlay}>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#6B7280' }]} />
              <Text style={styles.legendLabel}>Original Route</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF6B35' }]} />
              <Text style={styles.legendLabel}>Detour Path</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#31A362' }]} />
              <Text style={styles.legendLabel}>Reconnect Point</Text>
            </View>
          </View>
          <Text style={styles.overlayLabel}>Deviation visualization on map</Text>
        </View>
      </View>
    </View>
  ),
}

export const StrokeWidthComparison: Story = {
  render: () => (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Stroke Width Variants
      </Text>
      <View style={styles.row}>
        <View style={styles.item}>
          <View style={styles.strokePreview}>
            <View style={[styles.strokeLine, { height: 2 }]} />
          </View>
          <Text style={styles.label}>2px</Text>
        </View>
        <View style={styles.item}>
          <View style={styles.strokePreview}>
            <View style={[styles.strokeLine, { height: 4 }]} />
          </View>
          <Text style={styles.label}>4px</Text>
        </View>
        <View style={styles.item}>
          <View style={styles.strokePreview}>
            <View style={[styles.strokeLine, { height: 6 }]} />
          </View>
          <Text style={styles.label}>6px</Text>
        </View>
        <View style={styles.item}>
          <View style={styles.strokePreview}>
            <View style={[styles.strokeLine, { height: 8 }]} />
          </View>
          <Text style={styles.label}>8px</Text>
        </View>
      </View>
    </View>
  ),
}

export const SegmentTypes: Story = {
  render: () => (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Deviation Segment Types
      </Text>
      <View style={styles.segmentList}>
        <View style={styles.segmentItem}>
          <View style={[styles.segmentBar, { backgroundColor: '#6B7280' }]} />
          <View style={styles.segmentInfo}>
            <Text style={styles.segmentTitle}>Original Route</Text>
            <Text style={styles.segmentDescription}>
              Gray/muted color showing the planned route before detour
            </Text>
          </View>
        </View>
        <View style={styles.segmentItem}>
          <View style={[styles.segmentBar, { backgroundColor: '#FF6B35' }]} />
          <View style={styles.segmentInfo}>
            <Text style={styles.segmentTitle}>Detour Path</Text>
            <Text style={styles.segmentDescription}>
              Orange color showing the active deviation from planned route
            </Text>
          </View>
        </View>
        <View style={styles.segmentItem}>
          <View style={[styles.segmentBar, { backgroundColor: '#31A362' }]} />
          <View style={styles.segmentInfo}>
            <Text style={styles.segmentTitle}>Reconnect Point</Text>
            <Text style={styles.segmentDescription}>
              Green color showing where detour rejoins original route
            </Text>
          </View>
        </View>
      </View>
    </View>
  ),
}

export const ActiveVsInactive: Story = {
  render: () => (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Active vs Inactive States
      </Text>
      <View style={styles.stateComparison}>
        <View style={styles.stateItem}>
          <Text style={styles.stateLabel}>Inactive</Text>
          <View style={styles.strokePreview}>
            <View style={[styles.strokeLine, { height: 4, backgroundColor: '#FF6B35' }]} />
          </View>
          <Text style={styles.stateDescription}>Standard stroke width</Text>
        </View>
        <View style={styles.stateItem}>
          <Text style={styles.stateLabel}>Active</Text>
          <View style={styles.strokePreview}>
            <View style={[styles.strokeLine, { height: 6, backgroundColor: '#FF6B35' }]} />
          </View>
          <Text style={styles.stateDescription}>Increased stroke width (+2px)</Text>
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
    marginBottom: 16,
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
  polylineOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: 14,
    color: '#374151',
  },
  overlayLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  strokePreview: {
    width: 80,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strokeLine: {
    width: 60,
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  segmentList: {
    width: '100%',
    gap: 16,
  },
  segmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  segmentBar: {
    width: 8,
    height: 60,
    borderRadius: 4,
  },
  segmentInfo: {
    flex: 1,
  },
  segmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  segmentDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  stateComparison: {
    flexDirection: 'row',
    gap: 24,
  },
  stateItem: {
    alignItems: 'center',
    gap: 8,
  },
  stateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  stateDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
})
