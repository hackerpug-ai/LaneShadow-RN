# AUTH-S03-R01 Component Contract

Generated: 2026-04-29

This document is the authoritative native auth gap inventory for Sprint 03 remediation. It treats `.spec/design/system/views/auth-screen/auth-screen.html` as the source of truth, then maps each design class and state to the current iOS and Android files, the required shared sandbox story IDs, and the evidence obligations for AUTH-S03-R02 through AUTH-S03-R08.

## Progress Tracking

- [x] Codebase investigation complete
- [x] Design source reviewed (`auth-screen.html`, `auth-screen/README.md`, `social-button/README.md`)
- [x] iOS/Android auth file inventory captured
- [x] Cross-platform story contract defined
- [x] Weak-test audit captured
- [x] Contract ready for R02-R08 execution

## Authoritative Inputs

**Design source**
- `.spec/design/system/views/auth-screen/auth-screen.html`
- `.spec/design/system/views/auth-screen/README.md`
- `.spec/design/system/molecules/social-button/README.md`

**Project rules**
- `RULES.md` Cross-Platform Component Parity
- `RULES.md` Real Device E2E Testing
- `docs/REAL_DEVICE_E2E.md`

**Planner references**
- `/Users/justinrich/Projects/brain/docs/mobile-architecture/ios-principles.md`
- `/Users/justinrich/Projects/brain/docs/mobile-architecture/testing-strategy.md`
- `/Users/justinrich/Projects/brain/docs/mobile-architecture/performance-optimization.md`

**Current native auth files inspected**
- iOS: `ios/LaneShadow/Features/Auth/SignInScreen.swift`, `ios/LaneShadow/Features/Auth/SignUpScreen.swift`, `ios/LaneShadow/Features/Auth/ViewModels/SignInViewModel.swift`, `ios/LaneShadow/DesignSystem/Molecules/LSAuthProviderButton.swift`, `ios/LaneShadow/Views/Atoms/LSIcon.swift`, `ios/LaneShadow/Views/Atoms/LSDivider.swift`, `ios/LaneShadow/Views/Atoms/LSSpinner.swift`, `ios/LaneShadow/Views/Molecules/LSFormField.swift`
- Android: `android/app/src/main/java/com/laneshadow/ui/auth/SignInScreen.kt`, `android/app/src/main/java/com/laneshadow/ui/auth/SignUpScreen.kt`, `android/app/src/main/java/com/laneshadow/ui/auth/viewmodels/SignInViewModel.kt`, `android/app/src/main/java/com/laneshadow/ui/components/LSAuthProviderButton.kt`, `android/app/src/main/java/com/laneshadow/ui/atoms/LSIcon.kt`, `android/app/src/main/java/com/laneshadow/ui/atoms/LSDivider.kt`, `android/app/src/main/java/com/laneshadow/ui/atoms/LSSpinner.kt`, `android/app/src/main/java/com/laneshadow/ui/molecules/LSFormField.kt`

## Investigation Summary

1. The native apps do not currently implement the design-owned single `AuthScreen` recipe. Both platforms still center the flow around separate `SignInScreen` and `SignUpScreen` shells, while the HTML source requires one email-first branching screen with S01, S02, S03, S04, V01, and V02 states.
2. Several auth primitives already exist, but they are insufficient for the AuthScreen recipe:
   - iOS `LSAuthProviderButton` uses generic `LSButton.secondary` plus `star`/`circle`, not Apple/Google brand marks or the provider recipes from `social-button/README.md`.
   - Android `LSAuthProviderButton` also wraps generic `LSButton` and intentionally omits provider marks.
   - `LSDivider` on both platforms is a plain rule only; there is no labeled `OR CONTINUE WITH EMAIL` variant.
   - `LSSpinner` exists on both platforms, but the contract-required small on-signal CTA overlay variant is not called out in stories.
   - `LSFormField` exists on both platforms, but the current APIs only cover a subset of the required auth states. The recipe still lacks the documented label/helper/icon/trailing-eye matrix.
3. The sandbox registries and parity manifests currently contain no auth-specific story IDs:
   - iOS `TemplateStories` and `MoleculesStories` do not register any `templates.auth-screen.*` or `molecules.auth-provider-button.*` stories.
   - Android `TemplateStories` and `MoleculesStories` do not register any auth story IDs either.
   - `tokens/sandbox/snapshots.parity.json` contains no auth entries today.
4. Existing tests are support-only. They prove view-model state transitions, limited Compose interactions, or route/source structure, but they do not prove design fidelity, snapshot parity, or the real-device human gate.

## Missing / Insufficient Native Component Inventory

| Design contract | Canonical shared story IDs | iOS current state | Android current state | Remediation owner |
|---|---|---|---|---|
| `ls-btn` primary CTA, ghost links, provider host button | Reuse existing `atoms.button.primary`, `atoms.button.ghost`, `atoms.button.secondary`; no auth-only button ID | `SignInScreen.swift` and `SignUpScreen.swift` already use `LSButton`, but not in the design-owned hierarchy and not with the AuthScreen copy/layout | `SignInScreen.kt` and `SignUpScreen.kt` already use `LSButton`, but not in the design-owned hierarchy and not with the AuthScreen copy/layout | R04, R05 |
| `ls-input` email/password rows | Reuse existing `atoms.textfield.default`, `atoms.textfield.focused`, `atoms.textfield.error`, `atoms.textfield.disabled`; add molecule stories below for auth composition | `LSFormField.swift` currently exposes label + `LSTextField` + error only. `SignInScreen.swift` falls back to direct `LSTextField` and `AuthSecureTextEntry`, so the auth recipe is split across screen-local code | `LSFormField.kt` covers label + text field + error, but auth-specific leading/trailing icon and helper patterns are still screen-local or absent | R02, R03 |
| `ls-divider.with-label` | `atoms.divider.with-label` | `ios/LaneShadow/Views/Atoms/LSDivider.swift` renders an unlabeled rule only; no centered label variant, no auth story | `android/app/src/main/java/com/laneshadow/ui/atoms/LSDivider.kt` renders horizontal/vertical rules only; no label variant, no auth story | R02, R03 |
| `ls-icon` auth glyph set: compass, chevron-left, mail, lock, eye, sparkle, check | `atoms.icon.auth-glyphs` | `LSIcon.swift` already covers `compass`, `chevL`, `sparkle`, but the inspected enum does not expose `mail`, `lock`, `eye`, or `check` through the same native `LSIcon` catalog | `LSIcon.kt` already covers `Compass`, `ChevL`, `Sparkle`, but the inspected generated icon catalog does not expose the full auth glyph set through the same `LSIcon` surface | R02, R03 |
| `ls-spinner.sp-sm` inside copper CTA | `atoms.spinner.on-signal-sm` | `LSSpinner.swift` exists, but the contract does not yet define or story a small white-on-signal loading treatment for V02 | `LSSpinner.kt` exists, but the contract does not yet define or story a small on-signal CTA treatment for V02 | R02, R03 |
| `ls-card` auth card shell | Covered by `templates.auth-screen.*`; do not introduce a platform-only auth-card story | `ios/LaneShadow/Views/Molecules/AuthCard.swift` exists, but it is RN-era and not the design-owned card shell. It uses hardcoded sizing/fonts and is not used by the current auth screens | No AuthScreen-specific card shell is wired into the current auth flow. The current screens are simple `Column` compositions without the designed paper/scrim/card stack | R04, R05 |
| `mol-form-field` label + helper/error + icon slots + secure toggle | `molecules.formfield.auth-default`, `molecules.formfield.auth-error`, `molecules.formfield.auth-password` | `LSFormField.swift` lacks helper text, leading icon, trailing eye-toggle slot, and explicit disabled/password recipes required by AuthScreen S02/S03/V01/V02 | `LSFormField.kt` lacks the same auth recipe coverage and does not yet prove the helper + icon + secure-toggle matrix in sandbox stories | R02, R03 |
| `mol-social-btn` Apple / Google | `molecules.auth-provider-button.apple`, `molecules.auth-provider-button.google` | `LSAuthProviderButton.swift` exists, but uses generic icons (`star`, `circle`), no provider brand mark, no Apple/Google surface recipe, no shared auth story IDs | `LSAuthProviderButton.kt` exists, but intentionally omits provider marks and only wraps generic `LSButton`; no shared auth story IDs | R02, R03 |
| `AuthScreen` template: S01 email entry, S02 existing user, S03 new user, S04 dark, V01 invalid email, V02 submitting | `templates.auth-screen.email-entry`, `templates.auth-screen.existing-user`, `templates.auth-screen.new-user`, `templates.auth-screen.invalid-email`, `templates.auth-screen.submitting`, `templates.auth-screen.dark` | `SignInScreen.swift` and `SignUpScreen.swift` are separate shells. There is no single branching `AuthScreen`, no template stories, and no snapshot parity evidence for the six design states | `SignInScreen.kt` and `SignUpScreen.kt` are separate shells. There is no single branching `AuthScreen`, no template stories, and no snapshot parity evidence for the six design states | R04, R05 |

## Canonical Cross-Platform Story Contract

These IDs are the auth parity contract. Both iOS and Android must register the exact same strings, and none of them may be added to `tokens/sandbox/parity-exemptions.json`.

### Atom IDs

- `atoms.icon.auth-glyphs`
- `atoms.divider.with-label`
- `atoms.spinner.on-signal-sm`

### Molecule IDs

- `molecules.formfield.auth-default`
- `molecules.formfield.auth-error`
- `molecules.formfield.auth-password`
- `molecules.auth-provider-button.apple`
- `molecules.auth-provider-button.google`

### Template IDs

- `templates.auth-screen.email-entry`
- `templates.auth-screen.existing-user`
- `templates.auth-screen.new-user`
- `templates.auth-screen.invalid-email`
- `templates.auth-screen.submitting`
- `templates.auth-screen.dark`

### Registry / manifest requirements

1. Register every ID above in both platform sandbox registries:
   - iOS: `ios/LaneShadow/Sandbox/Stories/**`
   - Android: `android/app/src/debug/java/com/laneshadow/sandbox/stories/**`
2. Ensure `pnpm snapshots:check` and `pnpm snapshots:parity-coverage` add the same IDs to the shared pool in `tokens/sandbox/snapshots.parity.json`.
3. Do not create auth-only parity exemptions. If a platform cannot ship one of the IDs, the task is incomplete rather than exempt.

## Design References Threaded To Tasks

| Task | Scope locked by this contract | Design references | Expected evidence / output |
|---|---|---|---|
| R02 | iOS auth primitives only | `.spec/design/system/molecules/social-button/README.md`, `.spec/design/system/views/auth-screen/README.md`, `ios-principles.md`, `performance-optimization.md` | New or updated iOS atom/molecule stories for the auth IDs above, snapshot baselines, no screen-shell work |
| R03 | Android auth primitives only | `.spec/design/system/molecules/social-button/README.md`, `.spec/design/system/views/auth-screen/README.md` | New or updated Android atom/molecule stories for the auth IDs above, snapshot baselines, no screen-shell work |
| R04 | iOS full AuthScreen fidelity | `.spec/design/system/views/auth-screen/auth-screen.html`, `.spec/design/system/views/auth-screen/README.md`, `ios-principles.md`, `testing-strategy.md`, `performance-optimization.md` | One SwiftUI AuthScreen recipe that renders all six template IDs and uses shared primitives instead of screen-local substitutes |
| R05 | Android full AuthScreen fidelity | `.spec/design/system/views/auth-screen/auth-screen.html`, `.spec/design/system/views/auth-screen/README.md` | One Compose AuthScreen recipe that renders all six template IDs and uses shared primitives instead of screen-local substitutes |
| R06 | iOS Clerk + Convex integration | `.spec/prds/v3-integration/04-uc-auth.md`, `.spec/design/system/views/auth-screen/auth-screen.html`, `testing-strategy.md` | Auth success updates shared app auth state, Convex JWT binding, current-user wait, restore, sign-out, `UNAUTHENTICATED` redirect |
| R07 | Android Clerk + Convex integration | `.spec/prds/v3-integration/04-uc-auth.md`, `.spec/design/system/views/auth-screen/auth-screen.html` | Same proof as R06 on Android, using shared auth/navigation state rather than local screen state |
| R08 | Human-step evidence gate | `RULES.md`, `docs/REAL_DEVICE_E2E.md`, `.spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/SPRINT.md`, `.spec/design/system/views/auth-screen/auth-screen.html` | Machine-readable evidence covering every remediation step, screenshot/source dumps, honest PASS/FAIL/BLOCKED/MANUAL statuses |

## Existing Weak Tests And Evidence Gaps

| File | Current value | Why it is support-only | Required follow-up |
|---|---|---|---|
| `ios/LaneShadowTests/Integration/AuthScreensTests.swift` | Validates callback routing, password visibility state, image fallback, and `SignInViewModel` / `SignUpViewModel` transitions | It does not prove AuthScreen anatomy, template parity, Convex current-user wait, sign-out, or any human test step. It is a unit/integration support layer only | R04 adds visual/template proof, R06 adds auth-routing integration proof, R08 adds WDA/human evidence |
| `android/app/src/test/java/com/laneshadow/ui/auth/AuthScreensSourceStructureTest.kt` | Exercises simplified Compose sign-in/sign-up states and one static `AuthNavGraph` source assertion | It does not prove the design recipe, shared story IDs, snapshot parity, provider-brand fidelity, restore/sign-out, or real-device auth behavior. It is support-only and partially source-inspection-based | R05 adds AuthScreen fidelity proof, R07 adds integration proof, R08 adds honest human/device evidence |
| `ios/E2E/results/sprint-03-auth.json` | Existing auth evidence harness already records FAIL/BLOCKED/MANUAL states | The current schema is still Sprint-03 auth-foundation oriented (`S03.1`...`S03.8`) and the latest run on 2026-04-29 failed at WDA readiness (`fetch failed`) before auth could be exercised | R08 must emit remediation-step IDs, refresh the evidence schema, and keep Android/dashboard-only steps MANUAL or BLOCKED when automation cannot prove them |

## Human Gate Requirements For R08

1. The evidence artifact must cover the remediation sprint human steps, not only unit or snapshot checks.
2. iOS PASS states for auth flow require WDA-backed device evidence per `docs/REAL_DEVICE_E2E.md`.
3. Android steps may be PASS only from emulator/device or instrumentation artifacts. Otherwise they must be `MANUAL` or `BLOCKED` with exact instructions.
4. Visual fidelity PASS states must cite:
   - `.spec/design/system/views/auth-screen/auth-screen.html`
   - the canonical story IDs from this contract
   - the produced native screenshots or snapshot PNGs
5. External-system proof that automation cannot see directly must stay explicit:
   - Convex current-user verification: `db.users.getCurrentUser`
   - Clerk dashboard token revocation for `UNAUTHENTICATED`
   - Any Android-only physical-device witness

## Planner Notes For Implementers

### iOS

- Follow `/Users/justinrich/Projects/brain/docs/mobile-architecture/ios-principles.md`: prefer SwiftUI-native state and only use `@Observable` where auth state is genuinely shared across the screen or app environment.
- Follow `/Users/justinrich/Projects/brain/docs/mobile-architecture/performance-optimization.md`: keep AuthScreen template variants compositional so the background shell, provider stack, and form branches can be snapshotted without making one oversized observed view body.
- Follow `/Users/justinrich/Projects/brain/docs/mobile-architecture/testing-strategy.md`: each auth acceptance criterion needs failing-then-passing evidence, but render-only tests do not satisfy the human gate.

### Android

- Preserve the same story IDs as iOS; do not introduce camelCase or platform-only aliases.
- Keep provider branding isolated to the social-button molecule instead of smuggling it through generic `LSButton` styling.
- Prefer behavior or semantics assertions over file-text grep when adding new coverage, except where the downstream task explicitly requires source-structure proof.

## Verification Commands To Carry Forward

- `test -f .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md`
- `rg "LSIcon|LSDivider|LSSpinner|LSAuthProviderButton|AuthScreen" .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md`
- `rg "molecules.auth-provider-button.apple|templates.auth-screen.email-entry|templates.auth-screen.dark" .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md`
- `rg ".spec/design/system/views/auth-screen/auth-screen.html|molecules/social-button/README.md" .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md`
- `rg "support-only|WDA|human test" .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md`
- `pnpm snapshots:check`
- `pnpm snapshots:parity-coverage`

