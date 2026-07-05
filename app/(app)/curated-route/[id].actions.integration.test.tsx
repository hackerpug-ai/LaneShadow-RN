/**
 * DESIGN-004 integration tests: Save + Ride It actions wiring.
 *
 * Renders the REAL `app/(app)/curated-route/[id].tsx` screen. Only the
 * boundary is mocked (Convex useQuery/useAction, expo-router, native map,
 * theme, safe-area, the SAVE-001 hooks, the SAVE-002 deeplink). The screen's
 * status state machine, onPress handlers, and in-place rendering logic run
 * for real.
 *
 * AC coverage (jsdom-testable logic; full-render against live Convex + real
 * simulator is PHASE 3.5 via .maestro/uc-dtl-04-*.yaml):
 *   AC-1 (PRIMARY)  tapSaveShowsLoadingThenSavedInPlaceNoNavigation
 *       → ActivityIndicator appears during pending; 'Saved' + success Badge
 *         after resolve; router.push/replace NEVER called (same route path).
 *   AC-2            tapRideItCallsOpenRouteInMapsWithCentroidAndName
 *       → openRouteInMaps invoked with {lat, lng, name} from the detail.
 *   AC-3            saveFailureRestoresTappableSaveLabel
 *       → save() resolving to null (failure) restores 'Save' label (not
 *         stuck loading).
 *
 * Service: vitest (jsdom). The live-Convex + simulator variant is PHASE 3.5.
 */

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MOCK_SEMANTIC } from '../../../test-helpers/mock-semantic'

// ---------------------------------------------------------------------------
// Boundary spies (hoisted so the mock factories can reference them).
// ---------------------------------------------------------------------------

const mockUseQuery = vi.fn()
const mockGetCurrentWeather = vi.fn()
const mockRouterPush = vi.fn()
const mockRouterReplace = vi.fn()
const mockRouterBack = vi.fn()

// SAVE-001 hook spies — configurable per test.
const mockSave = vi.fn()
const mockIsSaved = vi.fn(() => ({ isSaved: false }))

// SAVE-002 deeplink spy.
const mockOpenRouteInMaps = vi.fn().mockResolvedValue('https://maps.apple.com/?ll=40.6,-111.6')

vi.mock('convex/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useAction: () => mockGetCurrentWeather,
  // useSaveCuratedRoute calls useMutation internally — but we mock the HOOK
  // module itself below, so useMutation is never reached. Included for safety
  // in case the mock is bypassed during a dynamic import race.
  useMutation: () => vi.fn(),
}))

vi.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'wasatch-ridge-traverse' }),
  useRouter: () => ({
    push: mockRouterPush,
    back: mockRouterBack,
    replace: mockRouterReplace,
  }),
}))

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: (p: { children: React.ReactNode }) => p.children,
}))

vi.mock('../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: MOCK_SEMANTIC }),
}))

vi.mock('../../../contexts/theme-preference', () => ({
  useThemePreference: () => ({ isDark: false, mode: 'light' }),
}))

// MapboxMapView — mock away the native map (crashes under jsdom).
vi.mock('../../../components/map', () => ({
  MapboxMapView: (props: { children?: React.ReactNode }) => props?.children ?? null,
}))

vi.mock('../../../components/map/map-header-overlay', () => ({
  MapHeaderOverlay: () => null,
}))

// Button — pressable mock that renders children directly (the real Button
// uses a Pressable render-prop `{({pressed}) => content(pressed)}` which
// jsdom's RN mock does NOT invoke, leaving children unrendered). This mock
// wraps string children in a host Text (so getByText works) and renders JSX
// children as-is (so ActivityIndicator + Badge are reachable by testID).
vi.mock('../../../components/ui/button', () => {
  const React = require('react')
  const { Pressable } = require('react-native')
  const Button = (props: {
    children?: React.ReactNode
    testID?: string
    onPress?: () => void
    disabled?: boolean
  }) =>
    React.createElement(
      Pressable,
      {
        testID: props.testID,
        onPress: props.onPress,
        disabled: props.disabled,
        accessibilityRole: 'button',
      },
      typeof props.children === 'string'
        ? React.createElement('Text', null, props.children)
        : props.children,
    )
  return { Button }
})

// Badge — leaf UI primitive; mock as a Text so children are queryable.
vi.mock('../../../components/ui/badge', () => {
  const React = require('react')
  const Badge = (props: { children?: React.ReactNode; testID?: string }) =>
    React.createElement('Text', { testID: props.testID }, props.children)
  return { Badge }
})

// SAVE-001 hooks — mocked so the status state machine is the system under test.
vi.mock('../../../hooks/use-save-curated-route', () => ({
  useSaveCuratedRoute: () => ({ save: mockSave, isLoading: false }),
  useIsCuratedRouteSaved: () => mockIsSaved(),
}))

// SAVE-002 deeplink — mocked so we assert call args (the URL construction +
// Linking.openURL LOGIC is tested in lib/maps-deeplink.test.ts).
vi.mock('../../../lib/maps-deeplink', () => ({
  openRouteInMaps: mockOpenRouteInMaps,
}))

// ---------------------------------------------------------------------------
// Fixtures — match getCuratedRouteDetail return shape (DATA-006).
// ---------------------------------------------------------------------------

const WEATHER_OK = {
  tempF: 64,
  condition: 'CLEAR' as const,
  severity: 'normal' as const,
  dayOfWeek: 'SATURDAY',
}

const buildDetail = (overrides: Record<string, unknown> = {}) => ({
  routeId: 'wasatch-ridge-traverse',
  name: 'Wasatch Ridge Traverse',
  state: 'UT',
  primaryArchetype: 'scenic',
  centroidLat: 40.6,
  centroidLng: -111.6,
  compositeScore: 0.81,
  curvatureScore: 0.8,
  scenicScore: 0.9,
  technicalScore: 0.7,
  trafficScore: 0.3,
  remotenessScore: 0.6,
  lengthMiles: 47,
  summary: 'A high-alpine traverse along the Wasatch Crest.',
  routePolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
  bounds: { north: 40.8, south: 40.4, east: -111.4, west: -111.8 },
  headline: 'A high-alpine traverse along the Wasatch Crest.',
  ...overrides,
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DESIGN-004: Save + Ride It actions wiring', () => {
  let CuratedRouteDetailScreen: React.ComponentType<unknown>

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  beforeEach(async () => {
    mockUseQuery.mockReset()
    mockGetCurrentWeather.mockReset()
    mockSave.mockReset()
    mockIsSaved.mockReset()
    mockOpenRouteInMaps.mockReset()
    mockRouterPush.mockClear()
    mockRouterReplace.mockClear()
    mockRouterBack.mockClear()

    // Defaults: detail loaded + weather succeeds + unsaved.
    mockGetCurrentWeather.mockResolvedValue(WEATHER_OK)
    mockUseQuery.mockReturnValue(buildDetail())
    mockIsSaved.mockReturnValue({ isSaved: false })
    mockOpenRouteInMaps.mockResolvedValue('https://maps.apple.com/?ll=40.6,-111.6')

    // Dynamic import so hoisted vi.mock() registrations apply first.
    const mod = await import('./[id]')
    CuratedRouteDetailScreen = mod.default
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-1 (PRIMARY): tap Save → ActivityIndicator during pending →
  //                  'Saved' + checkmark + success Badge IN PLACE, no nav.
  // ─────────────────────────────────────────────────────────────────────────
  it('tapSaveShowsLoadingThenSavedInPlaceNoNavigation', async () => {
    // Deferred save: we control WHEN it resolves so we can observe loading.
    let releaseSave: (val: unknown) => void = () => {}
    const pendingSave = new Promise((resolve) => {
      releaseSave = resolve
    })
    mockSave.mockReturnValue(pendingSave)

    const { getByTestId, queryByTestId, getByText } = render(
      createElement(CuratedRouteDetailScreen),
    )

    // GIVEN: the Save button renders the literal 'Save' label (idle).
    expect(getByText('Save')).toBeTruthy()

    // WHEN: the user taps Save.
    fireEvent.press(getByTestId('save-curated-button'))

    // THEN: ActivityIndicator appears during pending (loading state).
    // Use waitFor because setState is batched inside the async handler.
    await waitFor(() => {
      expect(getByTestId('save-curated-loading')).toBeTruthy()
    })

    // AND: the idle 'Save' label is gone during loading (replaced by spinner).
    expect(queryByTestId('save-curated-button')?.props.disabled).toBe(true)

    // WHEN: the save mutation resolves.
    await waitFor(() => {
      releaseSave({ savedRouteId: 'sr-new-1' })
    })

    // THEN: the button label flips to 'Saved' with a success Badge IN PLACE.
    await waitFor(() => {
      expect(getByText('Saved')).toBeTruthy()
      expect(getByTestId('save-curated-saved-badge')).toBeTruthy()
    })

    // AND: the user is NOT navigated away — router.push/replace never called.
    expect(mockRouterPush).not.toHaveBeenCalled()
    expect(mockRouterReplace).not.toHaveBeenCalled()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-2: tap Ride It → openRouteInMaps called with centroid + name
  // ─────────────────────────────────────────────────────────────────────────
  it('tapRideItCallsOpenRouteInMapsWithCentroidAndName', async () => {
    const { getByTestId } = render(createElement(CuratedRouteDetailScreen))

    // WHEN: the user taps Ride It.
    fireEvent.press(getByTestId('ride-it-button'))

    // THEN: openRouteInMaps is called with the detail's centroid + name.
    await waitFor(() => {
      expect(mockOpenRouteInMaps).toHaveBeenCalledTimes(1)
    })

    const callArgs = mockOpenRouteInMaps.mock.calls[0]?.[0] as Record<string, unknown>
    expect(callArgs.lat).toBe(40.6)
    expect(callArgs.lng).toBe(-111.6)
    expect(callArgs.name).toBe('Wasatch Ridge Traverse')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-3: Save mutation fails (returns null) → button restores 'Save'
  // ─────────────────────────────────────────────────────────────────────────
  it('saveFailureRestoresTappableSaveLabel', async () => {
    // save() resolves to null — the hook catches the ConvexError and returns
    // null on failure. The screen must restore the tappable 'Save' label.
    mockSave.mockResolvedValue(null)

    const { getByTestId, queryByTestId, getByText } = render(
      createElement(CuratedRouteDetailScreen),
    )

    // GIVEN: idle 'Save' label is present.
    expect(getByText('Save')).toBeTruthy()

    // WHEN: the user taps Save.
    fireEvent.press(getByTestId('save-curated-button'))

    // THEN: after the rejection resolves, the button restores 'Save' (not
    // stuck loading, not 'Saved').
    await waitFor(() => {
      expect(getByText('Save')).toBeTruthy()
    })

    // AND: the loading indicator is gone.
    expect(queryByTestId('save-curated-loading')).toBeNull()

    // AND: the saved Badge is NOT shown (no false-positive).
    expect(queryByTestId('save-curated-saved-badge')).toBeNull()

    // AND: the button is tappable again (not disabled).
    expect(getByTestId('save-curated-button').props.disabled).toBeFalsy()
  })
})
