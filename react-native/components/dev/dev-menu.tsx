/**
 * Dev Menu Component
 *
 * Floating button overlay for development tools
 * Only visible when dev mode is enabled via EXPO_PUBLIC_DEV_MENU=1 or __DEV__
 *
 * Features:
 * - Floating button (top-right, draggable)
 * - Bottom sheet modal with model management options
 * - Clear model file, reset setup state, view model info
 *
 * Following theme_rules: StyleSheet for static, inline for semantic theme
 */

import { MaterialCommunityIcons } from '@expo/vector-icons'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import * as FileSystem from 'expo-file-system/legacy'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Dimensions, Pressable, StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { Text } from 'react-native-paper'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { useDevMenuEnabled } from '../../lib/is-dev-menu'
import { useDownloadStore } from '../../stores/download-store'
import { Button } from '../ui/button'

// Test IDs for E2E
const TEST_IDS = {
  DEV_MENU_FAB: 'dev-menu-fab',
  DEV_MENU_SHEET: 'dev-menu-sheet',
  CLEAR_MODEL_BUTTON: 'clear-model-button',
  RESET_SETUP_BUTTON: 'reset-setup-button',
  MODEL_INFO_TEXT: 'model-info-text',
}

/**
 * Dev Menu Component
 */
export const DevMenu = () => {
  const { semantic } = useSemanticTheme()
  const isEnabled = useDevMenuEnabled()

  const clearModel = useDownloadStore((state) => state.clearModel)
  const resetSetup = useDownloadStore((state) => state.resetSetup)

  // State
  const [modelInfo, setModelInfo] = useState<string>('')
  const [loading, setLoading] = useState<string | null>(null)
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const snapPoints = useMemo(() => ['60%'], [])

  // Debug: Check if modal is mounted
  useEffect(() => {
    console.log('[DevMenu] Component mounted, isEnabled:', isEnabled)
    console.log('[DevMenu] bottomSheetRef.current:', bottomSheetRef.current)
  }, [isEnabled])

  // Drag position — useSharedValue runs on UI thread (like RML EdgeTab)
  const BUTTON_SIZE = 56
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window')
  const x = useSharedValue(screenWidth - BUTTON_SIZE - 16)
  const y = useSharedValue(60)
  const startX = useSharedValue(0)
  const startY = useSharedValue(0)

  const loadModelInfo = useCallback(async () => {
    try {
      const modelPath = `${FileSystem.documentDirectory!}models/qwen2.5-0.5b-instruct-q4_k_m.gguf`
      const info = await FileSystem.getInfoAsync(modelPath)

      if (info.exists) {
        const sizeInMB = (info.size || 0) / (1024 * 1024)
        setModelInfo(
          `Model: qwen2.5-0.5b-instruct-q4_k_m.gguf\nSize: ${sizeInMB.toFixed(2)} MB\nPath: ${modelPath}`,
        )
      } else {
        setModelInfo('No model file found')
      }
    } catch (error) {
      setModelInfo(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [])

  const handlePresent = useCallback(() => {
    console.log('[DevMenu] FAB pressed, presenting bottom sheet')
    console.log('[DevMenu] bottomSheetRef.current:', bottomSheetRef.current)
    setResult(null)
    loadModelInfo()

    // Small delay to ensure modal is fully mounted (iOS fix)
    setTimeout(() => {
      bottomSheetRef.current?.present()
      console.log('[DevMenu] present() called after delay')
    }, 50)
  }, [loadModelInfo])

  const handleDismiss = useCallback(() => {
    bottomSheetRef.current?.dismiss()
  }, [])

  const handleClearModel = useCallback(async () => {
    try {
      setLoading('clear-model')
      setResult(null)

      const modelPath = `${FileSystem.documentDirectory!}models/qwen2.5-0.5b-instruct-q4_k_m.gguf`
      await FileSystem.deleteAsync(modelPath, { idempotent: true })

      setResult({ type: 'success', text: 'Model file deleted. Reload app to see setup flow.' })
      loadModelInfo()
    } catch (error) {
      setResult({
        type: 'error',
        text: `Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    } finally {
      setLoading(null)
    }
  }, [loadModelInfo])

  const handleResetSetup = useCallback(async () => {
    try {
      setLoading('reset-setup')
      setResult(null)

      // Clear download store state
      resetSetup()

      setResult({ type: 'success', text: 'Setup state reset. Reload app to see setup flow.' })
    } catch (error) {
      setResult({
        type: 'error',
        text: `Failed to reset: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    } finally {
      setLoading(null)
    }
  }, [resetSetup])

  // Drag gesture — all on UI thread via useSharedValue (same pattern as RML EdgeTab)
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startX.value = x.value
      startY.value = y.value
    })
    .onUpdate((event) => {
      x.value = Math.max(0, Math.min(screenWidth - BUTTON_SIZE, startX.value + event.translationX))
      y.value = Math.max(0, Math.min(screenHeight - BUTTON_SIZE, startY.value + event.translationY))
    })
    .onEnd(() => {
      const centerX = x.value + BUTTON_SIZE / 2
      const snapX = centerX < screenWidth / 2 ? 16 : screenWidth - BUTTON_SIZE - 16
      x.value = withSpring(snapX)
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }] as any,
  }))

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  )

  if (!isEnabled) return null

  return (
    <>
      {/* Floating FAB */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.fab,
            {
              left: 0,
              top: 0,
              backgroundColor: semantic.color.primary.default,
              ...semantic.elevation[4],
            },
            animatedStyle,
          ]}
          testID={TEST_IDS.DEV_MENU_FAB}
        >
          <Pressable
            onPress={handlePresent}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.fabInner}
          >
            <MaterialCommunityIcons name="wrench" size={24} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      </GestureDetector>

      {/* Bottom Sheet */}
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: semantic.color.surface.default,
        }}
        handleIndicatorStyle={{
          backgroundColor: semantic.color.onSurface.subtle,
        }}
        animateOnMount={true}
        android_keyboardInputMode="adjustResize"
        topInset={0}
        onChange={(index) => console.log('[DevMenu] BottomSheet onChange:', index)}
      >
        <BottomSheetView style={[styles.content, { gap: semantic.space.lg }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="headlineSmall" style={{ color: semantic.color.onSurface.default }}>
              Developer Menu
            </Text>
          </View>

          {/* Model Info */}
          <View style={[styles.section, { gap: semantic.space.sm }]}>
            <Text variant="titleMedium" style={{ color: semantic.color.onSurface.muted }}>
              Model Information
            </Text>
            <Text
              variant="bodyMedium"
              style={[
                styles.infoText,
                {
                  backgroundColor: semantic.color.surfaceVariant.default,
                  color: semantic.color.onSurface.default,
                },
              ]}
              testID={TEST_IDS.MODEL_INFO_TEXT}
            >
              {modelInfo || 'Loading...'}
            </Text>
          </View>

          {/* Actions */}
          <View style={[styles.section, { gap: semantic.space.md }]}>
            <Text variant="titleMedium" style={{ color: semantic.color.onSurface.muted }}>
              Actions
            </Text>

            <Button
              variant="destructive"
              size="lg"
              onPress={handleClearModel}
              disabled={loading === 'clear-model'}
              testID={TEST_IDS.CLEAR_MODEL_BUTTON}
            >
              {loading === 'clear-model' ? 'Deleting...' : 'Clear Model File'}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onPress={handleResetSetup}
              disabled={loading === 'reset-setup'}
              testID={TEST_IDS.RESET_SETUP_BUTTON}
            >
              {loading === 'reset-setup' ? 'Resetting...' : 'Reset Setup State'}
            </Button>
          </View>

          {/* Result Banner */}
          {result && (
            <View
              style={[
                styles.resultBanner,
                {
                  backgroundColor:
                    result.type === 'success'
                      ? semantic.color.success.default
                      : semantic.color.danger.default,
                },
              ]}
            >
              <Text variant="bodyMedium" style={{ color: semantic.color.onPrimary.default }}>
                {result.text}
              </Text>
            </View>
          )}

          {/* Close Button */}
          <Button variant="secondary" size="lg" onPress={handleDismiss}>
            Close
          </Button>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  )
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    zIndex: 999999,
    elevation: 999999,
  },
  fabInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 8,
  },
  section: {
    marginBottom: 8,
  },
  infoText: {
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 16,
  },
  resultBanner: {
    padding: 12,
    borderRadius: 8,
  },
})
