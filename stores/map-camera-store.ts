import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type PersistedCameraCenter = {
  latitude: number
  longitude: number
}

type MapCameraState = {
  center: PersistedCameraCenter | null
  zoom: number
  _hydrated: boolean
  setCamera: (center: PersistedCameraCenter, zoom: number) => void
  reset: () => void
}

const DEFAULT_ZOOM = 14

export const useMapCameraStore = create<MapCameraState>()(
  persist(
    (set) => ({
      center: null,
      zoom: DEFAULT_ZOOM,
      _hydrated: false,
      setCamera: (center, zoom) => set({ center, zoom }),
      reset: () => set({ center: null, zoom: DEFAULT_ZOOM }),
    }),
    {
      name: 'laneshadow-map-camera',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state._hydrated = true
      },
      partialize: (state) => ({
        center: state.center,
        zoom: state.zoom,
      }),
    }
  )
)
