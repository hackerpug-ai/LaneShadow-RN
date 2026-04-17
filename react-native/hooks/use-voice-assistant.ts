import { useCallback, useMemo, useState } from 'react'

type VoiceAssistantConfig = {
  scopeType?: string
  scopeId?: string
  classHint?: string
}

type VoiceAssistantState = {
  status: 'idle' | 'recording'
  transcript?: string
}

type VoiceAssistantAPI = {
  state: VoiceAssistantState
  isOverlayOpen: boolean
  isCameraOpen: boolean
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  openCamera: () => void
  closeCamera: () => void
  attachPhoto: () => void
  submitDraft: () => void
  saveDraft: () => void
  discardDraft: () => void
  dismissOverlay: () => void
}

/**
 * Minimal voice assistant stub for compile-time satisfaction.
 * Replace with real audio capture + assistant integration when available.
 */
export const useVoiceAssistant = (_config?: VoiceAssistantConfig): VoiceAssistantAPI => {
  const [state, setState] = useState<VoiceAssistantState>({ status: 'idle' })
  const [isOverlayOpen, setOverlayOpen] = useState(false)
  const [isCameraOpen, setCameraOpen] = useState(false)

  const startRecording = useCallback(async () => {
    setState({ status: 'recording' })
    setOverlayOpen(true)
  }, [])

  const stopRecording = useCallback(async () => {
    setState({ status: 'idle' })
  }, [])

  const openCamera = useCallback(() => setCameraOpen(true), [])
  const closeCamera = useCallback(() => setCameraOpen(false), [])
  const attachPhoto = useCallback(() => {}, [])
  const submitDraft = useCallback(() => setOverlayOpen(false), [])
  const saveDraft = useCallback(() => setOverlayOpen(false), [])
  const discardDraft = useCallback(() => setOverlayOpen(false), [])
  const dismissOverlay = useCallback(() => setOverlayOpen(false), [])

  return useMemo(
    () => ({
      state,
      isOverlayOpen,
      isCameraOpen,
      startRecording,
      stopRecording,
      openCamera,
      closeCamera,
      attachPhoto,
      submitDraft,
      saveDraft,
      discardDraft,
      dismissOverlay,
    }),
    [
      attachPhoto,
      closeCamera,
      discardDraft,
      dismissOverlay,
      isCameraOpen,
      isOverlayOpen,
      saveDraft,
      startRecording,
      state,
      stopRecording,
      submitDraft,
    ],
  )
}
