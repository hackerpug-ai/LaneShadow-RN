import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Button, Text } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'

/**
 * Home Screen
 * Template entry point for authenticated users
 * Shows basic Convex + React Native Paper integration
 */
export const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text variant="displaySmall" style={styles.title}>
            Welcome
          </Text>

          <Text variant="bodyLarge" style={styles.subtitle}>
            React Native + Convex Template
          </Text>

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              What's Included
            </Text>

            <Text variant="bodyMedium" style={styles.listItem}>
              • Expo Router for navigation
            </Text>
            <Text variant="bodyMedium" style={styles.listItem}>
              • React Native Paper UI kit
            </Text>
            <Text variant="bodyMedium" style={styles.listItem}>
              • Convex backend integration
            </Text>
            <Text variant="bodyMedium" style={styles.listItem}>
              • Zod-first data models
            </Text>
          </View>

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Next Steps
            </Text>

            <Text variant="bodySmall" style={styles.description}>
              1. Read models/README.md for data modeling guide{'\n'}
              2. Read convex/README.md for Convex functions guide{'\n'}
              3. Add your first data model in models/
              {'\n'}
              4. Create Convex queries/mutations in convex/
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Button mode="outlined">Learn More</Button>
          <Button mode="contained">Get Started</Button>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  content: {
    gap: 24,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 16,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  listItem: {
    marginLeft: 8,
  },
  description: {
    lineHeight: 22,
  },
  footer: {
    gap: 12,
    paddingBottom: 16,
  },
})

export default HomeScreen
