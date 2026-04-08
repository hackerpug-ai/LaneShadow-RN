import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'
import { useSettingsStore } from '../stores/settings-store'

type ThemeMode = 'light' | 'dark' | 'auto'

type ThemePreferenceContextValue = {
  mode: ThemeMode
  isDark: boolean
  setMode: (mode: ThemeMode) => void
}

const ThemePreferenceContext = createContext<ThemePreferenceContextValue>({
  mode: 'auto',
  isDark: false,
  setMode: () => {},
})

export const useThemePreference = () => useContext(ThemePreferenceContext)

/**
 * Theme preference provider that reads from the settings store
 * and resolves the 'auto' mode against the system color scheme.
 *
 * Waits for Zustand persist to hydrate before rendering to avoid
 * showing incorrect theme during initial load.
 */
export const ThemePreferenceProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme()
  const { themeMode, setThemeMode, _hasHydrated } = useSettingsStore()
  const [ready, setReady] = useState(false)

  // Wait for hydration before rendering
  useEffect(() => {
    if (_hasHydrated) {
      setReady(true)
    }
  }, [_hasHydrated])

  const isDark = useMemo(
    () => (themeMode === 'auto' ? systemScheme === 'dark' : themeMode === 'dark'),
    [themeMode, systemScheme]
  )

  // Don't render until hydrated to avoid flash of wrong theme
  if (!ready) {
    return null
  }

  return (
    <ThemePreferenceContext.Provider value={{ mode: themeMode, isDark, setMode: setThemeMode }}>
      {children}
    </ThemePreferenceContext.Provider>
  )
}
