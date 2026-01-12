import React from 'react'
import type { ImageSourcePropType } from 'react-native'
import { ImageBackground, StyleSheet, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { LaneShadowLogo } from './lane-shadow-logo'
import { TopographicBackground } from './topographic-background'

type AuthScreenLayoutProps = {
  title: string
  subtitle?: string
  children: React.ReactNode
  /**
   * Optional background texture image (e.g. "leather" PNG) to match designs.
   * When omitted, we fall back to the solid semantic background + glow.
   */
  backgroundImage?: ImageSourcePropType
  /**
   * Show the large primary-colored glow blob behind the screen.
   * Some screens (like sign-in) may want a cleaner background.
   */
  showGlow?: boolean
}

export const AuthScreenLayout = ({
  title,
  subtitle,
  children,
  backgroundImage,
  showGlow = true,
}: AuthScreenLayoutProps) => {
  const { semantic } = useSemanticTheme()

  return (
    <View style={[styles.root, { backgroundColor: semantic.color.background.default }]}>
      {backgroundImage ? (
        <ImageBackground
          source={backgroundImage}
          resizeMode="cover"
          style={StyleSheet.absoluteFillObject}
          imageStyle={{ opacity: 0.22 }}
        />
      ) : null}

      {/* Darken the texture + add depth (matches mock’s industrial blur feel). */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: semantic.color.scrim.default,
            opacity: 0.45,
          },
        ]}
      />

      {/* Background Decoration (Topographic Texture Simulation) */}
      <TopographicBackground opacity={0.1} />

      {/* Subtle “topographic glow” approximation */}
      {showGlow ? (
        <View
          pointerEvents="none"
          style={[
            styles.glow,
            {
              backgroundColor: semantic.color.primary.default,
              opacity: 0.08,
            },
          ]}
        />
      ) : null}

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            padding: semantic.space.lg,
          },
        ]}
        style={styles.scroll}
      >
        <View
          style={[
            styles.centerContent,
            {
              gap: semantic.space.xl,
              paddingVertical: semantic.space.lg,
            },
          ]}
        >
          <View
            style={[
              styles.brandMark,
              {
                backgroundColor: semantic.color.primary.default,
                borderRadius: semantic.radius.xl,
                height: semantic.space['4xl'],
                width: semantic.space['4xl'],
                ...semantic.elevation[3],
              },
            ]}
          >
            <LaneShadowLogo size={50} />
          </View>

          <View style={[styles.headerText, { gap: semantic.space.sm }]}>
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
                variant="titleMedium"
                style={{
                  color: semantic.color.onSurface.muted,
                  textAlign: 'center',
                }}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>

          <View style={styles.cardArea}>{children}</View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  glow: {
    position: 'absolute',
    left: -120,
    top: -160,
    height: 520,
    width: 520,
    borderRadius: 520,
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
