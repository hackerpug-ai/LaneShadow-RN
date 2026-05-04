================================================================================
TASK: APP-S06-T10 - Android SettingsScreen + theme persistence via DataStore + sign-out + hamburger menu navigation
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew test
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: 0/6 AC

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

A rider opens Settings from the hamburger menu, sees Account / Appearance / Storage / About sections, can flip theme between Light/Dark/Auto with immediate effect persisted via DataStore, taps "Sign out" to clear tokens and return to SignInScreen, and can navigate via the hamburger menu's five entries (Home / Saved / Sessions / Offline / Settings).

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST compose the screen from existing V2 atoms/molecules/organisms only — LSTopBar + LSSectionHeader + LSCard + LSListRow + LSAvatar + LSBottomSheet (theme picker) + LSConfirmDialog (sign-out) + LSButton + LSDivider + LSText + LSIcon — zero new primitives
- MUST persist theme mode via `AppStateRepository.setThemeMode(ThemeMode.LIGHT|DARK|SYSTEM)` (already wired in Sprint 04) and apply it immediately at the LaneShadowTheme level via the existing `LocalLaneShadowTheme` CompositionLocal — no app restart
- MUST display the signed-in account via `ConvexClientProvider.observeCurrentUser(): Flow<ConvexCurrentUser?>` (already exists) bound to LSAvatar(initials) + LSListRow(title=displayName, subtitle=email)
- MUST wire "Sign out" button to LSConfirmDialog → on confirm invokes `MainNavViewModel.signOut()` (which delegates to existing `services/SignOutFlow.kt`) → SharedFlow `NavEvent.Navigate(Route.SignIn)` is collected by MainNavGraph (already wired) → navigation occurs
- MUST render an in-screen NavigationDrawer (`androidx.compose.material3.ModalNavigationDrawer`) hosting a HamburgerMenu Composable with FIVE entries: Home (Route.Home), Saved Routes (Route.SavedRoutes), Sessions (Route.Sessions), Offline Regions (Route.Offline — placeholder route OK if not yet wired), Settings (Route.Settings) — each row is an LSListRow leading=LSIcon + title + chevron trailing
- MUST highlight the currently-active menu entry using the V2 token `surface.role.agent.accent` — read from `LocalLaneShadowTheme.current.colors.surface.role.agent.accent` (or the closest semantic token if the exact alias is missing; consult tokens during implementation)
- MUST dismiss the drawer with `sidebarSlideOut` motion before navigation — Material3 `ModalNavigationDrawer.close()` provides this
- MUST surface the same hamburger menu via a reusable Composable so future screens (Idle/Planning/Saved/Sessions/Settings) can host it without duplication (DRY rule of 2; this is the second consumer)
- NEVER hardcode color/typography literals — all surfaces resolve through `LocalLaneShadowTheme.current`
- NEVER persist the theme to a parallel SharedPreferences — DataStore via AppStateRepository is the single source
- NEVER touch `services/RideFlowReducer.kt` or `services/ChatViewModel.kt` — Sprint 04 inputs (read-only here)
- STRICTLY follow architecture/ui-design.md § 1.F SettingsScreen composition (Account / Appearance / Storage / About sections + footer Sign out) and § 5 hamburger menu IA (5 entries with active-item highlight)

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] Account section displays signed-in user from observeCurrentUser (AC-1 PRIMARY)
- [ ] Appearance section persists theme via DataStore + applies immediately (AC-2)
- [ ] Sign out flow confirms via LSConfirmDialog + clears tokens + routes to SignIn (AC-3)
- [ ] Hamburger menu Composable hosts 5 entries with active highlight (AC-4)
- [ ] Tap Saved Routes / Sessions / Offline / Settings routes correctly + dismisses drawer (AC-5)
- [ ] Storage section "Offline maps" row routes to placeholder Route.Offline (or visible disabled if Sprint 07 not landed) (AC-6)
- [ ] gradlew test + compileDebugKotlin clean
- [ ] Sandbox stories untouched + snapshots:check green
- [ ] TDD RED evidence per AC

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Account section displays signed-in user from observeCurrentUser [PRIMARY]
  GIVEN: A SettingsViewModel with a fake ConvexClientProvider.observeCurrentUser emitting ConvexCurrentUser(id="u-1", displayName="Justin Rich", email="justin@formulist.ai")
  WHEN:  viewModel.state is collected
  THEN:  First Loaded emission has account.displayName="Justin Rich", account.email="justin@formulist.ai", account.avatarInitials="JR"; the composed Settings screen renders an LSListRow with leading=LSAvatar(initials="JR"), title="Justin Rich", subtitle="justin@formulist.ai"

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/settings/SettingsViewModelTest.kt
  TEST_FUNCTION: state_observeCurrentUser_populatesAccountSection

AC-2: Appearance section persists theme via DataStore + applies immediately
  GIVEN: A SettingsViewModel with AppStateRepository starting at ThemeMode.SYSTEM
  WHEN:  viewModel.onThemeChange(ThemeMode.DARK) is invoked
  THEN:  AppStateRepository.setThemeMode was called once with ThemeMode.DARK; subsequent state emission reads themeMode=DARK from `appState`; the composed Settings screen reflects "Theme: Dark" in the LSListRow trailing label and the LSBottomSheet picker shows DARK row with `LSIcon(.starFill, color=signal)` selection indicator

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/settings/SettingsViewModelTest.kt
  TEST_FUNCTION: onThemeChange_persistsViaDataStoreAndUpdatesState

AC-3: Sign out flow confirms via LSConfirmDialog + clears tokens + routes to SignIn
  GIVEN: A composed SettingsRoute mounted with a fake SignOutFlow whose `signOut()` emits NavEvent.Navigate(Route.SignIn) on its events SharedFlow
  WHEN:  the rider taps the "Sign out" button (tag `settings-sign-out-button`), then taps "Confirm" in the LSConfirmDialog (tag `settings-sign-out-confirm`)
  THEN:  SignOutFlow.signOut() was called once; the SharedFlow emission is collected by the test's NavController fake which records a navigate(Route.SignIn) call with `popUpTo(Route.Home) { inclusive = true }`

  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/settings/SettingsScreenTest.kt
  TEST_FUNCTION: signOutTap_confirmsAndRoutesToSignIn

AC-4: Hamburger menu Composable hosts 5 entries with active highlight
  GIVEN: A composed HamburgerMenu Composable mounted with `activeRoute = Route.Settings`
  WHEN:  the menu is rendered in a Compose UI test
  THEN:  Five LSListRow nodes are visible tagged `menu-row-home`, `menu-row-saved-routes`, `menu-row-sessions`, `menu-row-offline`, `menu-row-settings`; the `menu-row-settings` row carries the `surface.role.agent.accent` background (asserted via SemanticsProperty `MenuRowActive=true`); other rows have MenuRowActive=false

  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/settings/HamburgerMenuTest.kt
  TEST_FUNCTION: hamburgerMenu_rendersFiveEntriesWithActiveHighlight

AC-5: Tap a menu entry routes correctly + dismisses drawer
  GIVEN: A composed SettingsRoute mounted with the HamburgerMenu open
  WHEN:  the rider taps `menu-row-saved-routes`
  THEN:  Within 300ms the drawer dismisses (DrawerState.isClosed=true) AND the test's NavController fake records a navigate(Route.SavedRoutes) call

  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/settings/SettingsScreenTest.kt
  TEST_FUNCTION: hamburgerMenu_tapRow_dismissesDrawerThenNavigates

AC-6: Storage row routes to Route.Offline (or shows disabled if not yet wired)
  GIVEN: A composed SettingsRoute mounted (Route.Offline is a placeholder route in Sprint 06; full implementation lands in Sprint 07)
  WHEN:  the rider taps the "Offline maps" LSListRow tagged `settings-storage-offline`
  THEN:  Either the test's NavController fake records a navigate(Route.Offline) call (if the route is registered) OR the row is rendered with `enabled=false` and a chevron is hidden — the test asserts ONE of these two states based on `BuildConfig.HAS_OFFLINE_ROUTE`; both states are acceptable for this sprint

  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/settings/SettingsScreenTest.kt
  TEST_FUNCTION: storageRow_routesToOfflineOrRendersDisabled

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

- TC-1 maps_to_ac=AC-1: observeCurrentUser emissions populate displayName + email + avatarInitials
- TC-2 maps_to_ac=AC-2: setThemeMode called once + state reflects new mode + LSListRow trailing label updates
- TC-3 maps_to_ac=AC-3: SignOutFlow.signOut() invoked exactly once and navigation event recorded
- TC-4 maps_to_ac=AC-4: HamburgerMenu renders 5 rows with active-item semantics property set
- TC-5 maps_to_ac=AC-5: Drawer dismisses before NavController.navigate fires
- TC-6 maps_to_ac=AC-6: Offline row gracefully degrades when Sprint 07 routes not yet registered

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/settings/SettingsScreen.kt (NEW — Composable: LSTopBar(hamburger leading, "Settings" title) + Account / Appearance / Storage / About sections + Sign out footer)
- android/app/src/main/java/com/laneshadow/ui/settings/SettingsRoute.kt (NEW — route entry; hiltViewModel + NavController + drawer host)
- android/app/src/main/java/com/laneshadow/ui/settings/SettingsViewModel.kt (NEW — @HiltViewModel + @Inject combining ConvexClientProvider.observeCurrentUser + AppStateRepository.appState)
- android/app/src/main/java/com/laneshadow/ui/settings/SettingsUiState.kt (NEW — sealed interface Loading/Loaded + AccountSummary + ThemeMode mirror)
- android/app/src/main/java/com/laneshadow/ui/components/HamburgerMenu.kt (NEW — reusable Composable hosting 5 menu rows with active-item highlight; semantics MenuRowActive boolean key)
- android/app/src/main/java/com/laneshadow/navigation/Route.kt (MODIFY — add `data object Offline : Route` placeholder for the menu entry; one-line rationale: Sprint 07 will wire the real OfflineRegionsListScreen, but the menu entry needs a target route now)
- android/app/src/main/java/com/laneshadow/navigation/MainNavGraph.kt (MODIFY — wire `composable<Route.Settings> { SettingsRoute(navController) }` replacing the placeholder HomeLeafRoute; add a temporary `composable<Route.Offline> { HomeLeafRoute(...) }` placeholder so the menu entry can resolve)
- android/app/src/main/res/values/strings.xml (MODIFY — add `settings_*` and `menu_*` strings)
- android/app/src/test/java/com/laneshadow/ui/settings/SettingsViewModelTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/settings/SettingsScreenTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/settings/HamburgerMenuTest.kt (NEW)

writeProhibited:
- android/app/src/main/java/com/laneshadow/services/ChatViewModel.kt — Sprint 04 input (read-only)
- android/app/src/main/java/com/laneshadow/services/RideFlowReducer.kt — Sprint 04 input (read-only)
- android/app/src/main/java/com/laneshadow/services/AppStateRepository.kt — Sprint 04 input; theme mutator already exists, no extension needed (read-only)
- android/app/src/main/java/com/laneshadow/services/SignOutFlow.kt — already exists (Sprint 03 + 04); read-only
- android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt — observeCurrentUser already exists; read-only
- android/app/src/main/java/com/laneshadow/ui/molecules/LSConfirmDialog.kt — V2 molecule untouched
- android/app/src/main/java/com/laneshadow/ui/molecules/LSBottomSheet.kt — V2 molecule untouched
- android/app/src/main/java/com/laneshadow/ui/molecules/LSListRow.kt — V2 molecule untouched
- android/app/src/main/java/com/laneshadow/ui/organisms/LSTopBar.kt — V2 organism untouched
- android/app/src/main/java/com/laneshadow/generated/** — generated by server/scripts/generate-mobile-types.ts
- android/app/src/debug/java/com/laneshadow/sandbox/** — sandbox stories stay golden
- Any iOS file under ios/**

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use `combine(observeCurrentUser, appState)` with `WhileSubscribed(5_000)`
- Apply theme via `LocalLaneShadowTheme` CompositionLocal — re-evaluation on themeMode change is automatic
- Use stringResource for every visible label (i18n + accessibility)
- Use `androidx.compose.material3.ModalNavigationDrawer` for the hamburger drawer host
- Use `LSConfirmDialog` molecule for the destructive Sign-out confirmation
- Inject `MainNavViewModel.signOut()` (already exists) — do NOT call SignOutFlow directly from this VM
- Map any user-facing error through ConvexErrorMapper

⚠️ Ask First:
- If the V2 token `surface.role.agent.accent` does not exist under that exact alias — escalate to design before substituting (current decision: use that token directly; if absent, request token-extension)
- Whether HamburgerMenu should be hoisted to a shared module ahead of Sprint 07's Idle/Planning integration (current decision: yes — extract from this task as the second consumer per Rule of 2)
- If `Route.Offline` should be `Offline.RegionsList` to match Sprint 07's planned hierarchy — leave as `Route.Offline` placeholder; Sprint 07 will refactor
- Whether the avatar initials helper should fall back to "?" for blank displayName (current decision: fall back to first letter of email; ask if blank email too)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- SettingsScreen.kt (Composable: LSTopBar + Account section (LSCard wrapping LSListRow with LSAvatar) + Appearance section (LSListRow opening LSBottomSheet picker with three rows) + Storage section (Offline maps LSListRow) + About section (Version / Terms / Privacy LSListRows) + LSDivider + LSButton(.destructive) sign-out + LSConfirmDialog)
- SettingsRoute.kt (Composable entry; hiltViewModel + NavController + ModalNavigationDrawer host)
- SettingsViewModel.kt (@HiltViewModel; combines observeCurrentUser + appState into Loaded state; exposes onThemeChange + onSignOutConfirmed)
- SettingsUiState.kt (sealed interface UiState + AccountSummary)
- HamburgerMenu.kt (reusable Composable; activeRoute parameter; LSListRow per entry; emits onSelect(Route))
- Route.kt (MODIFY): add `data object Offline : Route` placeholder
- MainNavGraph.kt (MODIFY): wire Route.Settings → SettingsRoute and Route.Offline → placeholder
- strings.xml (MODIFY): settings_* + menu_* strings
- SettingsViewModelTest.kt (RED → GREEN per AC-1, 2)
- SettingsScreenTest.kt (Compose UI test for AC-3, 5, 6)
- HamburgerMenuTest.kt (Compose UI test for AC-4)

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

1. RED — Write SettingsViewModelTest covering AC-1, 2 with FakeConvexClientProvider + FakeAppStateRepository; verify failures
2. GREEN — Add SettingsUiState + SettingsViewModel using combine + collect; iterate until tests pass
3. RED — Write HamburgerMenuTest for AC-4 verifying 5 rows + active highlight semantics property
4. GREEN — Build HamburgerMenu Composable with active-item semantics; tests pass
5. RED — Write SettingsScreenTest for AC-3, 5, 6 with hiltAndroidRule + a fake NavController + a fake SignOutFlow module
6. GREEN — Build SettingsScreen + SettingsRoute composing v2 atoms/molecules; modify Route.kt + MainNavGraph.kt; verify tests pass
7. REFACTOR — Ensure HamburgerMenu is the single source for menu UI (no duplication); ensure no hardcoded color/string literals; run detekt + tokens:native-compliance + snapshots:check

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v3-integration/architecture/ui-design.md [PRIMARY PATTERN]
   - Lines: 229-267 + 627-653
   - Focus: § 1.F SettingsScreen composition (Account / Appearance / Storage / About + Sign out footer) + § 5 Extended LSSessionsDrawer IA hamburger menu

2. .spec/prds/v3-integration/09-uc-app.md
   - Lines: 19-89
   - Focus: UC-APP-01 Settings + UC-APP-04 hamburger menu acceptance criteria (5 entries with active-item highlight)

3. .spec/prds/v3-integration/architecture/android-architecture.md
   - Lines: 596-625 + 932-948
   - Focus: § 4.5 SettingsViewModel pattern + § 7.5 SettingsScreen signature

4. android/app/src/main/java/com/laneshadow/services/AppStateRepository.kt
   - Lines: 1-153
   - Focus: existing setThemeMode + appState Flow surface — VM consumes these directly

5. android/app/src/main/java/com/laneshadow/navigation/MainNavGraph.kt
   - Lines: 1-300
   - Focus: existing MainNavViewModel + signOutFlow events wiring; pattern for adding new Route.Settings + Route.Offline composables

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence — TDD_STATE history per AC (commit references each AC's first failing test)
Gate 2: All tests pass — `cd android && ./gradlew test` (Exit 0)
Gate 3: Per-AC verification —
  - `cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.settings.SettingsViewModelTest.{state_observeCurrentUser_populatesAccountSection,onThemeChange_persistsViaDataStoreAndUpdatesState}"`
  - `cd android && ./gradlew :app:connectedDebugAndroidTest --tests "com.laneshadow.ui.settings.SettingsScreenTest.{signOutTap_confirmsAndRoutesToSignIn,hamburgerMenu_tapRow_dismissesDrawerThenNavigates,storageRow_routesToOfflineOrRendersDisabled}"`
  - `cd android && ./gradlew :app:connectedDebugAndroidTest --tests "com.laneshadow.ui.settings.HamburgerMenuTest.hamburgerMenu_rendersFiveEntriesWithActiveHighlight"`
Gate 4: Type check — `cd android && ./gradlew :app:compileDebugKotlin` (Exit 0)
Gate 5: Static analysis — `cd android && ./gradlew detekt` (Exit 0)
Gate 6: Token compliance — `scripts/tokens/enforce-native-compliance.sh` (Exit 0)
Gate 7: Sandbox snapshots untouched — `pnpm snapshots:check` (Exit 0)
Gate 8: Scope compliance — `git diff --name-only` ⊆ writeAllowed

--------------------------------------------------------------------------------
REVIEW
--------------------------------------------------------------------------------

Must pass:
- Theme persistence routes through AppStateRepository.setThemeMode (single DataStore source)
- Theme change applies immediately via LocalLaneShadowTheme without app restart
- Sign-out confirmation uses LSConfirmDialog destructive variant; cancellation does NOT trigger signOut
- HamburgerMenu hosts exactly 5 entries with active-item highlight via surface.role.agent.accent
- Drawer dismissal precedes navigation
- Zero hardcoded color literals
- All user strings via stringResource

Should verify:
- TalkBack reads Theme row as "Theme, current mode {mode}"; theme picker rows announced as radio buttons with checked state
- Sign out button announces "Sign out, returns to sign-in screen"
- Active menu entry announces "Settings, current screen"
- Screen survives configuration change without losing the open drawer + theme picker state
- Avatar initials helper handles edge cases (empty displayName → fall back to email letter; both blank → "?")

Verdict: PENDING

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: AUTH-S03-T06 (ClerkAuth — sign-out flow + SignOutFlow.kt + SignInScreen target route), SESS-S06-T08 (SessionsScreen drawer integrates with the same hamburger menu pattern; this task extracts the reusable HamburgerMenu Composable as the second consumer per Rule of 2)
Blocks: Sprint 07 (Offline Regions menu entry — this task wires the placeholder Route.Offline so Sprint 07 can land the real screen)
Paired with: APP-S06-T09 (iOS SettingsScreen — share UC-APP-01 + UC-APP-04 ACs)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "APP-S06-T10",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN observeCurrentUser emission WHEN state collected THEN account section populated with displayName, email, avatar initials", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.settings.SettingsViewModelTest.state_observeCurrentUser_populatesAccountSection", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN theme change WHEN onThemeChange invoked THEN AppStateRepository.setThemeMode called and state reflects new mode", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.settings.SettingsViewModelTest.onThemeChange_persistsViaDataStoreAndUpdatesState", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN sign-out tap WHEN confirmed THEN SignOutFlow.signOut called and navigation to SignIn recorded", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.settings.SettingsScreenTest.signOutTap_confirmsAndRoutesToSignIn", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN HamburgerMenu mounted WHEN rendered THEN 5 entries visible with active-item highlight semantics property", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.settings.HamburgerMenuTest.hamburgerMenu_rendersFiveEntriesWithActiveHighlight", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN menu open WHEN rider taps row THEN drawer dismisses and NavController.navigate is recorded", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.settings.SettingsScreenTest.hamburgerMenu_tapRow_dismissesDrawerThenNavigates", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN Storage row WHEN tapped THEN navigates to Route.Offline or renders disabled if route not yet registered", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.settings.SettingsScreenTest.storageRow_routesToOfflineOrRendersDisabled", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "observeCurrentUser emissions populate displayName + email + avatarInitials", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.settings.SettingsViewModelTest.state_observeCurrentUser_populatesAccountSection", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "setThemeMode called once + state reflects new mode + LSListRow trailing label updates", "maps_to_ac": "AC-2", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.settings.SettingsViewModelTest.onThemeChange_persistsViaDataStoreAndUpdatesState", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "SignOutFlow.signOut() invoked exactly once and navigation event recorded", "maps_to_ac": "AC-3", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.settings.SettingsScreenTest.signOutTap_confirmsAndRoutesToSignIn", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "HamburgerMenu renders 5 rows with active-item semantics property set", "maps_to_ac": "AC-4", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.settings.HamburgerMenuTest.hamburgerMenu_rendersFiveEntriesWithActiveHighlight", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "Drawer dismisses before NavController.navigate fires", "maps_to_ac": "AC-5", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.settings.SettingsScreenTest.hamburgerMenu_tapRow_dismissesDrawerThenNavigates", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test_criterion", "description": "Offline row gracefully degrades when Sprint 07 routes not yet registered", "maps_to_ac": "AC-6", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.settings.SettingsScreenTest.storageRow_routesToOfflineOrRendersDisabled", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
