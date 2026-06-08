import { useMemo } from 'react'
import type { DrawerMenuItem, DrawerMenuSection } from '../components/ui/drawer-menu'

type DrawerConfig = {
  isOpen: boolean
  sections: DrawerMenuSection[]
  footerItems: DrawerMenuItem[]
  open: () => void
  close: () => void
}

/**
 * Minimal stub for teacher drawer config to satisfy type-checks.
 * Replace with real implementation when drawer UX is built.
 */
export const useTeacherDrawerConfig = (): DrawerConfig => {
  const api = useMemo<DrawerConfig>(
    () => ({
      isOpen: false,
      sections: [],
      footerItems: [],
      open: () => {},
      close: () => {},
    }),
    [],
  )

  return api
}
