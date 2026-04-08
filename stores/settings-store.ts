import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

type ThemeMode = 'light' | 'dark' | 'auto'

type SettingsState = {
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
  _hasHydrated: boolean
  setHasHydrated: (hasHydrated: boolean) => void
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
      _hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),
    }),
    {
      name: 'laneshadow-settings',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
