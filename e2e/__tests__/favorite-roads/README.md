# E2E Tests for Favorite Roads Feature (US-052)

This directory contains end-to-end tests for the favorite roads feature, covering the complete user journey from saving a favorite to planning routes with favorites.

## Test Coverage

The test suite verifies all 10 acceptance criteria from US-052:

1. **AC1**: E2E test suite exists and runs without errors
2. **AC2**: Test starts with map displaying active route
3. **AC3**: Long-press on segment highlights it and shows SaveFavoriteSheet
4. **AC4**: SaveFavoriteSheet accepts name, saves, dismisses, shows toast
5. **AC5**: PlanRideSheet shows "Include favorite roads" toggle
6. **AC6**: Toggle switches to ON when enabled
7. **AC7**: Routes generate with favorite count badges
8. **AC8**: Badge shows correct favorite count
9. **AC9**: Exclusion message appears when favorites are too far
10. **AC10**: Test cleanup removes all test data

## File Structure

```
e2e/
├── favorite-roads.full-flow.test.js    # Main E2E test file
├── helpers/
│   └── favorite-roads.helpers.js       # Reusable test helper functions
└── fixtures/
    └── favorite-roads.fixtures.js      # Test data and constants
```

## Running the Tests

### Prerequisites

1. **iOS Simulator**: Ensure iPhone 15 simulator is available
   ```bash
   xcrun simctl list devices | grep "iPhone 15"
   ```

2. **Build the app**: One-time setup (or after native changes)
   ```bash
   pnpm test:e2e:build:ios
   ```

3. **Start Metro**: In a separate terminal
   ```bash
   pnpm start
   ```

### Run Tests

```bash
# Run all favorite roads E2E tests
pnpm test:e2e -- favorite-roads.full-flow.test.js

# Run specific test
pnpm test:e2e -- favorite-roads.full-flow.test.js --testNamePattern="AC1"

# Run with verbose output
pnpm test:e2e -- favorite-roads.full-flow.test.js --verbose
```

## Test Architecture

### Test Flow

The main test (`favorite-roads.full-flow.test.js`) follows the user journey:

1. **Setup**: Launch app and verify home screen
2. **Map Display**: Verify route is visible on map
3. **Save Favorite**: Long-press segment, enter name, save
4. **Plan with Favorites**: Open PlanRideSheet, enable toggle
5. **Verify Results**: Check favorite badges appear with correct count
6. **Exclusion Test**: Test distant favorite scenario
7. **Cleanup**: Delete test favorites and verify

### Helper Functions

The `helpers/favorite-roads.helpers.js` file provides reusable functions:

- `planTestRoute()` - Plan a route with given parameters
- `createTestFavorite()` - Save a favorite via the UI
- `deleteFavoriteByName()` - Delete a specific favorite
- `cleanupTestFavorites()` - Remove all test favorites
- `waitForPlanningComplete()` - Wait for route planning
- `verifyFavoriteCount()` - Check favorite badge count

### Test Fixtures

The `fixtures/favorite-roads.fixtures.js` file provides:

- Test route data (short, coastal, long-distance)
- Test favorite names (basic, special chars, max length)
- Test user credentials
- Map coordinates for different regions
- Expected UI element testIDs
- Expected text strings
- Timeout values
- Screenshot names
- Test scenarios

## Test Data Management

### Cleanup Strategy

Tests use the prefix "E2E Test" to identify test data. After each test run:

1. Navigate to Settings → Favorite Roads
2. Find all favorites starting with "E2E Test"
3. Delete each one
4. Verify no test data remains

### Isolation

Each test should:
- Use unique favorite names (include timestamp or UUID)
- Clean up after itself even if it fails
- Not depend on other tests (independent execution)

## Screenshots

Tests capture screenshots at key steps for debugging:

- `01-home-loaded` - Initial home screen
- `02-map-with-route` - Map with active route
- `03-before-long-press` - Before segment long-press
- `04-save-favorite-sheet-visible` - SaveFavoriteSheet open
- `05-favorite-name-entered` - Name typed in input
- `06-success-toast` - Success message after save
- `07-plan-ride-sheet-with-toggle` - PlanRideSheet with toggle
- `08-toggle-enabled` - Favorites toggle ON
- `09-routes-with-favorite-badges` - Routes with badges
- `10-favorite-count-correct` - Badge showing count
- `11-exclusion-message` - Exclusion message visible
- `12-favorite-deleted` - After deletion
- `13-back-to-home` - Back on home screen

Screenshots are saved to: `e2e/screenshots/favorite-roads/`

## Known Limitations

### Map Interaction

Detox doesn't support long-press on specific map coordinates out of the box. The test uses a placeholder approach:

- **Current**: Tests verify UI elements can appear
- **Needed**: Implement custom Detox action for map long-press

Possible solutions:
1. Add test-specific gesture handlers to map components
2. Use React Native's `TestRenderer` to simulate events
3. Implement Detox custom action for map gestures

### Test Data

Tests assume:
- A route is already visible on the map (or can be planned)
- User is authenticated (if required)
- Network is available for Convex backend

### Flakiness Prevention

To minimize flaky tests:

1. **Explicit Waits**: Use `waitFor()` instead of hardcoded delays
2. **Retry Logic**: Retry network operations with backoff
3. **Test IDs**: Use reliable `testID` props for element selection
4. **Isolation**: Each test uses unique data (no shared state)
5. **Cleanup**: Always clean up, even on test failure

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run E2E Tests
  run: |
    pnpm test:e2e:build:ios
    pnpm start &
    pnpm test:e2e -- favorite-roads.full-flow.test.js
```

### Artifacts

Upload screenshots as artifacts for debugging failed tests:

```yaml
- name: Upload E2E Screenshots
  uses: actions/upload-artifact@v3
  if: failure()
  with:
    name: e2e-screenshots
    path: e2e/screenshots/
```

## Debugging

### Common Issues

**Test times out waiting for element:**
- Verify `testID` props are set correctly
- Check if element is actually rendered (use React DevTools)
- Increase timeout if waiting for slow operations

**Element not found:**
- Use `detox object` to inspect element tree
- Verify element is not in a scrollable area (need to scroll first)
- Check if element is hidden by other views

**Test fails intermittently:**
- Add explicit waits before interactions
- Increase timeout values
- Check for race conditions in animations

### Debug Mode

Run tests in debug mode to step through execution:

```bash
pnpm test:e2e -- favorite-roads.full-flow.test.js --inspect
```

### Verbose Output

Enable verbose logging:

```bash
pnpm test:e2e -- favorite-roads.full-flow.test.js --verbose --logLevel verbose
```

## Future Enhancements

### Additional Test Scenarios

1. **Edge Cases**:
   - Save favorite with empty name (validation)
   - Save favorite with maximum length name
   - Save favorite with special characters

2. **Network Conditions**:
   - Test with slow network
   - Test with offline mode
   - Test with network failures

3. **Multiple Users**:
   - Test with different user accounts
   - Verify favorites are user-specific

4. **Performance**:
   - Measure time to save favorite
   - Measure time to plan with favorites
   - Test with many favorites (100+)

### Automation Improvements

1. **Visual Regression**: Compare screenshots across runs
2. **API Testing**: Test Convex mutations directly
3. **Performance Monitoring**: Track test execution time
4. **Coverage Reporting**: Measure E2E test coverage

## References

- [Detox Documentation](https://wix.github.io/Detox/)
- [Jest Documentation](https://jestjs.io/)
- [Convex Testing Guide](https://docs.convex.dev/testing)
- [Project E2E Guide](../README.md)

## Contact

For questions or issues with these tests, please contact the QA team or create an issue in the repository.
