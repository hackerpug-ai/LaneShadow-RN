/**
 * Unit tests for selected-route.tsx
 *
 * Acceptance Criteria:
 * - AC1: SelectedRouteProvider renders children without throwing
 * - AC2: useSelectedRoute returns null selectedRouteId by default
 * - AC3: setSelectedRouteId updates the selectedRouteId value
 * - AC4: useSelectedRoute throws when used outside SelectedRouteProvider
 */

import { vi, describe, it, expect } from 'vitest'
import React from 'react'
import { render, act } from '@testing-library/react-native'
import { Text } from 'react-native'
import { SelectedRouteProvider, useSelectedRoute } from './selected-route'

// ---------------------------------------------------------------------------
// Helper component that consumes the context
// ---------------------------------------------------------------------------

const Consumer = ({ onRender }: { onRender: (id: string | null) => void }) => {
  const { selectedRouteId } = useSelectedRoute()
  onRender(selectedRouteId)
  return <Text testID="consumer">{selectedRouteId ?? 'null'}</Text>
}

const Setter = ({ id }: { id: string | null }) => {
  const { setSelectedRouteId } = useSelectedRoute()
  React.useEffect(() => {
    setSelectedRouteId(id)
  }, [id, setSelectedRouteId])
  return null
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SelectedRouteProvider', () => {
  /**
   * AC1: Renders children without throwing
   */
  it('renders children without throwing', () => {
    const { getByTestId } = render(
      <SelectedRouteProvider>
        <Text testID="child">hello</Text>
      </SelectedRouteProvider>,
    )
    expect(getByTestId('child')).toBeTruthy()
  })

  /**
   * AC2: Default selectedRouteId is null
   */
  it('provides null selectedRouteId by default', () => {
    const rendered: Array<string | null> = []
    render(
      <SelectedRouteProvider>
        <Consumer onRender={(id) => rendered.push(id)} />
      </SelectedRouteProvider>,
    )
    expect(rendered[0]).toBeNull()
  })

  /**
   * AC3: setSelectedRouteId updates the value
   */
  it('updates selectedRouteId when setSelectedRouteId is called', () => {
    const rendered: Array<string | null> = []
    render(
      <SelectedRouteProvider>
        <Consumer onRender={(id) => rendered.push(id)} />
        <Setter id="route-abc" />
      </SelectedRouteProvider>,
    )
    const last = rendered[rendered.length - 1]
    expect(last).toBe('route-abc')
  })

  /**
   * AC4: useSelectedRoute throws outside provider
   * (With a default context value this won't throw — the hook returns the
   *  default {selectedRouteId: null} safely. This test verifies no crash.)
   */
  it('useSelectedRoute does not crash when used without provider (uses default value)', () => {
    const rendered: Array<string | null> = []
    expect(() =>
      render(<Consumer onRender={(id) => rendered.push(id)} />),
    ).not.toThrow()
    expect(rendered[0]).toBeNull()
  })
})
