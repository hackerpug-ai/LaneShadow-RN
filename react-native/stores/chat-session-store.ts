import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type PersistedCameraCenter = {
  latitude: number
  longitude: number
}

export type CameraSlot = {
  center: PersistedCameraCenter
  zoom: number
}

type ChatSessionState = {
  // ---- Camera cache ---------------------------------------------------
  /** Camera used when no session is active (drawer closed, fresh app). */
  defaultCamera: CameraSlot | null
  /** Per-session camera cache, keyed by session id. */
  bySession: Record<string, CameraSlot>

  // ---- Session selection ----------------------------------------------
  /**
   * The session id the user was last viewing. Used on app launch so we
   * resume where they left off instead of always jumping to the newest
   * session in the list.
   */
  lastViewedSessionId: string | null

  // ---- Lifecycle ------------------------------------------------------
  /** True once Zustand has rehydrated from AsyncStorage. */
  _hydrated: boolean

  // ---- Camera methods -------------------------------------------------
  /**
   * Save camera for a session id. Pass `null`/`undefined` to update the
   * default camera used when no session is active.
   */
  setCamera: (
    sessionId: string | null | undefined,
    center: PersistedCameraCenter,
    zoom: number,
  ) => void
  /** Read camera for a session id (null → default). Returns null if unset. */
  getCamera: (sessionId: string | null | undefined) => CameraSlot | null

  // ---- Session methods ------------------------------------------------
  setLastViewedSession: (sessionId: string | null) => void

  /** Wipe everything (debug/test only). */
  reset: () => void
}

const DEFAULT_ZOOM = 14

export const useChatSessionStore = create<ChatSessionState>()(
  persist(
    (set, get) => ({
      defaultCamera: null,
      bySession: {},
      lastViewedSessionId: null,
      _hydrated: false,
      setCamera: (sessionId, center, zoom) => {
        if (sessionId) {
          set((state) => ({
            bySession: { ...state.bySession, [sessionId]: { center, zoom } },
          }))
        } else {
          set({ defaultCamera: { center, zoom } })
        }
      },
      getCamera: (sessionId) => {
        if (sessionId) {
          return get().bySession[sessionId] ?? null
        }
        return get().defaultCamera
      },
      setLastViewedSession: (sessionId) => set({ lastViewedSessionId: sessionId }),
      reset: () => set({ defaultCamera: null, bySession: {}, lastViewedSessionId: null }),
    }),
    {
      name: 'laneshadow-chat-session',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state._hydrated = true
      },
      partialize: (state) => ({
        defaultCamera: state.defaultCamera,
        bySession: state.bySession,
        lastViewedSessionId: state.lastViewedSessionId,
      }),
    },
  ),
)

export { DEFAULT_ZOOM }
