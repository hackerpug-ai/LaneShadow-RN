/**
 * Baseline E2E Test - App Launch
 *
 * Purpose: Verify that the LaneShadow app launches successfully
 * This is the simplest possible test to validate Detox setup
 *
 * Expected behavior:
 * - App launches without crashing
 * - App shows sign-in screen (default unauthenticated state)
 * - "LaneShadow" title is visible
 * - Sign-in button is visible and tappable
 */

describe('App Launch (Baseline)', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
    })
  })

  // Note: device.reloadReactNative() is not supported with Expo's AppDelegate
  // Each test will use the same app instance launched in beforeAll

  it('should display the sign-in screen', async () => {
    // Wait for the sign-in screen container to be visible
    // Increased timeout for initial app load and bundle download
    await waitFor(element(by.id('sign-in-screen')))
      .toBeVisible()
      .withTimeout(30000)
  })

  it('should display the LaneShadow title', async () => {
    // Check that the app title is visible
    await expect(element(by.text('LaneShadow'))).toBeVisible()
  })

  it('should display the sign-in button', async () => {
    // Check that the sign-in button is present
    await expect(element(by.id('sign-in-button'))).toBeVisible()
  })

  it('should display subtitle text', async () => {
    // Check that descriptive text is visible
    await expect(element(by.text('Early childhood development platform'))).toBeVisible()
  })
})
