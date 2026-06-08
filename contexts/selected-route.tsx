import type React from 'react'
import { createContext, useCallback, useContext, useRef, useState } from 'react'

type SelectedRouteContextValue = {
  selectedRouteId: string | null
  setSelectedRouteId: (id: string | null) => void
  /** The route plan ID currently displayed on the map. When null, shows the newest plan. */
  displayedRoutePlanId: string | null
  setDisplayedRoutePlanId: (id: string | null) => void
  /** Request the map to fit the active route. The home screen registers
   *  its fit implementation via `registerFitHandler`. */
  requestFitToRoute: () => void
  /** Request the map to fit the active route and allow camera reset. This is
   *  called when a plan card is explicitly pressed, overriding the persistent
   *  camera state preservation during chat/map toggles. */
  requestFitToRouteWithReset: () => void
  /** Register a handler that performs the actual map fit. Called by the
   *  home screen so the context can invoke it from any tab. */
  registerFitHandler: (handler: (() => void) | null) => void
}

const SelectedRouteContext = createContext<SelectedRouteContextValue>({
  selectedRouteId: null,
  setSelectedRouteId: () => {},
  displayedRoutePlanId: null,
  setDisplayedRoutePlanId: () => {},
  requestFitToRoute: () => {},
  requestFitToRouteWithReset: () => {},
  registerFitHandler: () => {},
})

export const useSelectedRoute = () => useContext(SelectedRouteContext)

export const SelectedRouteProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [displayedRoutePlanId, setDisplayedRoutePlanId] = useState<string | null>(null)
  const fitHandlerRef = useRef<(() => void) | null>(null)

  const registerFitHandler = useCallback((handler: (() => void) | null) => {
    fitHandlerRef.current = handler
  }, [])

  const requestFitToRoute = useCallback(() => {
    fitHandlerRef.current?.()
  }, [])

  const requestFitToRouteWithReset = useCallback(() => {
    fitHandlerRef.current?.()
  }, [])

  return (
    <SelectedRouteContext.Provider
      value={{
        selectedRouteId,
        setSelectedRouteId,
        displayedRoutePlanId,
        setDisplayedRoutePlanId,
        requestFitToRoute,
        requestFitToRouteWithReset,
        registerFitHandler,
      }}
    >
      {children}
    </SelectedRouteContext.Provider>
  )
}
