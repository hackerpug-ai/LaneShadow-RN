# AUTH-S03-R01 Component Contract

Generated: 2026-04-30

This is the missing-work inventory for the Sprint 03 auth remediation cycle. It converts the design source at `.spec/design/system/views/auth-screen/auth-screen.html` into native implementation and evidence obligations.

## Missing Or Insufficient Native Components

| Design Layer | Native Contract | iOS Scope | Android Scope | Story IDs |
|---|---|---|---|---|
| `ls-icon` | Auth glyph coverage: compass, chevron-left, mail, lock, eye, sparkle, check | `LSIcon` or established adapter must expose every glyph | `LSIcon` or established adapter must expose every glyph | `atoms.icon.auth-glyphs` |
| `ls-divider.with-label` | Centered "OR CONTINUE WITH EMAIL" separator | `LSDivider` must support label variant and snapshot | `LSDivider` must support label variant and snapshot | `atoms.divider.with-label` |
| `ls-spinner.sp-sm` | Small spinner that can sit inside copper primary CTA | `LSSpinner` small/on-signal variant | `LSSpinner` small/on-signal variant | `atoms.spinner.on-signal-sm` |
| `ls-input` | Email/password input states | `LSTextField` supports default, focused, error, disabled, secure | `LSTextField` supports default, focused, error, disabled, secure | `atoms.textfield.auth-email`, `atoms.textfield.auth-password`, `atoms.textfield.auth-error` |
| `mol-form-field` | Label, helper/error, leading/trailing icon slots | `LSFormField` uses text field atom and icon slots | `LSFormField` uses text field atom and icon slots | `molecules.formfield.auth-default`, `molecules.formfield.auth-error`, `molecules.formfield.auth-password` |
| `mol-social-btn` | Apple/Google provider buttons | `LSAuthProviderButton` matches Apple/Google recipe | `LSAuthProviderButton` matches Apple/Google recipe | `molecules.auth-provider-button.apple`, `molecules.auth-provider-button.google` |
| Auth card/brand block | Brand mark, wordmark, headline, subhead, footer | AuthScreen composition, not a standalone primitive unless reused | AuthScreen composition, not a standalone primitive unless reused | Covered by template stories |
| `AuthScreen` view | Email-first branching screen | `AuthScreen` replaces generic SignIn/SignUp presentation | `AuthScreen` replaces generic SignIn/SignUp presentation | `templates.auth-screen.*` |

## Required Template Story IDs

Both iOS and Android must register these exact IDs:

- `templates.auth-screen.email-entry`
- `templates.auth-screen.existing-user`
- `templates.auth-screen.new-user`
- `templates.auth-screen.invalid-email`
- `templates.auth-screen.submitting`
- `templates.auth-screen.dark`

Both iOS and Android must also register:

- `molecules.auth-provider-button.apple`
- `molecules.auth-provider-button.google`
- `molecules.formfield.auth-default`
- `molecules.formfield.auth-error`
- `molecules.formfield.auth-password`
- `atoms.divider.with-label`
- `atoms.spinner.on-signal-sm`
- `atoms.icon.auth-glyphs`

## Design References By Task

- R02 iOS primitives: `.spec/design/system/molecules/social-button/README.md`, `.spec/design/system/views/auth-screen/README.md`
- R03 Android primitives: `.spec/design/system/molecules/social-button/README.md`, `.spec/design/system/views/auth-screen/README.md`
- R04 iOS view: `.spec/design/system/views/auth-screen/auth-screen.html`
- R05 Android view: `.spec/design/system/views/auth-screen/auth-screen.html`
- R06 iOS integration: `.spec/prds/v3-integration/04-uc-auth.md`, `server/convex/db/users.ts`
- R07 Android integration: `.spec/prds/v3-integration/04-uc-auth.md`, `server/convex/db/users.ts`
- R08 E2E evidence: `RULES.md`, `docs/REAL_DEVICE_E2E.md`, `.spec/design/system/views/auth-screen/auth-screen.html`

## Evidence Gaps

Current view-model and render tests are support-only. They can prove local state transitions and that views instantiate, but they do not prove the human test gate. The remediation cycle must add:

- Screenshot evidence for every AuthScreen template variant on both platforms.
- `pnpm snapshots:check` and `pnpm snapshots:parity-coverage` results after auth story capture.
- iOS WDA evidence for real-device auth flow, restore, sign-out, Convex current-user greeting, and `UNAUTHENTICATED` redirect.
- Android instrumentation or physical-device manual/BLOCKED evidence for Google/email auth, restore, sign-out, Convex current-user greeting, and `UNAUTHENTICATED` redirect.
- Manual witness instructions for Clerk dashboard token revocation and Convex dashboard observations when not machine-observable.

## Verification Commands

- iOS build: `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' build`
- iOS auth tests: `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/AuthScreensTests`
- Android compile: `cd android && ./gradlew :app:compileDebugKotlin`
- Android auth tests: `cd android && ./gradlew :app:testDebugUnitTest --tests '*Auth*'`
- Snapshot manifest: `pnpm snapshots:check`
- Snapshot parity: `pnpm snapshots:parity-coverage`
- iOS WDA evidence: `LANESHADOW_BUNDLE_ID=com.laneshadow.app node ios/E2E/sprint-03-auth-remediation.js`
