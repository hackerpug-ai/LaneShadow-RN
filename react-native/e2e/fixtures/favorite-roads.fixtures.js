/**
 * Test Fixtures for Favorite Roads E2E Tests
 *
 * Provides consistent test data for favorite roads testing
 */

/**
 * Test route data for planning routes
 */
const TEST_ROUTES = {
  /**
   * Short urban route within San Francisco
   */
  shortUrban: {
    start: 'Current Location',
    end: 'Golden Gate Bridge',
    description: 'Short urban route within SF',
  },

  /**
   * Coastal route for scenic testing
   */
  coastal: {
    start: 'San Francisco',
    end: 'Santa Cruz',
    description: 'Scenic coastal route',
  },

  /**
   * Long distance route for testing exclusion
   */
  longDistance: {
    start: 'San Francisco',
    end: 'Los Angeles',
    description: 'Long distance route for exclusion testing',
  },
}

/**
 * Test favorite names with different characteristics
 */
const TEST_FAVORITES = {
  /**
   * Standard test favorite
   */
  basic: 'E2E Test Favorite',

  /**
   * Favorite with special characters
   */
  withSpecialChars: 'E2E Test - Hwy 9 (Skyline Blvd)',

  /**
   * Favorite with maximum length (100 characters)
   */
  maxLength: 'E2E Test Favorite - This is a very long name that reaches the maximum character limit of one hundred',

  /**
   * Favorite for exclusion testing (distant location)
   */
  distant: 'E2E Distant Favorite - Seattle',
}

/**
 * Test user credentials for authenticated testing
 * Note: These should be environment-specific in production
 */
const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || 'e2e-test@example.com',
  password: process.env.E2E_TEST_PASSWORD || 'test-password-123',
}

/**
 * Map coordinates for testing different regions
 */
const TEST_COORDINATES = {
  sanFrancisco: {
    latitude: 37.7749,
    longitude: -122.4194,
  },

  santaCruz: {
    latitude: 36.9741,
    longitude: -122.0308,
  },

  losAngeles: {
    latitude: 34.0522,
    longitude: -118.2437,
  },

  seattle: {
    latitude: 47.6062,
    longitude: -122.3321,
  },

  /**
   * Route segment geometry for testing
   * This is a simplified polyline for testing purposes
   */
  testSegment: {
    geometry: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
    bounds: {
      north: 37.7750,
      south: 37.7749,
      east: -122.4194,
      west: -122.4195,
    },
  },
}

/**
 * Expected UI element testIDs
 * These should match the actual testIDs in the codebase
 */
const TEST_IDS = {
  // Main screens
  homeMenuLayout: 'home-menu-layout',
  settingsScreen: 'settings-screen',
  favoriteRoadsList: 'favorite-roads-list',

  // Map elements
  homeRoutePolyline: 'home-route-polyline',
  mapHeaderOverlay: 'map-header-overlay',

  // Sheets
  saveFavoriteSheet: 'save-favorite-sheet',
  planRideSheet: 'plan-ride-sheet',

  // Form elements
  saveFavoriteNameInput: 'save-favorite-name-input',
  saveFavoriteSaveButton: 'save-favorite-save-button',
  saveFavoriteCancelButton: 'save-favorite-cancel-button',

  currentLocationInput: 'current-location-input',
  destinationInput: 'destination-input',
  includeFavoritesToggle: 'include-favorites-toggle',
  planRideSubmit: 'plan-ride-submit',

  // Route cards
  routeCard: (index) => `route-card-${index}`,

  // Chat input
  chatInput: 'chat-input',
  chatInputTextField: 'chat-input-text-field',
  chatInputSendButton: 'chat-input-send-button',
  chatInputManualModeButton: 'chat-input-manual-mode-button',

  // Buttons
  mapHeaderLeftButton: 'map-header-left-button',
  settingsBackButton: 'settings-back-button',
}

/**
 * Expected UI text strings
 * These should be internationalized in production
 */
const EXPECTED_TEXT = {
  // Buttons and labels
  planRide: 'Plan Ride',
  planning: 'Planning...',
  saveFavorite: 'Save Favorite',
  cancel: 'Cancel',
  delete: 'Delete',
  settings: 'Settings',
  favoriteRoads: 'Favorite Roads',
  includeFavoriteRoads: 'Include favorite roads',

  // Success messages
  favoriteSaved: 'Favorite saved',
  profileUpdated: 'Profile updated',

  // Favorite badge text
  favoriteCount: (count) => `${count} favorite${count > 1 ? 's' : ''}`,

  // Exclusion message
  exclusionMessage: 'Some favorites are too far',
}

/**
 * Timeout values for different operations
 */
const TIMEOUTS = {
  instant: 100,
  quick: 1000,
  normal: 5000,
  long: 10000,
  planning: 60000, // 1 minute for route planning
  extended: 120000, // 2 minutes for full test flow
}

/**
 * Screenshot names for different test steps
 */
const SCREENSHOTS = {
  testSetup: '01-test-setup',
  homeLoaded: '02-home-loaded',
  mapWithRoute: '03-map-with-route',
  beforeLongPress: '04-before-long-press',
  saveFavoriteSheetVisible: '05-save-favorite-sheet-visible',
  favoriteNameEntered: '06-favorite-name-entered',
  successToast: '07-success-toast',
  planRideSheetOpen: '08-plan-ride-sheet-open',
  toggleEnabled: '09-toggle-enabled',
  routesGenerated: '10-routes-generated',
  favoriteBadgeVisible: '11-favorite-badge-visible',
  exclusionMessage: '12-exclusion-message',
  favoriteDeleted: '13-favorite-deleted',
  backToHome: '14-back-to-home',
  testCleanup: '15-test-cleanup',
}

/**
 * Test scenarios for different user flows
 */
const TEST_SCENARIOS = {
  /**
   * Basic flow: Save favorite → Plan with favorites → Verify badge
   */
  basicFlow: {
    name: 'Basic Flow',
    steps: [
      'Plan a route',
      'Long-press segment to save favorite',
      'Enter favorite name and save',
      'Plan new route with favorites enabled',
      'Verify favorite badge appears',
    ],
  },

  /**
   * Exclusion flow: Save distant favorite → Plan route → Verify exclusion message
   */
  exclusionFlow: {
    name: 'Exclusion Flow',
    steps: [
      'Create favorite in distant location',
      'Plan route that does not pass near favorite',
      'Enable favorites toggle',
      'Verify exclusion message appears',
    ],
  },

  /**
   * Multiple favorites flow: Save multiple favorites → Plan → Verify count
   */
  multipleFavoritesFlow: {
    name: 'Multiple Favorites Flow',
    steps: [
      'Save multiple favorites on same route',
      'Plan new route with favorites enabled',
      'Verify badge shows correct count (N favorites)',
    ],
  },

  /**
   * Toggle off flow: Save favorite → Plan with toggle OFF → Verify no badge
   */
  toggleOffFlow: {
    name: 'Toggle Off Flow',
    steps: [
      'Save favorite',
      'Plan route with favorites toggle OFF',
      'Verify no favorite badge appears',
    ],
  },
}

module.exports = {
  TEST_ROUTES,
  TEST_FAVORITES,
  TEST_USER,
  TEST_COORDINATES,
  TEST_IDS,
  EXPECTED_TEXT,
  TIMEOUTS,
  SCREENSHOTS,
  TEST_SCENARIOS,
}
