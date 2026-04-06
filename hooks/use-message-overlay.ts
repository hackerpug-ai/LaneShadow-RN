import { useCallback, useMemo, useRef, useState } from 'react'
import { PanResponder } from 'react-native'

/**
 * Gesture logic for the transient message overlay.
 *
 * Provides:
 *  - `pinned` state: when true the auto-dismiss timer should be ignored
 *  - `pin()`:  tap handler -- cancels auto-dismiss, keeps overlay visible
 *  - `dismiss()`: programmatic dismiss -- hides overlay and resets pin
 *  - `panResponder`: attach to the overlay View for swipe-up-to-dismiss
 *
 * Pin state resets automatically when `resetPin()` is called (the
 * consuming component should call it when `transientVisible` transitions
 * to `true` for a new message).
 */
export function useMessageOverlay(opts: {
  clearTransientTimer: () => void
  setTransientVisible: (v: boolean) => void
}) {
  const { clearTransientTimer, setTransientVisible } = opts

  const [pinned, setPinned] = useState(false)
  const pinnedRef = useRef(false)

  // Keep stable refs so the PanResponder closure always calls current fns
  const clearTimerRef = useRef(clearTransientTimer)
  clearTimerRef.current = clearTransientTimer
  const setVisibleRef = useRef(setTransientVisible)
  setVisibleRef.current = setTransientVisible

  /** Tap on the transcript -- cancel auto-dismiss, keep it visible. */
  const pin = useCallback(() => {
    setPinned(true)
    pinnedRef.current = true
    clearTimerRef.current()
  }, [])

  /** Dismiss the overlay immediately (swipe-up or map tap). */
  const dismiss = useCallback(() => {
    setPinned(false)
    pinnedRef.current = false
    clearTimerRef.current()
    setVisibleRef.current(false)
  }, [])

  /** Reset pin state when a new transient display is triggered. */
  const resetPin = useCallback(() => {
    setPinned(false)
    pinnedRef.current = false
  }, [])

  /**
   * PanResponder for swipe-up detection on the transcript overlay.
   * Captures vertical drags (dy < -10) and dismisses when dy < -30.
   * Uses refs so the closure never goes stale.
   */
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gestureState) => gestureState.dy < -10,
        onPanResponderRelease: (_evt, gestureState) => {
          if (gestureState.dy < -30) {
            setPinned(false)
            pinnedRef.current = false
            clearTimerRef.current()
            setVisibleRef.current(false)
          }
        },
      }),
    []
  )

  return { pinned, pinnedRef, pin, dismiss, resetPin, panResponder } as const
}
