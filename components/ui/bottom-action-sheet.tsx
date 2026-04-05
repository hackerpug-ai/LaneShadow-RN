/**
 * Bottom Action Sheet Component
 *
 * Low-level primitive for bottom sheets with consistent positioning and styling
 * Provides Modal + Portal + safe area handling
 * Following theme_rules.mdc
 */

import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { StyleSheet } from 'react-native'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { Provider as PaperProvider } from 'react-native-paper'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

export type BottomActionSheetProps = {
  visible: boolean
  onDismiss: () => void
  children: ReactNode
  /**
   * Snap points for the bottom sheet. Can be percentages ('90%') or pixel values (600).
   * Defaults to ['90%'] for full-screen-like behavior.
   */
  snapPoints?: (string | number)[]
  /**
   * For scrollable Gorhom components (BottomSheetScrollView/FlatList/SectionList),
   * set wrapChildren to false so those components can manage gestures.
   */
  /**
   * Optional testID applied when wrapChildren=true (on the BottomSheetView). For scrollable
   * content (wrapChildren=false), attach a testID to the scrollable component directly.
   */
  testID?: string
}

/**
 * Low-level Gorhom bottom sheet primitive used throughout the app.
 * Uses stackBehavior="push" to allow sheet-to-sheet stacking.
 */
export const BottomActionSheet = ({
  visible,
  onDismiss,
  children,
  snapPoints: customSnapPoints,
  testID,
}: BottomActionSheetProps) => {
  const { semantic } = useSemanticTheme()
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const isPresented = useRef(false)

  const snapPoints = useMemo(() => customSnapPoints || ['90%'], [customSnapPoints])

  useEffect(() => {
    if (visible && !isPresented.current) {
      bottomSheetRef.current?.present()
      isPresented.current = true
    } else if (!visible && isPresented.current) {
      bottomSheetRef.current?.dismiss()
      isPresented.current = false
    }
  }, [visible])

  const handleDismiss = useCallback(() => {
    isPresented.current = false
    onDismiss()
  }, [onDismiss])

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  )

  // Capture the theme object to pass to PaperProvider
  const theme = useSemanticTheme()

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDismissOnClose
      stackBehavior="push"
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: semantic.color.background.default,
      }}
      handleComponent={() => null}
    >
      <PaperProvider theme={theme}>
        <BottomSheetView style={[styles.container]} testID={testID}>
          {children}
        </BottomSheetView>
      </PaperProvider>
    </BottomSheetModal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
