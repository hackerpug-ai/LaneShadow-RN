/**
 * PlanFab Component Story
 * Floating action button for starting ride planning
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { PlanFab } from '../../components/map/plan-fab'

const meta: Meta<typeof PlanFab> = {
  title: 'Map/PlanFab',
  component: PlanFab,
  parameters: {
    docs: {
      description: {
        component: 'Floating action button (FAB) positioned at bottom of screen for initiating ride planning. Uses primary color with shadow elevation for prominence.',
      },
    },
    layout: 'fullscreen',
  },
  argTypes: {
    onPress: {
      description: 'Callback when button is pressed',
    },
  },
  args: {
    onPress: () => console.log('Plan Ride pressed'),
  },
}

export default meta
type Story = StoryObj<typeof PlanFab>

export const Default: Story = {
  render: (args) => (
    <View style={styles.mapContainer}>
      <View style={styles.placeholderMap}>
        <PlanFab {...args} />
      </View>
    </View>
  ),
}

export const OnMapBackground: Story = {
  render: (args) => (
    <View style={styles.mapContainer}>
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapGrid}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View key={i} style={styles.gridLine} />
          ))}
        </View>
        <PlanFab {...args} />
      </View>
    </View>
  ),
}

export const WithBottomSheet: Story = {
  render: (args) => (
    <View style={styles.mapContainer}>
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapGrid}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View key={i} style={styles.gridLine} />
          ))}
        </View>
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetContent}>
            <View style={styles.sheetLine} />
            <View style={styles.sheetLineShort} />
          </View>
        </View>
        <PlanFab {...args} />
      </View>
    </View>
  ),
}

export const Interactive: Story = {
  render: () => {
    const [pressed, setPressed] = React.useState(false)
    const [count, setCount] = React.useState(0)

    const handlePress = () => {
      setPressed(true)
      setCount((prev) => prev + 1)
      setTimeout(() => setPressed(false), 200)
    }

    return (
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <View style={styles.mapGrid}>
            {Array.from({ length: 20 }).map((_, i) => (
              <View key={i} style={styles.gridLine} />
            ))}
          </View>
          {pressed && (
            <View style={styles.feedback}>
              <Text style={styles.feedbackText}>
                Opening route planner... ({count})
              </Text>
            </View>
          )}
          <PlanFab onPress={handlePress} />
        </View>
      </View>
    )
  },
}

export const MultipleStates: Story = {
  render: () => (
    <View style={styles.statesContainer}>
      <View style={styles.stateRow}>
        <View style={styles.stateColumn}>
          <Text style={styles.stateLabel}>Default</Text>
          <View style={[styles.stateBox, { backgroundColor: '#E5E7EB' }]}>
            <PlanFab onPress={() => {}} />
          </View>
        </View>
      </View>
    </View>
  ),
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
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#9CA3AF',
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    flexWrap: 'wrap',
    opacity: 0.3,
  },
  gridLine: {
    width: '20%',
    height: 2,
    backgroundColor: '#6B7280',
    marginVertical: 20,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  sheetContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  sheetLine: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    width: '100%',
  },
  sheetLineShort: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    width: '60%',
  },
  feedback: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  feedbackText: {
    fontSize: 14,
    color: '#374151',
  },
  statesContainer: {
    flex: 1,
    padding: 20,
    gap: 40,
  },
  stateRow: {
    flexDirection: 'row',
    gap: 20,
  },
  stateColumn: {
    flex: 1,
    gap: 12,
  },
  stateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  stateBox: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
  },
})
