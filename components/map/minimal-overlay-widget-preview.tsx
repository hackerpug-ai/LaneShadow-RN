/**
 * MinimalOverlayWidget Preview
 *
 * Standalone preview component with static data for visual testing.
 * Run this in Storybook or add to a test screen to see the widget in action.
 */

import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { OverlayType } from './minimal-overlay-widget'
import { MinimalOverlayWidget } from './minimal-overlay-widget'

// Demo scenarios with different availability states
type Scenario = {
  name: string
  description: string
  availability: {
    wind: boolean
    rain: boolean
    temperature: boolean
  }
}

const SCENARIOS: Scenario[] = [
  {
    name: 'All Available',
    description: 'Full weather data - all overlays enabled',
    availability: { wind: true, rain: true, temperature: true },
  },
  {
    name: 'Wind Only',
    description: 'Route has wind data but no rain/temp',
    availability: { wind: true, rain: false, temperature: false },
  },
  {
    name: 'Rain + Temp',
    description: 'Rain and temp available, wind missing',
    availability: { wind: false, rain: true, temperature: true },
  },
  {
    name: 'None Available',
    description: 'No overlay data - widget hidden',
    availability: { wind: false, rain: false, temperature: false },
  },
]

export const MinimalOverlayWidgetPreview = () => {
  const [selectedScenario, setSelectedScenario] = useState(0)
  const [activeOverlay, setActiveOverlay] = useState<OverlayType | ''>('')

  const scenario = SCENARIOS[selectedScenario]
  const hasAnyData = Object.values(scenario.availability).some(Boolean)

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Minimal Overlay Widget</Text>
        <Text style={styles.subtitle}>Press the center icon to expand</Text>
      </View>

      {/* Widget preview area */}
      <View style={styles.previewArea}>
        {hasAnyData ? (
          <>
            <View style={styles.widgetContainer}>
              <MinimalOverlayWidget
                value={activeOverlay}
                onValueChange={setActiveOverlay}
                availability={scenario.availability}
                testID="preview-widget"
              />
            </View>

            {/* Current selection display */}
            {activeOverlay && (
              <View style={styles.selectionBadge}>
                <Text style={styles.selectionText}>Active: {activeOverlay}</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.hiddenState}>
            <Text style={styles.hiddenText}>Widget hidden - no overlay data available</Text>
          </View>
        )}
      </View>

      {/* Scenario selector */}
      <View style={styles.scenariosSection}>
        <Text style={styles.sectionTitle}>Scenarios</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scenariosList}
        >
          {SCENARIOS.map((s, index) => (
            <Pressable
              key={s.name}
              onPress={() => {
                setSelectedScenario(index)
                setActiveOverlay('')
              }}
              style={[styles.scenarioCard, selectedScenario === index && styles.scenarioCardActive]}
            >
              <Text
                style={[
                  styles.scenarioName,
                  selectedScenario === index && styles.scenarioNameActive,
                ]}
              >
                {s.name}
              </Text>
              <Text style={styles.scenarioDesc}>{s.description}</Text>
              <View style={styles.availabilityBadges}>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: s.availability.wind ? '#31A362' : '#444' },
                  ]}
                >
                  <Text style={styles.badgeText}>Wind</Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: s.availability.rain ? '#2B9AEB' : '#444' },
                  ]}
                >
                  <Text style={styles.badgeText}>Rain</Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: s.availability.temperature ? '#FF6B35' : '#444' },
                  ]}
                >
                  <Text style={styles.badgeText}>Temp</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>How it works:</Text>
        <Text style={styles.instructionsText}>
          • Tap center icon to expand/collapse radial menu
        </Text>
        <Text style={styles.instructionsText}>
          • Tap an overlay icon to select it (tap again to deselect)
        </Text>
        <Text style={styles.instructionsText}>• Disabled icons show when data is unavailable</Text>
        <Text style={styles.instructionsText}>• Active overlay shows with copper glow ring</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B1715',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#2B2725',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
  },
  previewArea: {
    height: 200,
    backgroundColor: '#24272B',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2B2725',
  },
  widgetContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionBadge: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#B87333' + '33',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#B87333',
  },
  selectionText: {
    color: '#B87333',
    fontSize: 14,
    fontWeight: '600',
  },
  hiddenState: {
    alignItems: 'center',
  },
  hiddenText: {
    color: '#666666',
    fontSize: 14,
  },
  scenariosSection: {
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  scenariosList: {
    paddingHorizontal: 8,
    gap: 12,
  },
  scenarioCard: {
    width: 200,
    padding: 16,
    backgroundColor: '#2B2725',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B3735',
    gap: 8,
  },
  scenarioCardActive: {
    borderColor: '#B87333',
    backgroundColor: '#2B2725' + 'CC',
  },
  scenarioName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  scenarioNameActive: {
    color: '#B87333',
  },
  scenarioDesc: {
    fontSize: 13,
    color: '#AAAAAA',
    lineHeight: 18,
    marginBottom: 8,
  },
  availabilityBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  instructions: {
    padding: 24,
    backgroundColor: '#24272B',
    marginTop: 24,
    marginHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#AAAAAA',
    lineHeight: 20,
  },
})
