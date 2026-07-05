import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * SAVE-002 — openRouteInMaps util.
 *
 * Contract: REQUIREMENT-CONTRACT v1 (.spec/.../SAVE-002-*.md).
 *
 * These tests cover the URL-construction + Platform branching + null-guard
 * LOGIC, which is fully jsdom-testable by mocking `expo-linking`'s `Linking`
 * and `react-native`'s `Platform.OS`.
 *
 * NOTE: The on-device real-Linking integration (does Apple Maps actually
 * OPEN on a real iOS simulator) is PHASE 3.5 — out of scope for this logic
 * tier. The contract names the file `.e2e.test.ts`; we use `.test.ts` to
 * reflect the actual jsdom tier honestly. AC-1..4 logic is fully covered.
 */

vi.mock('expo-linking', () => ({
  canOpenURL: vi.fn<(url: string) => Promise<boolean>>(),
  openURL: vi.fn<(url: string) => Promise<true>>(),
}))

// `react-native` is redirected by vitest.config.ts to __mocks__/react-native.ts,
// which exports a mutable `Platform`. We import it and override `.OS` per test.

describe('openRouteInMaps — RED phase (AC-1..4)', () => {
  let openRouteInMaps: typeof import('./maps-deeplink').openRouteInMaps
  let Linking: typeof import('expo-linking')
  let Platform: typeof import('react-native').Platform

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    // Re-import after reset so the SUT picks up the (re-seeded) mock state.
    const rn = await import('react-native')
    Platform = rn.Platform
    // Default to iOS; individual tests override as needed.
    Platform.OS = 'ios'
    Linking = await import('expo-linking')
    const mod = await import('./maps-deeplink')
    openRouteInMaps = mod.openRouteInMaps
  })

  afterEach(() => {
    // Restore default so other test files see 'ios'.
    Platform.OS = 'ios'
  })

  // ──────────────────────────────────────────────────────────────────────────
  // AC-1 (PRIMARY): iOS opens Apple Maps with centroid + name
  // ──────────────────────────────────────────────────────────────────────────
  it('AC-1: on iOS builds an Apple Maps URL (maps.apple.com, ll, q) and opens it once', async () => {
    Platform.OS = 'ios'
    vi.mocked(Linking.canOpenURL).mockResolvedValue(true)
    vi.mocked(Linking.openURL).mockResolvedValue(true)

    const result = await openRouteInMaps({
      lat: 40.6,
      lng: -111.6,
      name: 'Wasatch Ridge Loop',
    })

    expect(Linking.canOpenURL).toHaveBeenCalledTimes(1)
    expect(Linking.openURL).toHaveBeenCalledTimes(1)
    const opened = vi.mocked(Linking.openURL).mock.calls[0]?.[0] ?? ''
    expect(opened).toContain('maps.apple.com')
    expect(opened).toContain('ll=40.6,-111.6')
    expect(opened).toContain('q=Wasatch%20Ridge%20Loop')
    expect(result).toBe(opened)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // AC-2: Android opens Google Maps
  // ──────────────────────────────────────────────────────────────────────────
  it('AC-2: on Android builds a Google Maps URL (google.navigation OR geo) and opens it once', async () => {
    Platform.OS = 'android'
    vi.mocked(Linking.canOpenURL).mockResolvedValue(true)
    vi.mocked(Linking.openURL).mockResolvedValue(true)

    const result = await openRouteInMaps({
      lat: 40.6,
      lng: -111.6,
      name: 'Wasatch Ridge Loop',
    })

    expect(Linking.openURL).toHaveBeenCalledTimes(1)
    const opened = vi.mocked(Linking.openURL).mock.calls[0]?.[0] ?? ''
    const isGoogleNav = opened.startsWith('google.navigation:q=')
    const isGeo = opened.startsWith('geo:')
    expect(isGoogleNav || isGeo).toBe(true)
    expect(opened).toContain('40.6')
    expect(opened).toContain('-111.6')
    expect(opened).not.toContain('maps.apple.com')
    expect(result).toBe(opened)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // AC-3: native scheme unavailable → web fallback (maps.google.com)
  // ──────────────────────────────────────────────────────────────────────────
  it('AC-3: when canOpenURL is false, falls back to maps.google.com web URL with the centroid', async () => {
    Platform.OS = 'ios'
    vi.mocked(Linking.canOpenURL).mockResolvedValue(false)
    vi.mocked(Linking.openURL).mockResolvedValue(true)

    const result = await openRouteInMaps({ lat: 40.6, lng: -111.6, name: 'X' })

    expect(Linking.openURL).toHaveBeenCalledTimes(1)
    const opened = vi.mocked(Linking.openURL).mock.calls[0]?.[0] ?? ''
    expect(opened).toContain('maps.google.com')
    expect(opened).toContain('q=40.6,-111.6')
    // Must NOT have opened the native-only scheme.
    expect(opened).not.toContain('maps.apple.com')
    expect(result).toBe(opened)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // AC-4: null centroid → graceful no-op (no openURL, no crash, return null)
  // ──────────────────────────────────────────────────────────────────────────
  it('AC-4: null centroid is a graceful no-op — openURL not called, returns null, no throw', async () => {
    Platform.OS = 'ios'
    vi.mocked(Linking.canOpenURL).mockResolvedValue(true)
    vi.mocked(Linking.openURL).mockResolvedValue(true)

    const result = await openRouteInMaps({ lat: null, lng: null, name: 'X' })

    expect(Linking.canOpenURL).not.toHaveBeenCalled()
    expect(Linking.openURL).not.toHaveBeenCalled()
    expect(result).toBeNull()
  })
})
