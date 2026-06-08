import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import {
  scenarioGroupOrder,
  scenarioRegistry,
  scenarioRegistryStats,
} from './scenarioRegistry.generated'

const groupEntries = scenarioGroupOrder.map((tier) => ({
  tier,
  entries: scenarioRegistry.filter((entry) => entry.tier === tier),
}))

const RegistryBrowser = () => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <Text variant="headlineSmall">RN Scenario Registry</Text>
    <Text style={styles.copy}>
      Stable RN baseline scenarios that native iOS and Android sandboxes must mirror one-for-one via
      Story.id and Story.summary.
    </Text>

    <View style={styles.summaryGrid}>
      {scenarioGroupOrder.map((tier) => (
        <View key={tier} style={styles.summaryCard}>
          <Text variant="titleMedium">{tier}</Text>
          <Text variant="bodyMedium">{scenarioRegistryStats[tier]} scenarios</Text>
        </View>
      ))}
    </View>

    {groupEntries.map(({ tier, entries }) => (
      <View key={tier} style={styles.section}>
        <Text variant="titleLarge">{tier}</Text>
        {entries.length === 0 ? (
          <Text style={styles.emptyState}>No RN baseline scenarios are mapped to this tier yet.</Text>
        ) : (
          entries.map((entry) => (
            <View key={entry.id} style={styles.entry}>
              <Text variant="titleSmall">{entry.id}</Text>
              <Text style={styles.path}>{entry.rnReferencePath}</Text>
              <Text style={styles.meta}>
                {entry.storyTitle} · {entry.storyExport} · fixture {entry.fixtureKey}
              </Text>
              <Text style={styles.meta}>
                screenshot {entry.screenshotBasename} · themes {entry.themeCoverage.join(', ')}
              </Text>
            </View>
          ))
        )}
      </View>
    ))}
  </ScrollView>
)

const meta: Meta<typeof RegistryBrowser> = {
  title: 'Registry/ScenarioRegistry',
  component: RegistryBrowser,
  parameters: {
    docs: {
      description: {
        component:
          'Machine-readable RN scenario contract used as the baseline for AppStories.all and LaneShadowStories.all parity work.',
      },
    },
  },
}

export default meta

type Story = StoryObj<typeof RegistryBrowser>

export const Browser: Story = {}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 16,
  },
  copy: {
    opacity: 0.8,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    borderRadius: 12,
    gap: 4,
    minWidth: 140,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  section: {
    gap: 10,
  },
  entry: {
    borderRadius: 12,
    gap: 4,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  path: {
    opacity: 0.72,
  },
  meta: {
    fontFamily: 'monospace',
    fontSize: 12,
    opacity: 0.72,
  },
  emptyState: {
    opacity: 0.64,
  },
})
