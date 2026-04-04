import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useColorScheme } from 'react-native'
import { asyncStorage, type StorageSchema } from '../hooks/use-async-storage'

type ThemeMode = NonNullable<StorageSchema['theme_preference']>

type ThemePreferenceContextValue = {
  mode: ThemeMode
  isDark: boolean
  setMode: (mode: ThemeMode) => Promise<void>
}

const ThemePreferenceContext = createContext<ThemePreferenceContextValue>({
  mode: 'auto',
  isDark: false,
  setMode: async () => {},
})

export const useThemePreference = () => useContext(ThemePreferenceContext)

export const ThemePreferenceProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme()
  const [mode, setModeState] = useState<ThemeMode>('auto')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    asyncStorage.getItem('theme_preference').then((stored) => {
      if (stored) setModeState(stored)
      setLoaded(true)
    })
  }, [])

  const setMode = useCallback(async (next: ThemeMode) => {
    setModeState(next)
    await asyncStorage.setItem('theme_preference', next)
  }, [])

  const isDark =
    mode === 'auto' ? systemScheme === 'dark' : mode === 'dark'

  if (!loaded) return null

  return (
    <ThemePreferenceContext.Provider value={{ mode, isDark, setMode }}>
      {children}
    </ThemePreferenceContext.Provider>
  )
}
