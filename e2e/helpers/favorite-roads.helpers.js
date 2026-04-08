/**
 * E2E Test Helpers for Favorite Roads Feature
 *
 * Provides reusable helper functions for testing favorite roads functionality
 * across multiple E2E test files.
 */

/**
 * Helper: Plan a simple route for testing
 *
 * @param {Object} params - Route planning parameters
 * @param {string} params.start - Start location description
 * @param {string} params.end - End location description
 * @param {boolean} params.includeFavorites - Whether to include favorites
 * @returns {Promise<void>}
 */
const planTestRoute = async ({
  start = 'Current Location',
  end = 'San Francisco',
  includeFavorites = false,
}) => {
  // Open manual planning mode
  await element(by.id('chat-input-manual-mode-button')).tap()

  // Wait for PlanRideSheet to appear
  await waitFor(element(by.id('plan-ride-sheet')))
    .toBeVisible()
    .withTimeout(5000)

  // Set start location if not current location
  if (start !== 'Current Location') {
    await element(by.id('current-location-input')).tap()
    await element(by.id('current-location-input')).typeText(start)
    // Wait for place selection and tap first result
    await new Promise(resolve => setTimeout(resolve, 500))
    await element(by.id('place-search-result-0')).tap()
  }

  // Set end location
  await element(by.id('destination-input')).tap()
  await element(by.id('destination-input')).typeText(end)
  // Wait for place selection and tap first result
  await new Promise(resolve => setTimeout(resolve, 500))
  await element(by.id('place-search-result-0')).tap()

  // Enable favorites toggle if requested
  if (includeFavorites) {
    const toggleExists = await element(by.id('include-favorites-toggle')).isExisting()
    if (toggleExists) {
      await element(by.id('include-favorites-toggle')).tap()
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  // Submit route planning
  await element(by.id('plan-ride-submit')).tap()

  // Wait for planning to complete
  await waitFor(element(by.text('Planning...')))
    .toBeNotVisible()
    .withTimeout(60000)

  // Wait for route results to appear
  await waitFor(element(by.id('route-card-0')))
    .toBeVisible()
    .withTimeout(10000)
}

/**
 * Helper: Create a test favorite via the UI
 *
 * @param {string} favoriteName - Name for the favorite
 * @returns {Promise<void>}
 */
const createTestFavorite = async (favoriteName) => {
  // This assumes a route is already visible and we can long-press a segment
  // In practice, you'd need to:
  // 1. Long-press on a specific route segment
  // 2. Wait for SaveFavoriteSheet to appear
  // 3. Enter the favorite name
  // 4. Tap save

  // Wait for SaveFavoriteSheet (should be triggered by long-press)
  await waitFor(element(by.id('save-favorite-sheet')))
    .toBeVisible()
    .withTimeout(5000)

  // Enter favorite name
  await element(by.id('save-favorite-name-input')).clearText()
  await element(by.id('save-favorite-name-input')).typeText(favoriteName)

  // Tap save button
  await element(by.id('save-favorite-save-button')).tap()

  // Wait for sheet to dismiss
  await waitFor(element(by.id('save-favorite-sheet')))
    .toBeNotVisible()
    .withTimeout(5000)

  // Wait for success toast
  await waitFor(element(by.text('Favorite saved')))
    .toBeVisible()
    .withTimeout(5000)

  // Wait for toast to dismiss
  await waitFor(element(by.text('Favorite saved')))
    .toBeNotVisible()
    .withTimeout(5000)
}

/**
 * Helper: Delete a favorite by name via settings
 *
 * @param {string} favoriteName - Name of the favorite to delete
 * @returns {Promise<boolean>} - True if deleted, false if not found
 */
const deleteFavoriteByName = async (favoriteName) => {
  // Navigate to settings
  await element(by.id('map-header-left-button')).tap()
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

  // Check if favorite exists
  const favoriteExists = await element(by.text(favoriteName)).isExisting()

  if (!favoriteExists) {
    // Navigate back to home
    await element(by.id('settings-back-button')).tap()
    return false
  }

  // Swipe to delete
  await element(by.text(favoriteName)).swipe('left')

  // Tap delete button
  await element(by.text('Delete')).tap()

  // Confirm deletion if dialog appears
  const deleteDialogExists = await element(by.text('Delete favorite')).isExisting()
  if (deleteDialogExists) {
    await element(by.text('Delete')).tap()
  }

  // Wait for deletion to complete
  await waitFor(element(by.text(favoriteName)))
    .toBeNotVisible()
    .withTimeout(5000)

  // Navigate back to home
  await element(by.id('settings-back-button')).tap()
  await element(by.id('settings-back-button')).tap()

  // Verify we're back on home screen
  await expect(element(by.id('home-menu-layout'))).toBeVisible()

  return true
}

/**
 * Helper: Clean up all test favorites
 *
 * Deletes all favorites that start with a test prefix
 * @param {string} testPrefix - Prefix to identify test favorites (default: "E2E Test")
 * @returns {Promise<number>} - Number of favorites deleted
 */
const cleanupTestFavorites = async (testPrefix = 'E2E Test') => {
  // Navigate to settings
  await element(by.id('map-header-left-button')).tap()
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

  // Get all visible favorites and delete test ones
  let deletedCount = 0

  try {
    // Note: Detox doesn't provide a direct way to enumerate list items
    // In practice, you'd need to use a different approach:
    // 1. Use API to query favorites directly
    // 2. Or scroll through the list and check each item

    // This is a simplified version that assumes we can find test favorites
    const hasTestFavorite = await element(by.text(new RegExp(`^${testPrefix}`))).isExisting()

    while (hasTestFavorite) {
      await element(by.text(new RegExp(`^${testPrefix}`))).swipe('left')
      await element(by.text('Delete')).tap()

      const deleteDialogExists = await element(by.text('Delete favorite')).isExisting()
      if (deleteDialogExists) {
        await element(by.text('Delete')).tap()
      }

      await new Promise(resolve => setTimeout(resolve, 500))
      deletedCount++

      // Check if there are more test favorites
      const hasMore = await element(by.text(new RegExp(`^${testPrefix}`))).isExisting()
      if (!hasMore) break
    }
  } catch (error) {
    // Ignore errors when no more test favorites exist
    // console.info('No more test favorites to delete')
  }

  // Navigate back to home
  await element(by.id('settings-back-button')).tap()
  await element(by.id('settings-back-button')).tap()

  // Verify we're back on home screen
  await expect(element(by.id('home-menu-layout'))).toBeVisible()

  return deletedCount
}

/**
 * Helper: Wait for route planning to complete
 *
 * @param {number} timeout - Maximum time to wait in ms (default: 60000)
 * @returns {Promise<void>}
 */
const waitForPlanningComplete = async (timeout = 60000) => {
  await waitFor(element(by.text('Planning...')))
    .toBeNotVisible()
    .withTimeout(timeout)
}

/**
 * Helper: Take a screenshot with a descriptive name
 *
 * @param {string} name - Screenshot name (will be prefixed with test suite name)
 * @returns {Promise<void>}
 */
const takeScreenshot = async (name) => {
  await device.takeScreenshot(name)
}

/**
 * Helper: Verify favorite badge shows correct count
 *
 * @param {number} expectedCount - Expected favorite count
 * @returns {Promise<boolean>} - True if badge matches expected count
 */
const verifyFavoriteCount = async (expectedCount) => {
  const expectedText = expectedCount === 1 ? '1 favorite' : `${expectedCount} favorites`

  try {
    await expect(element(by.text(expectedText))).toBeVisible()
    return true
  } catch (error) {
    // console.info(`Expected "${expectedText}" but it was not visible`)
    return false
  }
}

/**
 * Helper: Create a distant favorite for testing exclusion messages
 *
 * Creates a favorite far from typical test routes
 * @param {string} favoriteName - Name for the distant favorite
 * @returns {Promise<void>}
 */
const createDistantFavorite = async (favoriteName = 'Distant Test Favorite') => {
  // This would involve:
  // 1. Opening the map to a distant location
  // 2. Planning a route in that distant area
  // 3. Long-pressing a segment to save as favorite
  // 4. Returning to the original test area

  // For simplicity, this is a placeholder
  // In practice, you'd use the createTestFavorite helper
  // but first navigate the map to a different region

  // console.info('Creating distant favorite:', favoriteName)
  // Implementation would go here
}

module.exports = {
  planTestRoute,
  createTestFavorite,
  deleteFavoriteByName,
  cleanupTestFavorites,
  waitForPlanningComplete,
  takeScreenshot,
  verifyFavoriteCount,
  createDistantFavorite,
}
