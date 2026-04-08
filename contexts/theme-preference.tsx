import { createContext, useContext, useMemo } from 'react'
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
 */
export const ThemePreferenceProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme()
  const { themeMode, setThemeMode } = useSettingsStore()

  const isDark = useMemo(
    () => (themeMode === 'auto' ? systemScheme === 'dark' : themeMode === 'dark'),
    [themeMode, systemScheme]
  )

  return (
    <ThemePreferenceContext.Provider value={{ mode: themeMode, isDark, setMode: setThemeMode }}>
      {children}
    </ThemePreferenceContext.Provider>
  )
}
