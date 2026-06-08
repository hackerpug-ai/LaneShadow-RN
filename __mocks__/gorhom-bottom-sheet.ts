/**
 * Mock for @gorhom/bottom-sheet
 */
import React from 'react'
import { TextInput } from 'react-native'

const createComponent = (name: string) => {
  const Component = ({ children, style, testID, ...props }: Record<string, unknown>) =>
    React.createElement(name, { style, testID, ...props }, children as React.ReactNode)
  Component.displayName = name
  return Component
}

export const BottomSheetModal = React.forwardRef((props: any, ref: any) => {
  const [presented, setPresented] = React.useState(false)
  React.useImperativeHandle(ref, () => ({
    present: () => setPresented(true),
    dismiss: () => setPresented(false),
  }))
  if (!presented) return null
  return React.createElement('View', { testID: props.testID || 'bottom-sheet' }, props.children)
})
BottomSheetModal.displayName = 'BottomSheetModal'

export const BottomSheetScrollView = createComponent('BottomSheetScrollView')
export const BottomSheetView = createComponent('BottomSheetView')
export const BottomSheetBackdrop = () => null
export const BottomSheetHandle = createComponent('BottomSheetHandle')
// BottomSheetTextInput is just a regular TextInput with special keyboard handling
// For tests, we can use the regular TextInput
export const BottomSheetTextInput = TextInput

export default {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetHandle,
  BottomSheetTextInput,
}
