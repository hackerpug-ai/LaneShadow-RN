import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { BottomActionSheet } from '../ui/bottom-action-sheet'
import { SheetHandle } from './sheet-handle'

type SnapPreset = 'content' | 'half' | 'full'

const SNAP_PRESETS: Record<SnapPreset, (string | number)[]> = {
  content: ['40%'],
  half: ['60%'],
  full: ['90%'],
}

export type BottomSheetWrapperProps = {
  isVisible: boolean
  onClose: () => void
  children: ReactNode
  testID?: string
  preset?: SnapPreset
  snapPoints?: (string | number)[]
  wrapChildren?: boolean
  showHandle?: boolean
  footer?: ReactNode
  /**
   * Whether this sheet contains text inputs that need keyboard avoidance.
   * When true, enables interactive keyboard behavior and proper resize handling.
   * IMPORTANT: You should still wrap individual inputs with <KeyboardAvoidingInput>.
   */
  hasTextInput?: boolean
}

/**
 * Mid-level wrapper around the Gorhom BottomActionSheet that standardizes
 * snap points, spacing, and optional drag handle. Use this for most sheets.
 */
export const BottomSheetWrapper = ({
  isVisible,
  onClose,
  children,
  testID,
  preset = 'full',
  snapPoints,
  wrapChildren = true,
  showHandle = true,
  footer,
  hasTextInput = false,
}: BottomSheetWrapperProps) => {
  const { semantic } = useSemanticTheme()

  const resolvedSnapPoints = useMemo(() => snapPoints || SNAP_PRESETS[preset], [preset, snapPoints])

  return (
    <BottomActionSheet
      visible={isVisible}
      onDismiss={onClose}
      testID={testID}
      snapPoints={resolvedSnapPoints}
      hasTextInput={hasTextInput}
    >
      {wrapChildren ? (
        <View
          style={[
            styles.content,
            {
              paddingHorizontal: semantic.space.lg,
              paddingTop: semantic.space.md,
              paddingBottom: semantic.space.lg,
              gap: semantic.space.md,
            },
          ]}
        >
          {showHandle ? <SheetHandle /> : null}
          {children}
        </View>
      ) : (
        <View style={styles.unwrappedContainer}>
          {showHandle ? <SheetHandle /> : null}
          {children}
          {footer && <View style={styles.footerWrapper}>{footer}</View>}
        </View>
      )}
    </BottomActionSheet>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  unwrappedContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  footerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
})
