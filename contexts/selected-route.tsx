import { createContext, useContext, useState } from 'react'
import type React from 'react'

type SelectedRouteContextValue = {
  selectedRouteId: string | null
  setSelectedRouteId: (id: string | null) => void
}

const SelectedRouteContext = createContext<SelectedRouteContextValue>({
  selectedRouteId: null,
  setSelectedRouteId: () => {},
})

export const useSelectedRoute = () => useContext(SelectedRouteContext)

export const SelectedRouteProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)

  return (
    <SelectedRouteContext.Provider value={{ selectedRouteId, setSelectedRouteId }}>
      {children}
    </SelectedRouteContext.Provider>
  )
}
