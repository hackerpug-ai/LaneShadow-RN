import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type PersistedCameraCenter = {
  latitude: number
  longitude: number
}

export type CameraSlot = {
  center: PersistedCameraCenter
  zoom: number
}

type MapCameraState = {
  /** Camera used when there is no active session (drawer closed, fresh app). */
  defaultCamera: CameraSlot | null
  /** Per-session camera cache, keyed by session id. */
  bySession: Record<string, CameraSlot>
  /** True once Zustand has rehydrated from AsyncStorage. */
  _hydrated: boolean
  /**
   * Save camera for a session id. Pass `null`/`undefined` to update the
   * default camera used when no session is active.
   */
  setCamera: (
    sessionId: string | null | undefined,
    center: PersistedCameraCenter,
    zoom: number
  ) => void
  /** Read camera for a session id (null → default). Returns null if unset. */
  getCamera: (sessionId: string | null | undefined) => CameraSlot | null
  /** Wipe everything (debug/test only). */
  reset: () => void
}

const DEFAULT_ZOOM = 14

export const useMapCameraStore = create<MapCameraState>()(
  persist(
    (set, get) => ({
      defaultCamera: null,
      bySession: {},
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
      reset: () => set({ defaultCamera: null, bySession: {} }),
    }),
    {
      name: 'laneshadow-map-camera',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state._hydrated = true
      },
      partialize: (state) => ({
        defaultCamera: state.defaultCamera,
        bySession: state.bySession,
      }),
      // v1 stored flat `{center, zoom}` — migrate it into defaultCamera.
      migrate: (persisted: any, version) => {
        if (version < 2 && persisted && typeof persisted === 'object') {
          const legacyCenter = persisted.center
          const legacyZoom = persisted.zoom
          return {
            defaultCamera:
              legacyCenter && typeof legacyZoom === 'number'
                ? { center: legacyCenter, zoom: legacyZoom }
                : null,
            bySession: {},
          }
        }
        return persisted
      },
    }
  )
)

export { DEFAULT_ZOOM }
