/**
 * E2E Test for Favorite Roads Full Flow (US-052)
 *
 * Purpose: Verify complete user journey for favorite roads feature:
 * 1. Save a road segment as a favorite
 * 2. Plan a route with favorites included
 * 3. Verify favorite feedback displays correctly
 *
 * Acceptance Criteria:
 * - AC1: E2E test suite exists and runs without errors
 * - AC2: Test starts with map displaying active route
 * - AC3: Long-press on segment highlights it and shows SaveFavoriteSheet
 * - AC4: SaveFavoriteSheet accepts name, saves, dismisses, shows toast
 * - AC5: PlanRideSheet shows "Include favorite roads" toggle
 * - AC6: Toggle switches to ON when enabled
 * - AC7: Routes generate with favorite count badges
 * - AC8: Badge shows correct favorite count
 * - AC9: Exclusion message appears when favorites are too far
 * - AC10: Test cleanup removes all test data
 *
 * Test Framework: Detox with Jest
 * Test Database: Real Convex backend (test deployment)
 */

const {
  createDistantFavorite,
  deleteFavoriteByName,
} = require('./helpers/favorite-roads.helpers')

describe('Favorite Roads Full Flow (US-052)', () => {
  const TEST_FAVORITE_NAME = 'E2E Test Favorite'
  const TEST_TIMEOUT = 120000 // 2 minutes for full flow test

  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { location: 'whenInUse' },
    })

    // Wait for app to fully load and settle
    await waitFor(element(by.id('home-menu-layout')))
      .toBeVisible()
      .withTimeout(30000)
  }, TEST_TIMEOUT)

  // Helper function to capture screenshots with descriptive names
  const takeScreenshot = async (name) => {
    await device.takeScreenshot(`favorite-roads-${name}`)
  }

  // Helper function to wait for planning to complete
  const waitForPlanningComplete = async (timeout = 60000) => {
    await waitFor(element(by.text('Planning...')))
      .toBeNotVisible()
      .withTimeout(timeout)
  }

  /**
   * AC1: E2E test suite exists and runs without errors
   * This test verifies the basic test infrastructure is working
   */
  it('should satisfy AC1: Test suite runs without errors', async () => {
    // Verify home screen is loaded
    await expect(element(by.id('home-menu-layout'))).toBeVisible()
    await takeScreenshot('01-home-loaded')
  })

  /**
   * AC2: Map displays with active route
   * Verifies the map is visible and ready for interaction
   */
  it('should satisfy AC2: Map displays with active route', async () => {
    // Wait for map to be ready
    await waitFor(element(by.id('home-route-polyline')))
      .toExist()
      .withTimeout(10000)

    // Verify map controls are visible (indicates map is loaded)
    await expect(element(by.id('map-header-overlay'))).toBeVisible()
    await takeScreenshot('02-map-with-route')
  })

  /**
   * AC3: Long-press segment highlights it and shows SaveFavoriteSheet
   * Note: This test assumes a route is already displayed on the map
   * In a real scenario, you'd need to plan a route first
   */
  it('should satisfy AC3: Long-press segment shows SaveFavoriteSheet', async () => {
    // First, ensure we have a route to interact with
    // If no route is visible, we'd need to plan one first
    const routeExists = await element(by.id('home-route-polyline')).isExisting()

    if (!routeExists) {
      // Plan a simple route for testing
      await element(by.id('chat-input')).tap()
      await element(by.id('chat-input-text-field')).typeText('Plan a ride to the coast')
      await element(by.id('chat-input-send-button')).tap()

      // Wait for planning to complete
      await waitForPlanningComplete()
    }

    // Wait for route polyline to be visible
    await waitFor(element(by.id('home-route-polyline')))
      .toBeVisible()
      .withTimeout(10000)

    // Take screenshot before long-press
    await takeScreenshot('03-before-long-press')

    // Perform long-press on the route polyline
    // The route polyline uses LongPressGestureHandler from react-native-gesture-handler
    // Detox's longPress() works on the testID element
    await element(by.id('route-polyline')).longPress()

    // Wait for SaveFavoriteSheet to appear after long-press
    await waitFor(element(by.id('save-favorite-sheet')))
      .toBeVisible()
      .withTimeout(5000)

    // Verify SaveFavoriteSheet is visible
    await expect(element(by.id('save-favorite-sheet'))).toBeVisible()
    await takeScreenshot('04-save-favorite-sheet-visible')

    // Verify the name input is visible and focused
    await expect(element(by.id('save-favorite-name-input'))).toBeVisible()
  })

  /**
   * AC4: SaveFavoriteSheet accepts name, saves, dismisses, shows toast
   */
  it('should satisfy AC4: SaveFavoriteSheet saves favorite successfully', async () => {
    // This test assumes SaveFavoriteSheet is already open from AC3
    // In a real flow, you'd trigger it via long-press

    // For testing purposes, we'll verify the sheet can be interacted with
    // when it appears (simulated here - would be triggered by AC3 in real flow)

    // Type favorite name
    await waitFor(element(by.id('save-favorite-name-input')))
      .toBeVisible()
      .withTimeout(5000)

    await element(by.id('save-favorite-name-input')).typeText(TEST_FAVORITE_NAME)
    await takeScreenshot('05-favorite-name-entered')

    // Tap save button
    await element(by.id('save-favorite-save-button')).tap()

    // Wait for sheet to dismiss
    await waitFor(element(by.id('save-favorite-sheet')))
      .toBeNotVisible()
      .withTimeout(5000)

    // Verify success toast appears
    await waitFor(element(by.text('Favorite saved')))
      .toBeVisible()
      .withTimeout(5000)

    await takeScreenshot('06-success-toast')

    // Wait for toast to dismiss
    await waitFor(element(by.text('Favorite saved')))
      .toBeNotVisible()
      .withTimeout(5000)
  })

  /**
   * AC5: PlanRideSheet shows "Include favorite roads" toggle
   */
  it('should satisfy AC5: PlanRideSheet shows favorites toggle', async () => {
    // Open PlanRideSheet (via manual mode button or chat input)
    await element(by.id('chat-input-manual-mode-button')).tap()

    // Wait for PlanRideSheet to appear
    await waitFor(element(by.id('plan-ride-sheet')))
      .toBeVisible()
      .withTimeout(5000)

    // Verify "Include favorite roads" toggle is visible
    // Note: The actual testID would need to be added to PreferencesRow
    await expect(element(by.text('Include favorite roads'))).toBeVisible()
    await takeScreenshot('07-plan-ride-sheet-with-toggle')
  })

  /**
   * AC6: Toggle switches to ON when enabled
   */
  it('should satisfy AC6: Toggle switches to ON when enabled', async () => {
    // Verify toggle is initially OFF (or check its current state)
    // Note: Detox can check switch state with toHaveToggleValue()

    // Tap the toggle to enable favorites
    await element(by.id('include-favorites-toggle')).tap()

    // Wait a moment for the toggle to animate
    await new Promise(resolve => setTimeout(resolve, 500))

    // Verify toggle is now ON
    await expect(element(by.id('include-favorites-toggle'))).toHaveToggleValue(true)
    await takeScreenshot('08-toggle-enabled')
  })

  /**
   * AC7: Routes generate with favorite count badges
   */
  it('should satisfy AC7: Routes generate with favorite count badges', async () => {
    // Set start and end points if not already set
    // This would involve tapping the map or using location inputs

    // Tap the "Plan Ride" button
    await element(by.id('plan-ride-submit')).tap()

    // Wait for planning to complete
    await waitForPlanningComplete()

    // Wait for route options to appear
    await waitFor(element(by.id('route-card-0')))
      .toBeVisible()
      .withTimeout(10000)

    // Verify at least one route has a favorite badge
    // The badge should show the count of favorites included
    await expect(element(by.text(/favorite/))).toBeVisible()
    await takeScreenshot('09-routes-with-favorite-badges')
  })

  /**
   * AC8: Badge shows correct favorite count
   */
  it('should satisfy AC8: Badge shows correct favorite count', async () => {
    // We saved 1 favorite in AC4, so we should see "1 favorite"
    await expect(element(by.text('1 favorite'))).toBeVisible()

    // If we had saved multiple favorites, we'd see "N favorites"
    // await expect(element(by.text('2 favorites'))).toBeVisible()

    await takeScreenshot('10-favorite-count-correct')
  })

  /**
   * AC9: Exclusion message appears when favorites are too far
   *
   * This test verifies that when a favorite is >50km from the planned route,
   * the FavoriteExclusionAlert appears with the favorite's name.
   */
  it('should satisfy AC9: Exclusion message appears for distant favorites', async () => {
    const DISTANT_FAVORITE_NAME = 'Distant E2E Test Favorite'

    // Step 1: Create a distant favorite (>50km from typical test area)
    // This helper plans a route to a distant location (e.g., SF to LA),
    // long-presses a segment, and saves it as a favorite
    await createDistantFavorite(DISTANT_FAVORITE_NAME)

    // Step 2: Plan a local route that won't include the distant favorite
    // Open manual planning mode
    await element(by.id('chat-input-manual-mode-button')).tap()

    await waitFor(element(by.id('plan-ride-sheet')))
      .toBeVisible()
      .withTimeout(5000)

    // Enable favorites toggle
    const toggleExists = await element(by.id('include-favorites-toggle')).isExisting()
    if (toggleExists) {
      await element(by.id('include-favorites-toggle')).tap()
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Plan a short local route (San Francisco to Oakland - ~10km)
    // This should NOT include the LA favorite (>50km away)
    await element(by.id('destination-input')).tap()
    await element(by.id('destination-input')).typeText('Oakland, CA')
    await new Promise(resolve => setTimeout(resolve, 500))

    // Wait for place search results and select first
    const placeResultExists = await element(by.id('place-search-result-0')).isExisting()
    if (placeResultExists) {
      await element(by.id('place-search-result-0')).tap()
    }

    // Submit route planning
    await element(by.id('plan-ride-submit')).tap()

    // Wait for planning to complete
    await waitForPlanningComplete()

    // Step 3: Verify the exclusion alert appears
    // The alert should show because the LA favorite is >50km from SF-Oakland route
    await waitFor(element(by.id('favorite-exclusion-alert')))
      .toBeVisible()
      .withTimeout(10000)

    // Verify the exclusion alert is visible
    await expect(element(by.id('favorite-exclusion-alert'))).toBeVisible()

    // Verify the alert text mentions favorites being too far
    await expect(element(by.text(/Some favorites couldn't be included/))).toBeVisible()
    await expect(element(by.text(/too far from your route/))).toBeVisible()

    // Verify the distant favorite's name is mentioned in the alert
    await expect(element(by.text(new RegExp(DISTANT_FAVORITE_NAME)))).toBeVisible()

    await takeScreenshot('11-exclusion-message-with-distant-favorite')

    // Dismiss the alert
    await element(by.id('favorite-exclusion-alert-dismiss')).tap()

    // Verify alert is dismissed
    await waitFor(element(by.id('favorite-exclusion-alert')))
      .toBeNotVisible()
      .withTimeout(3000)

    // Step 4: Clean up the distant favorite
    await deleteFavoriteByName(DISTANT_FAVORITE_NAME)
  })

  /**
   * AC10: Test cleanup removes all test data
   */
  it('should satisfy AC10: Test cleanup removes all test data', async () => {
    // Navigate to settings to manage favorites
    await element(by.id('map-header-left-button')).tap() // Open menu
    await element(by.text('Settings')).tap()

    // Wait for settings screen
    await waitFor(element(by.id('settings-screen')))
      .toBeVisible()
      .withTimeout(5000)

    // Navigate to favorite roads section
    await element(by.text('Favorite Roads')).tap()

    // Wait for favorites list
    await waitFor(element(by.id('favorite-roads-list')))
      .toBeVisible()
      .withTimeout(5000)

    // Find and delete our test favorite
    // This would involve swiping or tapping a delete button
    const favoriteExists = await element(by.text(TEST_FAVORITE_NAME)).isExisting()

    if (favoriteExists) {
      // Swipe to delete or tap delete button
      await element(by.text(TEST_FAVORITE_NAME)).swipe('left')
      await element(by.text('Delete')).tap()

      // Confirm deletion if there's a dialog
      const deleteDialogExists = await element(by.text('Delete favorite')).isExisting()
      if (deleteDialogExists) {
        await element(by.text('Delete')).tap()
      }

      // Wait for deletion to complete
      await waitFor(element(by.text(TEST_FAVORITE_NAME)))
        .toBeNotVisible()
        .withTimeout(5000)
    }

    await takeScreenshot('12-favorite-deleted')

    // Navigate back to home
    await element(by.id('settings-back-button')).tap()

    // Verify we're back on the home map
    await expect(element(by.id('home-menu-layout'))).toBeVisible()
    await takeScreenshot('13-back-to-home')
  })
})
