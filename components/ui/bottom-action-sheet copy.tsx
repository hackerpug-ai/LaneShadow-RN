/**
 * Bottom Action Sheet Component
 *
 * Using @gorhom/bottom-sheet for proper bottom sheet behavior
 * Provides automatic safe area handling and native gestures
 * Following theme_rules.mdc
 */

import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

export type BottomActionSheetProps = {
  visible: boolean
  onDismiss: () => void
  children: ReactNode
  testID?: string
  /**
   * Snap points for the bottom sheet. Can be percentages ('90%') or pixel values (600).
   * Defaults to ['90%'] for full-screen-like behavior.
   */
  snapPoints?: Array<string | number>
  /**
   * By default we wrap `children` in a `BottomSheetView` to provide a consistent
   * layout container for non-scrollable sheets.
   *
   * For scrollable content (e.g. `BottomSheetScrollView`, `BottomSheetFlatList`),
   * setting this to `false` allows those components to be rendered directly under
   * `BottomSheetModal`, which is required for proper gesture + scroll coordination.
   */
  wrapChildren?: boolean
}

export const BottomActionSheet = ({
  visible,
  onDismiss,
  children,
  testID,
  snapPoints: customSnapPoints,
  wrapChildren = true,
}: BottomActionSheetProps) => {
  const { semantic } = useSemanticTheme()
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const isPresented = useRef(false)

  // Use custom snap points or default to 90% of screen height
  const snapPoints = useMemo(() => customSnapPoints || ['90%'], [customSnapPoints])

  // Control visibility via present/dismiss
  useEffect(() => {
    if (visible && !isPresented.current) {
      bottomSheetRef.current?.present()
      isPresented.current = true
    } else if (!visible && isPresented.current) {
      bottomSheetRef.current?.dismiss()
      isPresented.current = false
    }
  }, [visible])

  // Track when modal is dismissed externally (drag down, backdrop tap)
  const handleDismiss = useCallback(() => {
    isPresented.current = false
    onDismiss()
  }, [onDismiss])

  // Backdrop with fade animation
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

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDismissOnClose={true}
      stackBehavior="push"
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: semantic.color.surface.default,
      }}
      handleIndicatorStyle={{
        backgroundColor: semantic.color.onSurface.muted,
        width: 40,
        height: 4,
      }}
    >
      {wrapChildren ? <BottomSheetView style={{ flex: 1 }}>{children}</BottomSheetView> : children}
    </BottomSheetModal>
  )
}
