import React from 'react'
import { StyleSheet, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

type AuthScreenLayoutProps = {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export const AuthScreenLayout = ({ title, subtitle, children }: AuthScreenLayoutProps) => {
  const { semantic } = useSemanticTheme()

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        {
          backgroundColor: semantic.color.background.default,
          padding: semantic.space.lg,
        },
      ]}
      style={styles.scroll}
    >
      <View
        style={[
          styles.centerContent,
          {
            gap: semantic.space.lg,
            paddingVertical: semantic.space.lg,
          },
        ]}
      >
        <View
          style={[
            styles.brandMark,
            {
              backgroundColor: semantic.color.primary.default,
              borderRadius: semantic.radius.lg,
              height: semantic.space['4xl'],
              width: semantic.space['4xl'],
            },
          ]}
        >
          <Text
            variant="headlineMedium"
            style={{
              color: semantic.color.onPrimary.default,
            }}
          >
            LS
          </Text>
        </View>

        <View
          style={[
            styles.headerText,
            {
              gap: semantic.space.sm,
            },
          ]}
        >
          <Text
            variant="headlineLarge"
            style={{
              color: semantic.color.onSurface.default,
              textAlign: 'center',
            }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              variant="bodyMedium"
              style={{ color: semantic.color.onSurface.muted, textAlign: 'center' }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.cardArea}>{children}</View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  centerContent: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignItems: 'stretch',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  brandMark: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  headerText: {
    alignItems: 'center',
  },
  cardArea: {
    width: '100%',
  },
})
