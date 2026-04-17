# E2E Testing with Detox - Complete Guide

Comprehensive guide for end-to-end testing in the Hummingbird project using Detox, Jest, and iOS Simulator.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Setup Summary](#setup-summary)
3. [Running Tests](#running-tests)
4. [Baseline Test](#baseline-test)
5. [Writing Tests](#writing-tests)
6. [TDD Workflow](#tdd-workflow)
7. [Troubleshooting](#troubleshooting)
8. [API Reference](#api-reference)

---

## 🚀 Quick Start

### Run the Baseline Test

The fastest way to verify your Detox setup:

```bash
# ONE-TIME: Install deps and build
pnpm install --frozen-lockfile
pnpm test:e2e:build:ios

# Terminal 1: Start Metro (leave running)
pnpm start

# Terminal 2: Run tests (no rebuild needed for JS changes!)
pnpm test:e2e -- e2e/app-launch.test.js
```

**Important**: Debug builds connect to Metro. You only need to rebuild when making **native** changes (dependencies, Swift/Kotlin code). JavaScript/TypeScript changes reload automatically via Metro!

**Expected output:**
```
App Launch (Baseline)
  ✓ should launch the app without crashing
  ✓ should display the sign-in screen
  ✓ should display the Hummingbird title
  ✓ should display the sign-in button
  ✓ should display subtitle text

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
```

---

## ✅ Setup Summary

Following the [Detox Project Setup guide](https://wix.github.io/Detox/docs/introduction/project-setup/), the complete Detox infrastructure is configured for **iOS-focused testing** with pnpm and Jest.

### What's Configured

#### iOS Setup (Primary)
- ✅ `.detoxrc.js` configured for iOS Simulator (iPhone 15)
- ✅ Uses `xcodebuild -workspace` (required for CocoaPods)
- ✅ Jest test runner with TypeScript support
- ✅ Test patterns: `**/*.detox.spec.ts`, `**/*.detox.spec.js`, `e2e/**/*.test.js`

#### Android Setup (Bonus)
- ✅ `android/build.gradle` - Detox maven repository added
- ✅ `android/app/build.gradle` - Test configuration and dependencies
- ✅ `DetoxTest.kt` - Native test file created
- ✅ `network_security_config.xml` - Network security for Metro
- ✅ `AndroidManifest.xml` - Security config registered

#### Dependencies
- ✅ `detox@^20.43.0` (devDependencies)
- ✅ `@types/detox@^18.1.3` (devDependencies)
- ✅ `jest@^30.2.0` (devDependencies)

---

## 🧪 Running Tests

### Build Commands

**When to rebuild**:
- ✅ First time setup
- ✅ After installing native dependencies
- ✅ After changing native code (Swift, Kotlin)
- ✅ After updating Expo SDK
- ❌ NOT needed for JavaScript/TypeScript changes (Metro hot reload handles it!)

```bash
# iOS (one-time or after native changes)
pnpm test:e2e:build:ios

# Android (one-time or after native changes)
pnpm test:e2e:build:android

# Rebuild framework cache (rarely needed)
pnpm test:e2e:rebuild:ios
```

**Fast TDD workflow** (no rebuilds):
```bash
# Terminal 1: Start Metro once
pnpm start

# Terminal 2: Edit code, run tests repeatedly
pnpm test:e2e -- path/to/test.spec.ts
# Make changes, run again - Metro reloads automatically!
pnpm test:e2e -- path/to/test.spec.ts
```

### Test Commands

```bash
# Run all E2E tests (iOS)
pnpm test:e2e

# Run specific test file
pnpm test:e2e -- e2e/app-launch.test.js

# Run tests matching pattern
pnpm test:e2e -- --testNamePattern="sign-in"

# Run Android tests
pnpm test:e2e:android
```

### Prerequisites

- Xcode + Command Line Tools installed
- iOS Simulator device available (default: "iPhone 15")
- Homebrew `applesimutils` recommended: `brew install applesimutils`
- Android Studio with an emulator matching `.detoxrc.js` (e.g., `Pixel_3a_API_30_x86`)
- `JAVA_HOME` configured for Android builds

### Expo-Specific Considerations

**`device.reloadReactNative()` not supported**

Expo's AppDelegate structure doesn't expose `rootViewFactory` in a way Detox expects. This means:
- ❌ Cannot use `device.reloadReactNative()` in `beforeEach`
- ✅ Use `device.launchApp({ newInstance: true })` in `beforeAll` instead
- ✅ Tests share the same app instance within a test suite

**Workaround for test isolation:**
```javascript
describe('Feature Tests', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
  })
  
  // No beforeEach needed - tests share app instance
  
  it('test 1', async () => {
    // Test code
  })
  
  it('test 2', async () => {
    // Test code - same app instance
  })
})
```

### Troubleshooting Common Issues

**iOS build fails**
```bash
# Ensure CocoaPods are installed
cd ios && pod install && cd ..

# Check available simulators
xcrun simctl list devices | grep -i "iPhone"

# Update .detoxrc.js if needed to match available device
```

**Error: "Invalid AppDelegate - Could not access rootViewFactory"**

This error occurs when using `device.reloadReactNative()` which isn't supported in Expo:
```javascript
// ❌ Remove this from your tests:
beforeEach(async () => {
  await device.reloadReactNative()  // Not supported in Expo!
})

// ✅ Use this instead:
beforeAll(async () => {
  await device.launchApp({ newInstance: true })
})
// Tests will share the same app instance within the suite
```

**App hangs on launch**
```bash
# Terminal 1: Start Metro manually
pnpm start

# Terminal 2: Run tests
pnpm test:e2e
```

**Clean build**
```bash
# Remove build artifacts
rm -rf ios/build

# Rebuild
pnpm test:e2e:build:ios
```

**Android issues**
```bash
# Verify Gradle works
cd android && ./gradlew assembleDebug && cd ..

# List emulators
emulator -list-avds

# Set JAVA_HOME (macOS)
export JAVA_HOME=$(/usr/libexec/java_home)
```

### Available Scripts

From `package.json`:
```json
{
  "test:e2e": "detox test --configuration ios.sim.debug",
  "test:e2e:android": "detox test --configuration android.emu.debug",
  "test:e2e:build:ios": "detox build --configuration ios.sim.debug",
  "test:e2e:build:android": "detox build --configuration android.emu.debug",
  "test:e2e:rebuild:ios": "detox rebuild-framework-cache"
}
```

---

## 📱 Baseline Test

### What It Tests

`e2e/app-launch.test.js` - A simple smoke test verifying:

1. ✅ App launches without crashing
2. ✅ Sign-in screen is visible
3. ✅ "Hummingbird" title is displayed
4. ✅ Sign-in button is present
5. ✅ Subtitle text is visible

### Test Code

```javascript
describe('App Launch (Baseline)', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
  })

  beforeEach(async () => {
    await device.reloadReactNative()
  })

  it('should display the sign-in screen', async () => {
    await waitFor(element(by.id('sign-in-screen')))
      .toBeVisible()
      .withTimeout(10000)
  })

  it('should display the Hummingbird title', async () => {
    await expect(element(by.text('Hummingbird'))).toBeVisible()
  })
})
```

### What This Validates

- ✓ Detox is configured correctly
- ✓ iOS build works
- ✓ App launches in simulator
- ✓ React Native renders correctly
- ✓ Basic UI elements are accessible

---

## ✍️ Writing Tests

### Test File Location

Tests can be located anywhere using these patterns:

```
✅ Recommended: Colocate with features
app/
  features/
    profile/
      profile.tsx
      profile.detox.spec.ts  ← Next to component

✅ Alternative: Centralized e2e folder
e2e/
  app-launch.test.js
  profile-management.test.js
```

### Adding testID Props

For Detox to find elements reliably, add `testID` props:

```typescript
// ✅ Good - Detox can find these
<View testID="sign-in-screen">
  <TextInput
    testID="email-input"
    value={email}
    onChangeText={setEmail}
  />
  <Pressable testID="sign-in-button" onPress={handleSignIn}>
    <Text>Sign In</Text>
  </Pressable>
</View>

// ❌ Bad - Detox can't reliably find elements
<View>
  <TextInput value={email} onChangeText={setEmail} />
  <Pressable onPress={handleSignIn}>
    <Text>Sign In</Text>
  </Pressable>
</View>
```

### Test Structure

```typescript
/**
 * E2E tests for [Feature Name]
 * 
 * Acceptance Criteria:
 * - AC1: User should be able to [specific action]
 * - AC2: System should display [expected result]
 * - AC3: Error handling for [edge case]
 */

describe('[Feature Name]', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
  })

  // Note: No beforeEach with reloadReactNative() - not supported in Expo
  // Tests share the same app instance within this suite

  it('should satisfy AC1: User can [specific action]', async () => {
    // Arrange
    await element(by.id('some-button')).tap()
    
    // Act
    await element(by.id('input-field')).typeText('test value')
    await element(by.id('submit-button')).tap()
    
    // Assert
    await expect(element(by.text('Success!'))).toBeVisible()
  })
})
```

### Best Practices

1. **Independent Tests** - Each test runs in isolation
2. **Descriptive Names** - Test names clearly describe behavior
3. **Focus on User Flows** - Test critical paths, not every UI element
4. **Handle Async** - Use `waitFor()` for async behavior, avoid delays
5. **Break Down Complex Workflows** - Multiple focused tests > one giant test

---

## 🔄 TDD Workflow

Following the UI Developer agent profile, use this test-first approach:

### 1. Write Tests First

Before writing any feature code:

```typescript
// app/(app)/settings/profile.detox.spec.ts

describe('Profile Management (Phase 2)', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
  })

  it('should display existing profile data', async () => {
    await element(by.id('profile-tab')).tap()
    await expect(element(by.id('first-name-input'))).toBeVisible()
    await expect(element(by.id('last-name-input'))).toBeVisible()
  })

  it('should update profile name', async () => {
    await element(by.id('first-name-input')).replaceText('Jane')
    await element(by.id('last-name-input')).replaceText('Doe')
    await element(by.id('save-button')).tap()
    
    await expect(element(by.text('Profile updated'))).toBeVisible()
  })
})
```

### 2. Run Tests (Should Fail)

```bash
pnpm test:e2e -- app/(app)/settings/profile.detox.spec.ts
```

Expected: Tests fail because UI doesn't exist yet.

### 3. Implement Feature

Write just enough code to pass the tests:

```typescript
// app/(app)/settings/profile.tsx

export default function ProfileScreen() {
  return (
    <View testID="profile-screen">
      <TextInput testID="first-name-input" />
      <TextInput testID="last-name-input" />
      <Pressable testID="save-button" onPress={handleSave}>
        <Text>Save</Text>
      </Pressable>
    </View>
  )
}
```

### 4. Run All Tests

```bash
pnpm test:e2e
```

Expected: All tests pass, no regressions.

### 5. Refactor Safely

Clean up code while tests still pass:
- Extract components
- Optimize performance
- Improve code structure

---

## 🐛 Troubleshooting

### Build Fails

#### Error: xcworkspace does not exist
**Solution**: Ensure CocoaPods have been installed (`cd ios && pod install`). `.detoxrc.js` uses `-workspace` to build.

#### Error: Found no destinations for scheme
```bash
# Check available simulators
xcrun simctl list devices

# Ensure iPhone 15 (or similar) is available
# Update .detoxrc.js if needed:
devices: {
  simulator: {
    type: 'ios.simulator',
    device: { type: 'iPhone 15' }  // Use available device
  }
}
```

#### General Build Issues
```bash
# Clean build directory
rm -rf ios/build

# Rebuild
pnpm test:e2e:build:ios
```

### Tests Timeout

1. **Start Metro manually**:
   ```bash
   # Terminal 1
   pnpm start
   
   # Terminal 2
   pnpm test:e2e
   ```

2. **Increase timeout**:
   ```javascript
   await waitFor(element(by.id('screen')))
     .toBeVisible()
     .withTimeout(20000)  // Increase from 10s to 20s
   ```

3. **Check simulator status**:
   ```bash
   xcrun simctl list devices | grep Booted
   ```

### Tests Flake

Common causes and fixes:

1. **Elements not ready**: Use `waitFor()` instead of direct `expect()`
   ```javascript
   // ❌ Bad - may fail if element loads slowly
   await expect(element(by.id('list'))).toBeVisible()
   
   // ✅ Good - waits for element
   await waitFor(element(by.id('list')))
     .toBeVisible()
     .withTimeout(5000)
   ```

2. **Animation delays**: Wait for animations to complete
   ```javascript
   await element(by.id('button')).tap()
   await new Promise(resolve => setTimeout(resolve, 500))  // Wait for animation
   await expect(element(by.id('result'))).toBeVisible()
   ```

3. **Test dependencies**: Tests should not depend on each other
   ```javascript
   // ❌ Bad - Test 2 depends on Test 1
   it('test 1', async () => {
     await element(by.id('input')).typeText('value')
   })
   
   it('test 2', async () => {
     await expect(element(by.id('input'))).toHaveText('value')  // Fails if Test 1 didn't run
   })
   
   // ✅ Good - Each test is independent
   beforeEach(async () => {
     await device.reloadReactNative()  // Fresh state
   })
   ```

### Metro Connection Issues

```bash
# Reset Metro cache
pnpm start -- --reset-cache

# Or clean and rebuild
watchman watch-del-all
rm -rf node_modules
pnpm install
pnpm test:e2e:build:ios
```

---

## 📚 API Reference

### Core Detox APIs

#### Device
```javascript
// Launch app
await device.launchApp()
await device.launchApp({ newInstance: true })
await device.launchApp({ permissions: { camera: 'YES' } })

// Reload React Native
await device.reloadReactNative()

// Terminate app
await device.terminateApp()

// Device interactions
await device.sendToHome()
await device.shake()
```

#### Element Matchers
```javascript
// By testID (recommended)
element(by.id('testID'))

// By text
element(by.text('Sign In'))

// By label (accessibility label)
element(by.label('Submit'))

// By type
element(by.type('RCTTextInput'))

// Combining matchers
element(by.text('Hello').withAncestor(by.id('screen')))
element(by.id('button').withDescendant(by.text('Submit')))
```

#### Actions
```javascript
// Tap
await element(by.id('button')).tap()

// Type text
await element(by.id('input')).typeText('Hello')

// Replace text
await element(by.id('input')).replaceText('World')

// Clear text
await element(by.id('input')).clearText()

// Scroll
await element(by.id('scrollview')).scroll(200, 'down')
await element(by.id('scrollview')).scrollTo('bottom')

// Swipe
await element(by.id('screen')).swipe('up', 'fast', 0.5)
```

#### Assertions
```javascript
// Visibility
await expect(element(by.id('screen'))).toBeVisible()
await expect(element(by.id('screen'))).toBeNotVisible()

// Existence
await expect(element(by.id('element'))).toExist()
await expect(element(by.id('element'))).toNotExist()

// Text
await expect(element(by.id('label'))).toHaveText('Hello')
await expect(element(by.id('input'))).toHaveValue('World')

// Focus
await expect(element(by.id('input'))).toBeFocused()
```

#### Wait For
```javascript
// Wait for element to be visible
await waitFor(element(by.id('screen')))
  .toBeVisible()
  .withTimeout(10000)

// Wait for element to not be visible
await waitFor(element(by.id('loading')))
  .toBeNotVisible()
  .withTimeout(5000)

// Wait while element is visible
await waitFor(element(by.id('spinner')))
  .not.toBeVisible()
  .whileElement(by.id('scrollview'))
  .scroll(50, 'down')
```

### Test Lifecycle Hooks

```javascript
describe('Test Suite', () => {
  // Runs once before all tests
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
  })

  // Note: Expo doesn't support device.reloadReactNative()
  // Tests share the same app instance within the suite

  // Runs after each test (optional cleanup)
  afterEach(async () => {
    // Cleanup if needed
  })

  // Runs once after all tests
  afterAll(async () => {
    await device.terminateApp()
  })
})
```

---

## 🎯 Sprint 03 Examples

### Phase 2: Profile Management

```typescript
// app/(app)/settings/profile.detox.spec.ts

/**
 * E2E tests for Profile Management
 * 
 * Acceptance Criteria:
 * - AC1: User can view existing profile data
 * - AC2: User can update first name and last name
 * - AC3: System shows success message after save
 * - AC4: Session refreshes automatically after update
 */

describe('Profile Management (Phase 2)', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
  })

  // Note: No beforeEach - Expo doesn't support device.reloadReactNative()

  it('should satisfy AC1: View existing profile data', async () => {
    await element(by.id('profile-tab')).tap()
    await expect(element(by.id('profile-screen'))).toBeVisible()
    await expect(element(by.id('first-name-input'))).toBeVisible()
    await expect(element(by.id('last-name-input'))).toBeVisible()
  })

  it('should satisfy AC2: Update name fields', async () => {
    await element(by.id('first-name-input')).replaceText('Jane')
    await element(by.id('last-name-input')).replaceText('Doe')
    await element(by.id('save-button')).tap()
    
    // Verify save initiated
    await expect(element(by.id('save-button'))).toBeDisabled()
  })

  it('should satisfy AC3: Show success message', async () => {
    await element(by.id('first-name-input')).replaceText('Jane')
    await element(by.id('save-button')).tap()
    
    await waitFor(element(by.text('Profile updated successfully')))
      .toBeVisible()
      .withTimeout(5000)
  })

  it('should satisfy AC4: Session refreshes after update', async () => {
    const oldName = await element(by.id('first-name-input')).getAttributes()
    
    await element(by.id('first-name-input')).replaceText('NewName')
    await element(by.id('save-button')).tap()
    
    await waitFor(element(by.text('Profile updated')))
      .toBeVisible()
      .withTimeout(5000)
    
    // Navigate away and back to verify session refresh
    await element(by.id('home-tab')).tap()
    await element(by.id('profile-tab')).tap()
    
    await expect(element(by.id('first-name-input'))).toHaveValue('NewName')
  })
})
```

---

## 📖 Additional Resources

- **Detox Documentation**: https://wix.github.io/Detox/
- **Detox API Reference**: https://wix.github.io/Detox/docs/api/actions
- **Jest Matchers**: https://wix.github.io/Detox/docs/api/expect
- **Detox Best Practices**: https://wix.github.io/Detox/docs/introduction/writing-your-first-passing-test

---

## ✨ Summary

You now have:

1. ✅ Complete Detox setup (iOS + Android)
2. ✅ Baseline test ready to run (`e2e/app-launch.test.js`)
3. ✅ testID props added to sign-in screen
4. ✅ Jest config recognizing all test patterns
5. ✅ Ready for TDD workflow on Sprint 03 features

**Get started:** `pnpm test:e2e:build:ios && pnpm test:e2e`

Happy testing! 🎉
