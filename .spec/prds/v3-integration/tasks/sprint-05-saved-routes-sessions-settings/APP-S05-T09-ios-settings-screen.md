================================================================================
TASK: APP-S05-T09 - iOS SettingsScreen — sections + theme picker + sign-out + hamburger menu navigation
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  test:      xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test
  typecheck: xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build
  lint:      swiftformat --lint ios/

PROGRESS: 0/6 AC

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

A new SettingsScreen renders Account / Appearance / Storage / About sections via LSSectionHeader, persists theme choice to UserDefaults with immediate live application, runs the sign-out flow, and the hamburger menu navigates between Home / Saved / Sessions / Offline / Settings (UC-APP-04).

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST compose the screen entirely from existing primitives — `LSTopBar`, `LSSectionHeader`, `LSCard`, `LSListRow`, `LSAvatar`, `LSBottomSheet`, `LSModal`, `LSDivider`, `LSButton` — zero new components per ui-design.md §1.F
- MUST persist the theme choice (.light / .dark / .auto) to UserDefaults via a `Services/ThemeStore.swift` `@MainActor @Observable` class with `current: AppThemeMode` and a `setMode(_:)` setter, mirroring CameraStore's UserDefaults injection pattern from SESS-S05-T07
- MUST apply the chosen theme immediately across all screens by exposing the AppThemeMode through the `\.theme` SwiftUI environment override (or a parallel app-level environment) — no app restart required (UC-APP-01 §AC last bullet)
- MUST run the sign-out flow through `appState.signOut(clerkAuth:convexClient:)` (existing AUTH-S03 surface) wrapped in an `LSModal` confirmation dialog with destructive primary "Sign out" + ghost "Cancel"
- MUST add a new HamburgerMenuDrawer view that extends the LSSessionsDrawer pattern with the 5 entries (Home / Saved Routes / Sessions / Offline Regions / Settings) per ui-design.md §5 Extended LSSessionsDrawer IA — render the drawer as a new view that composes `LSSessionsDrawer` for the sessions section AND a separate `LSListRow` block for the navigation entries; do NOT modify `LSSessionsDrawer` itself
- MUST highlight the active menu entry using `LaneShadowTheme.color.role.agent.accent` (per UC-APP-04 §AC; the spec says `surface.role.agent.accent`; if that token does not exist on iOS, use the closest available role accent token and surface a question rather than introduce a new token)
- MUST display the signed-in user's email in the Account section, sourced from `appState.currentUser?.email` (or fall back to `clerkAuth.currentUser?.email` if AppState has not yet hydrated)
- NEVER hardcode color literals — semantic theme tokens only (lefthook `tokens:native-compliance` will reject hex)
- NEVER touch ios/LaneShadow.xcodeproj/** directly — generated; edit ios/project.yml + run scripts/ios/generate-project.sh
- NEVER modify ios/LaneShadow/Generated/** — types come from server/scripts/generate-mobile-types.ts
- NEVER modify Sprint-04 services (RideFlow.swift / ChatStore.swift / SessionStore.swift) — read-only inputs
- STRICTLY use Dynamic Type-compatible typography variants (`label.lg`, `body.md`, `body.sm`); no fixed `Font.system(size:)` literals

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] SettingsScreen renders 4 sections via LSSectionHeader: Account, Appearance, Storage, About (AC-1 PRIMARY)
- [ ] Theme picker bottom sheet writes the chosen mode to ThemeStore + UserDefaults (AC-2)
- [ ] Theme change applies immediately across screens via the theme environment (AC-3)
- [ ] Sign-out tap presents LSModal confirmation; confirm runs the sign-out flow (AC-4)
- [ ] HamburgerMenuDrawer renders 5 entries with active entry highlighted (AC-5)
- [ ] Tap a menu entry routes to that screen via supplied navigation closure (AC-6)
- [ ] Tests pass + build clean
- [ ] Scope compliance — git diff --name-only ⊆ writeAllowed

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: SettingsScreen renders Account / Appearance / Storage / About sections [PRIMARY]
  GIVEN: SettingsScreenContainer mounts with appState.currentUser = LaneShadowCurrentUser(email:"rider@laneshadow.local", name:"Justin", clerkUserId:"u_1", id:"user-1") and ThemeStore.current = .auto
  WHEN:  The screen renders
  THEN:  Four LSSectionHeader instances appear with titles "ACCOUNT", "APPEARANCE", "STORAGE", "ABOUT"; the Account section contains an LSListRow showing avatar + name "Justin" + email "rider@laneshadow.local"; the Appearance section contains an LSListRow with title "Theme" and trailing label "Auto"; the Storage section contains an LSListRow with title "Offline maps" and trailing chevron; the About section contains LSListRows for "Version", "Terms of Service", "Privacy Policy"

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/Settings/SettingsScreenTests.swift
  TEST_FUNCTION: test_settingsScreen_rendersAllSectionsAndAccountInfo

AC-2: Theme picker writes selection to ThemeStore + UserDefaults
  GIVEN: SettingsScreen rendered; ThemeStore.current = .auto; user taps the Theme row to open the bottom sheet, then taps "Dark"
  WHEN:  themeStore.setMode(.dark) is invoked from the picker's onSelect closure
  THEN:  themeStore.current == .dark; the underlying UserDefaults contains the encoded value "dark" at key "themeStore.mode"; the picker bottom sheet dismisses; the Theme row's trailing label updates to "Dark" on next render

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Services/ThemeStoreTests.swift
  TEST_FUNCTION: test_themeStore_setMode_persistsToUserDefaults

AC-3: Theme change applies immediately across screens via environment
  GIVEN: SettingsScreen + a sibling test view rendered inside the same `\.theme` environment scope; ThemeStore.current = .light
  WHEN:  themeStore.setMode(.dark) is invoked
  THEN:  The hosting view's resolved theme switches to the dark palette; the change is observable on the next render frame WITHOUT app relaunch; the test asserts the resolved `LaneShadowTheme.color.background.default` value differs between .light and .dark

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Services/ThemeStoreTests.swift
  TEST_FUNCTION: test_themeStore_setMode_appliesImmediatelyAcrossEnvironment

AC-4: Sign-out tap presents LSModal confirmation; confirm runs sign-out flow
  GIVEN: SettingsScreen rendered; user taps the destructive "Sign out" button at the screen footer
  WHEN:  The LSModal "Sign out?" appears; user taps the destructive primary "Sign out" button
  THEN:  viewModel.isSignOutModalPresented flips true on the first tap; on confirm, the supplied `onSignOut` closure is invoked exactly once (the closure caller wires `appState.signOut(clerkAuth:convexClient:)`); on cancel, `onSignOut` is NOT invoked and the modal dismisses

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/Settings/SettingsViewModelTests.swift
  TEST_FUNCTION: test_settings_signOutTap_presentsModalAndInvokesOnConfirm

AC-5: HamburgerMenuDrawer renders 5 entries with active entry highlighted
  GIVEN: HamburgerMenuDrawer rendered with `activeEntry: .savedRoutes`
  WHEN:  The drawer body renders
  THEN:  Five LSListRow instances appear in order [Home, Saved Routes, Sessions, Offline Regions, Settings]; only the "Saved Routes" row's background is rendered using the role-accent token (or a documented fallback if `surface.role.agent.accent` does not exist on iOS); each row's accessibilityLabel matches its title; tap targets are ≥ 44pt

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/Settings/HamburgerMenuDrawerTests.swift
  TEST_FUNCTION: test_hamburgerMenu_renders5EntriesAndHighlightsActive

AC-6: Menu entry tap invokes navigation closure
  GIVEN: HamburgerMenuDrawer rendered with active = .home; supplied `onSelect((MenuEntry) -> Void)` closure
  WHEN:  User taps the "Settings" row
  THEN:  The onSelect closure is invoked exactly once with `.settings`; the dismiss animation runs (sidebarSlideOut motion recipe per ui-design.md §5); the supplied `onDismiss` closure is invoked once after the animation

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/Settings/HamburgerMenuDrawerTests.swift
  TEST_FUNCTION: test_hamburgerMenu_tapEntryInvokesNavigationClosure

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

- TC-1 (maps_to_ac AC-1): Inspecting SettingsScreen yields 4 LSSectionHeader instances with the expected titles, and the Account/Appearance/Storage/About rows are present.
- TC-2 (maps_to_ac AC-2): After setMode(.dark), themeStore.current == .dark AND UserDefaults["themeStore.mode"] == "dark".
- TC-3 (maps_to_ac AC-3): The resolved theme color changes between modes, observable from a hosted view's environment without re-mounting.
- TC-4 (maps_to_ac AC-4): isSignOutModalPresented flips true on tap; onSignOut invoked once on confirm; not invoked on cancel.
- TC-5 (maps_to_ac AC-5): HamburgerMenuDrawer contains exactly 5 entries in fixed order; only the active entry uses the highlight token.
- TC-6 (maps_to_ac AC-6): onSelect(.settings) called once after Settings tap; onDismiss called once.

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Features/Settings/SettingsScreen.swift (NEW — SwiftUI screen)
- ios/LaneShadow/Features/Settings/SettingsScreenContainer.swift (NEW — owns viewModel, mounts screen)
- ios/LaneShadow/Features/Settings/SettingsViewModel.swift (NEW — `@MainActor @Observable` VM)
- ios/LaneShadow/Features/Settings/HamburgerMenuDrawer.swift (NEW — 5-entry navigation drawer composing LSListRow + LSScrim)
- ios/LaneShadow/Features/Settings/ThemePickerSheet.swift (NEW — small bottom sheet with 3 LSListRow selection rows)
- ios/LaneShadow/Services/ThemeStore.swift (NEW — `@MainActor @Observable` class with UserDefaults persistence + `current: AppThemeMode` enum + `setMode(_:)`)
- ios/LaneShadow/Models/AppRoute+Settings.swift (NEW — extension on AppState.AppRoute adding cases for .savedRoutes / .sessions / .offline / .settings; if AppRoute is a non-extension-friendly type, add a new sibling enum `MenuEntry` instead and let RootView translate to AppRoute — recommend `MenuEntry` per separation-of-concerns; flag in clarifying questions)
- ios/LaneShadowTests/Features/Settings/SettingsScreenTests.swift (NEW — view-level tests for AC-1)
- ios/LaneShadowTests/Features/Settings/SettingsViewModelTests.swift (NEW — VM tests for AC-4)
- ios/LaneShadowTests/Features/Settings/HamburgerMenuDrawerTests.swift (NEW — view tests for AC-5..6)
- ios/LaneShadowTests/Services/ThemeStoreTests.swift (NEW — AC-2..3 unit tests with injected UserDefaults)

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated; edit ios/project.yml + run scripts/ios/generate-project.sh
- ios/LaneShadow/Generated/** — generated by server/scripts/generate-mobile-types.ts
- ios/LaneShadow/Sandbox/MockProviders/** — sandbox stories keep their MockProviders
- ios/LaneShadow/Services/RideFlow.swift / ChatStore.swift / SessionStore.swift — Sprint 04 owners; read-only here
- ios/LaneShadow/Services/ClerkAuth.swift — owned by AUTH-S03-T05; read-only here
- ios/LaneShadow/Models/AppState.swift — owned by AUTH-S03-T07; read but do not modify (use existing `signOut` surface)
- ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift — primitive; reuse only without modification
- ios/LaneShadow/RootView.swift — owned by AUTH-S03-T07; do not modify in this task (the hamburger menu wiring routes via supplied navigation closures, not direct RootView edits)

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Inject UserDefaults into ThemeStore for testability (default to `.standard`); tests use `UserDefaults(suiteName: "test-themeStore")`
- Reuse the existing LSListRow trailing variants (.label / .chevron / .toggle) — do not create new variants
- Use semantic typography variants only — no `Font.system(size:)` literals
- Wrap the sign-out modal copy in plain strings (do not invent localization in this task; the project does not yet use localized strings)

⚠️ Ask First:
- Whether `surface.role.agent.accent` token exists on iOS — if not, surface a clarifying question and use the closest available accent token (likely `signal.default` at low alpha or `signal.whisper`); do NOT introduce a new token
- Whether AppState.AppRoute should grow new cases (.savedRoutes / .sessions / .offline / .settings) in this task — recommend `MenuEntry` enum sibling instead, with RootView responsible for routing translation in a follow-up; flag this with the user
- Whether the OS-level dark/light mode (i.e., when AppThemeMode == .auto) reads `UITraitCollection.userInterfaceStyle` correctly — confirm with Apple docs via context7 if uncertain
- Whether the Storage row link to OfflineRegions should be a stub/no-op for this sprint (Offline ships in Sprint 06) — recommend stub closure that logs to performance for observability and shows a "Coming soon" toast; flag this

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Features/Settings/SettingsScreen.swift (NEW): SwiftUI screen with LSTopBar + 4 sections + footer Sign-out
- ios/LaneShadow/Features/Settings/SettingsScreenContainer.swift (NEW): authenticated wrapper, owns viewModel and themeStore + appState bindings
- ios/LaneShadow/Features/Settings/SettingsViewModel.swift (NEW): `@MainActor @Observable` VM with `isSignOutModalPresented`, `isThemeSheetPresented`, methods `presentSignOut`, `confirmSignOut`, `presentThemeSheet`, `selectTheme`
- ios/LaneShadow/Features/Settings/HamburgerMenuDrawer.swift (NEW): 5-entry navigation drawer (composes LSListRow + LSScrim), takes `activeEntry: MenuEntry`, `onSelect: (MenuEntry) -> Void`, `onDismiss: () -> Void`
- ios/LaneShadow/Features/Settings/ThemePickerSheet.swift (NEW): small bottom sheet body for theme selection
- ios/LaneShadow/Services/ThemeStore.swift (NEW): `@MainActor @Observable` class with persistence; defines `enum AppThemeMode: String, Codable { case light, dark, auto }`
- ios/LaneShadow/Models/AppRoute+Settings.swift (NEW): MenuEntry enum + helper extensions (or AppRoute extension if reviewer approves)
- ios/LaneShadowTests/Features/Settings/SettingsScreenTests.swift (NEW): AC-1 view-level tests
- ios/LaneShadowTests/Features/Settings/SettingsViewModelTests.swift (NEW): AC-4 VM tests
- ios/LaneShadowTests/Features/Settings/HamburgerMenuDrawerTests.swift (NEW): AC-5..6 view tests
- ios/LaneShadowTests/Services/ThemeStoreTests.swift (NEW): AC-2..3 unit tests

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

[Standard RED → GREEN → REFACTOR per AC.]

1. RED for AC-2: write ThemeStore unit test asserting setMode(.dark) persists to UserDefaults. Confirm fails because ThemeStore type does not exist.
2. GREEN: implement minimum ThemeStore with current + setMode + injected UserDefaults.
3. RED → GREEN for AC-3: assert that switching modes resolves to a different theme color via the SwiftUI environment override.
4. RED → GREEN for AC-1 (full screen rendering — heaviest test).
5. RED → GREEN for AC-4 (sign-out modal flow).
6. RED → GREEN for AC-5 (hamburger drawer composition + active highlight).
7. RED → GREEN for AC-6 (tap closure invocation).
8. Capture RED replay output to `.tmp/APP-S05-T09/red-{ac}-output.txt` per AC.
9. REFACTOR: ensure ThemeStore is the SINGLE source of truth for the active theme; no duplicate UserDefaults reads scattered across screens; ensure `.theme` environment override is applied at the highest practical scope (typically the container).
10. Run the full evidence gate sequence (test, build, lint, token-check, snapshots:check, scope diff).

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v3-integration/architecture/ui-design.md [PRIMARY PATTERN]
   - Lines: 229-266 + 627-654
   - Focus: §1.F SettingsScreen composition + sections layout + accessibility; §5 Extended LSSessionsDrawer IA (the menu-drawer reference)

2. ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift
   - Lines: 1-106 + 220-302
   - Focus: Drawer chrome + session row layout — mirror this pattern for HamburgerMenuDrawer; do NOT modify the organism

3. .spec/prds/v3-integration/09-uc-app.md
   - Lines: 19-89
   - Focus: UC-APP-01 + UC-APP-04 acceptance criteria — every AC bullet must trace to one of this task's ACs

4. ios/LaneShadow/Models/AppState.swift
   - Lines: 1-203
   - Focus: Existing signOut surface (line 92-96) — wire onSignOut closure to this; appRoute enum for navigation translation

5. ios/LaneShadow/Views/Molecules/LSListRow.swift
   - Lines: 1-100
   - Focus: Trailing variants (.chevron / .label / .toggle) — settings rows reuse these without modification

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence — TDD_STATE history per AC saved to `.tmp/APP-S05-T09/red-{ac}-output.txt`
Gate 2: All tests pass — xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test (Exit 0)
Gate 3: Build — xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build (Exit 0)
Gate 4: Lint — swiftformat --lint ios/ (Exit 0)
Gate 5: Token compliance — scripts/tokens/enforce-native-compliance.sh (Exit 0)
Gate 6: Sandbox snapshots still pass — pnpm snapshots:check (Exit 0)
Gate 7: Scope compliance — git diff --name-only ⊆ writeAllowed
Per-AC verification: xcodebuild ... test -only-testing:LaneShadowTests/SettingsScreenTests/{test_function_name} OR xcodebuild ... test -only-testing:LaneShadowTests/ThemeStoreTests/{test_function_name}

--------------------------------------------------------------------------------
REVIEW
--------------------------------------------------------------------------------

Must pass:
- All 6 ACs verified via per-AC test commands
- Token compliance (no hex literals; only `theme.*` / `LaneShadowTheme.color.*`)
- writeAllowed/writeProhibited respected (git diff verifies)
- ThemeStore is `@MainActor` and uses `@Observable`; UserDefaults is injected for tests
- HamburgerMenuDrawer reuses LSListRow + LSScrim composition (no new primitives)

Should verify:
- Theme change is applied via environment override at the container scope, not via NotificationCenter or KVO
- The Storage row's "Coming soon" stub (or chosen alternative) does not crash on tap
- Sign-out modal copy reads "Sign out?" + body matching ui-design.md §1.F destructive style
- Active menu entry's highlight uses an existing token (no new tokens introduced)
- Verdict: PENDING

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: AUTH-S03-T05 (ClerkAuth + signOut flow), AUTH-S03-T07 (RootView + AppState), SESS-S05-T07 (drawer pattern + cameraStore presence informs the larger drawer surface)
Blocks: Sprint 06 (Offline Regions list — Storage row links into it)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "APP-S05-T09",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "SettingsScreen renders Account/Appearance/Storage/About sections", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SettingsScreenTests/test_settingsScreen_rendersAllSectionsAndAccountInfo", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "Theme picker writes selection to ThemeStore and UserDefaults", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/ThemeStoreTests/test_themeStore_setMode_persistsToUserDefaults", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "Theme change applies immediately across screens via environment", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/ThemeStoreTests/test_themeStore_setMode_appliesImmediatelyAcrossEnvironment", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "Sign-out tap presents LSModal confirmation; confirm runs sign-out flow", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SettingsViewModelTests/test_settings_signOutTap_presentsModalAndInvokesOnConfirm", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "HamburgerMenuDrawer renders 5 entries with active entry highlighted", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/HamburgerMenuDrawerTests/test_hamburgerMenu_renders5EntriesAndHighlightsActive", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "Menu entry tap invokes navigation closure", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/HamburgerMenuDrawerTests/test_hamburgerMenu_tapEntryInvokesNavigationClosure", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "Four LSSectionHeader instances render with the expected titles; Account/Appearance/Storage/About rows present.", "maps_to_ac": "AC-1", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SettingsScreenTests/test_settingsScreen_rendersAllSectionsAndAccountInfo", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "After setMode(.dark): themeStore.current == .dark AND UserDefaults['themeStore.mode'] == 'dark'.", "maps_to_ac": "AC-2", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/ThemeStoreTests/test_themeStore_setMode_persistsToUserDefaults", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "Switching modes via setMode changes the resolved theme palette in the SwiftUI environment.", "maps_to_ac": "AC-3", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/ThemeStoreTests/test_themeStore_setMode_appliesImmediatelyAcrossEnvironment", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "isSignOutModalPresented flips true on tap; onSignOut invoked once on confirm; not invoked on cancel.", "maps_to_ac": "AC-4", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/SettingsViewModelTests/test_settings_signOutTap_presentsModalAndInvokesOnConfirm", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "HamburgerMenuDrawer contains exactly 5 entries in fixed order; active entry uses the highlight token.", "maps_to_ac": "AC-5", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/HamburgerMenuDrawerTests/test_hamburgerMenu_renders5EntriesAndHighlightsActive", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test_criterion", "description": "onSelect(.settings) invoked once after Settings tap; onDismiss invoked once.", "maps_to_ac": "AC-6", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/HamburgerMenuDrawerTests/test_hamburgerMenu_tapEntryInvokesNavigationClosure", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
