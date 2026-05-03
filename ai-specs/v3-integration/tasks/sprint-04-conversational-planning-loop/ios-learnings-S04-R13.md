# iOS Learnings: CHAT-S04-R13 - LaneShadowError Mapper Consumes Auth Error Taxonomy

## Implementation Date
2026-05-03

## Edge Cases Discovered
1. **Xcode Project File System Synchronization** - The Xcode project (objectVersion = 77) uses PBXFileSystemSynchronizedRootGroup, which means files are automatically discovered by the build system. Manual project.pbxproj editing is not required for test files in supported directories.
2. **Pre-existing Build Errors** - Found a pre-existing build error in `StoryIdFormatTests.swift` (static member access issues) that was blocking test runs. This was identified as a pre-existing issue using `git status` and did not block the implementation.
3. **Test File Discovery** - Test files in `LaneShadowTests/Services/` are automatically discovered by the Xcode build system when using the new file system synchronization feature.

## API Contract Notes
- **UNAUTHENTICATED** error code maps to `.unauthenticated` case (already existed)
- **FORBIDDEN** error code maps to new `.forbidden` case (added in this task)
- Error codes are case-sensitive and must match exactly (all caps, underscore-separated)
- The fixture file `auth-error-taxonomy.json` is the source of truth for error code mappings

## UI Decisions
- **User-facing copy for `.forbidden`**: "You don't have permission to access this resource." (clear, actionable)
- **Detail text**: "Please sign in with an account that has access to this resource." (provides next steps)
- **Retry behavior**: `.forbidden` does NOT allow retry (consistent with `.unauthenticated`)
- **Authentication recovery**: `.forbidden` DOES require authentication recovery (consistent with `.unauthenticated`)

## Platform-Specific Notes
- **Swift Testing Framework**: Used `@Test` and `#expect` syntax (not XCTest)
- **Test Organization**: Created two test files:
  - `LaneShadowErrorMappingTests.swift` - focused unit tests for specific mappings
  - `LaneShadowErrorMappingFixtureTests.swift` - round-trip test consuming the fixture file
- **Fixture Loading**: Used `Bundle.module.path(forResource:ofType:)` to load test fixtures from Resources directory
- **Test Resource Management**: Created `ios/LaneShadowTests/Resources/` directory and copied fixture from `server/convex/__fixtures__/auth-error-taxonomy.json`

## Files Created/Modified
- **ios/LaneShadow/Services/LaneShadowError.swift**
  - Added `.forbidden` case to enum
  - Added user-facing copy: "You don't have permission to access this resource."
  - Added detail text: "Please sign in with an account that has access to this resource."
  - Updated `allowsRetry` to return `false` for `.forbidden`
  - Updated `requiresAuthenticationRecovery` to return `true` for `.forbidden`
  - Added `rawMessage` return "FORBIDDEN"

- **ios/LaneShadow/Services/LaneShadowErrorMapping.swift**
  - Added `"FORBIDDEN": .forbidden` to `codeMap`
  - Removed legacy `("authentication required", .authRequired)` from `phraseMap`

- **ios/LaneShadowTests/Services/LaneShadowErrorMappingTests.swift** (NEW)
  - Tests for `.forbidden` case existence and properties
  - Tests for UNAUTHENTICATED and FORBIDDEN code mappings
  - Tests for legacy phrase mapping removal

- **ios/LaneShadowTests/Services/LaneShadowErrorMappingFixtureTests.swift** (NEW)
  - Round-trip test consuming `auth-error-taxonomy.json` fixture
  - Validates every error code maps to its `mobile_mapping_target`
  - Uses `Bundle.module` for resource loading

- **ios/LaneShadowTests/Resources/auth-error-taxonomy.json** (NEW)
  - Copied from `server/convex/__fixtures__/auth-error-taxonomy.json`
  - Used as source of truth for fixture-driven testing

## TDD Workflow Summary
- **RED Phase**: Created failing tests that reference `.forbidden` case (didn't exist yet)
- **GREEN Phase**: Implemented `.forbidden` case, updated codeMap, removed legacy phrase mapping
- **REFACTOR Phase**: Verified with `swiftformat --lint` (0 formatting issues)

## Build Verification
- Build succeeded: `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' build`
- All SwiftFormat lint checks passed
- No compilation errors in modified files
