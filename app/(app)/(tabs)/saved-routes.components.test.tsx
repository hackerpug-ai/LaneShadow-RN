/**
 * SAVE-001 / AC-2: SavedRouteCard tolerance for curated rows.
 *
 * A curated saved_routes row carries `curatedRouteRef` + name + centroid + score
 * + archetype but NO legs / preview distance / duration (the lean preview).
 * The Saved list must render it WITHOUT crashing (no 'undefined' legs error).
 *
 * Tests the CuratedSavedRouteCard atom + the isCuratedSavedItem discriminator.
 */

import React from 'react'
import { Text } from 'react-native'
import renderer, { act } from 'react-test-renderer'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({
    semantic: {
      color: {
        card: { default: '#000' },
        background: { default: '#000' },
        onSurface: { default: '#fff', muted: '#888', subtle: '#aaa' },
        primary: { default: '#b86' },
        secondary: { default: '#68b' },
        onSecondary: { default: '#fff' },
        border: { default: '#333' },
      },
      space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
      radius: { lg: 16, md: 8, sm: 4, full: 9999 },
      type: {
        title: { sm: { fontSize: 16, fontWeight: '600' } },
        body: { sm: { fontSize: 13 }, xs: { fontSize: 11 } },
        label: { sm: { fontSize: 12 } },
      },
    },
  }),
}))

// Stub the Badge component (real one pulls vector-icons / paper).
vi.mock('../../../components/ui/badge', () => ({
  Badge: ({ children, testID }: { children: React.ReactNode; testID?: string }) =>
    React.createElement(Text, { testID }, children),
}))

// SubpageLayout transitively imports expo-router (JSX that vitest can't parse).
// The curated card test doesn't need it — stub it out.
vi.mock('../../../components/layouts/subpage-layout', () => ({
  SubpageLayout: 'SubpageLayout',
}))
// DateRangePicker / RouteSearchBar are unused by the curated card — stub to avoid
// pulling in additional RN runtime deps.
vi.mock('../../../components/ui/date-range-picker', () => ({
  DateRangePicker: 'DateRangePicker',
}))
vi.mock('../../../components/ui/route-search-bar', () => ({
  RouteSearchBar: 'RouteSearchBar',
}))
vi.mock('../../../components/ui/skeleton', () => ({ Skeleton: 'Skeleton' }))

import { CuratedSavedRouteCard, isCuratedSavedItem } from './saved-routes.components'

describe('SAVE-001 / AC-2: CuratedSavedRouteCard', () => {
  it('renders the curated route name without crashing (no legs required)', () => {
    // Curated-shape row: curatedRouteRef present, no planInput/routeSnapshot/legs.
    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(
        <CuratedSavedRouteCard
          name="Wasatch Ridge Loop"
          centroidLabel="Wasatch Range, UT"
          compositeScore={0.87}
          archetype="Scenic"
          dateSaved="Jul 4, 2026"
          onPress={() => {}}
        />,
      )
    })

    // The name literal MUST appear in the rendered tree.
    const nameNode = tree.root.findAll(
      (node) =>
        typeof node.type === 'string' &&
        node.type === 'Text' &&
        typeof node.props.children === 'string' &&
        node.props.children.includes('Wasatch Ridge Loop'),
    )
    expect(nameNode.length, 'curated card must render the route name').toBeGreaterThan(0)
  })

  it('renders the archetype + score (lean preview) without legs/distance', () => {
    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(
        <CuratedSavedRouteCard
          name="Alpine Loop"
          centroidLabel="San Juan, CO"
          compositeScore={0.92}
          archetype="Technical"
          onPress={() => {}}
        />,
      )
    })

    const text = tree.root.findAllByType(Text).map((n) => n.props.children)
    const joined = JSON.stringify(text)

    // Lean preview content present
    expect(joined).toContain('Alpine Loop')
    expect(joined).toContain('Technical')
    expect(joined).toContain('San Juan, CO')

    // ── must NOT observe synthesized distance/duration from legs ──
    expect(joined).not.toContain('undefined')
    expect(joined).not.toContain('NaN')
  })

  it('invokes onPress when pressed', () => {
    const onPress = vi.fn()
    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(
        <CuratedSavedRouteCard
          name="Test Curated"
          centroidLabel="Place"
          compositeScore={0.5}
          archetype="Scenic"
          onPress={onPress}
        />,
      )
    })
    // The Pressable root — invoke its onPress.
    const pressable = tree.root.findByProps({ accessibilityRole: 'button' })
    pressable.props.onPress()
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})

describe('SAVE-001 / AC-2: isCuratedSavedItem discriminator', () => {
  it('returns true for a curated-shape row (curatedRouteRef present, no routeIndex)', () => {
    expect(
      isCuratedSavedItem({
        savedRouteId: 'sr-1',
        name: 'Wasatch Ridge Loop',
        curatedRouteRef: 'k123',
      }),
    ).toBe(true)
  })

  it('returns false for a planned-shape row (routeIndex present)', () => {
    expect(
      isCuratedSavedItem({
        savedRouteId: 'sr-2',
        name: 'Planned Route',
        routeIndex: { routeFingerprint: 'fp', sampledPoints: [] },
        preview: {
          bounds: { north: 0, south: 0, east: 0, west: 0 },
          distanceMeters: 0,
          durationSeconds: 0,
        },
      }),
    ).toBe(false)
  })

  it('returns false for null/undefined', () => {
    expect(isCuratedSavedItem(null)).toBe(false)
    expect(isCuratedSavedItem(undefined)).toBe(false)
  })
})
