import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

type ThemeMode = 'light' | 'dark' | 'auto'

type SettingsState = {
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
  hasCompletedOnboarding: boolean
  setHasCompletedOnboarding: (value: boolean) => void
  _hydrated: boolean
}

/**
 * Settings store managed by Zustand with AsyncStorage persist.
 *
 * Theme preference persists across app restarts via AsyncStorage.
 * The store hydrates from storage on initialization.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themeMode: 'auto',
      setThemeMode: (mode) => set({ themeMode: mode }),
      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: (value) => set({ hasCompletedOnboarding: value }),
      _hydrated: false,
    }),
    {
      name: 'laneshadow-settings',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Mark as hydrated after rehydration completes
        // This fires both when there IS data to rehydrate AND when there isn't
        state._hydrated = true
      },
      partialize: (state) => {
        // Don't persist the _hydrated flag itself
         
        const { _hydrated, ...rest } = state
        return rest
      },
    }
  )
)
