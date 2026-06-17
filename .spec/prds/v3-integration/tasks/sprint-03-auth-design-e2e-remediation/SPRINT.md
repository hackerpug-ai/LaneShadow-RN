# Sprint 03 Remediation: Auth Design Fidelity, Component Gaps, and Real E2E

**Sequence:** 3R
**Timeline:** Phase 2 remediation before Sprint 04
**Status:** Planned
**Generated:** 2026-04-30

## Overview

This remediation sprint covers the missing work found after Sprint 03: the auth UI did not match the authoritative design at `.spec/design/system/views/auth/auth-screen.html`, the iOS tests mostly rendered views without exercising the human test steps, and Clerk/Convex login success was not proven end to end.

The work is deliberately split into native component primitives, full view fidelity, auth integration, and evidence automation. Sprint 04 remains blocked until these tasks are complete because every downstream planning flow depends on an authenticated rider and a visually correct auth gate.

## Missing Work Inventory

The native auth flow is missing or under-specifies these component and behavior contracts:

- Auth-specific atom support: `LSIcon` glyphs for compass, chevron-left, mail, lock, eye, sparkle, and check; labeled `LSDivider`; small `LSSpinner` variant that can render inside a primary button; `LSTextField`/`LSFormField` leading and trailing icon slots, helper text, error state, disabled state, and secure password reveal.
- Auth-specific molecule support: Apple and Google `LSAuthProviderButton`/social button parity with the HTML `mol-social-btn` recipe, full-width provider stack, brand glyphs, disabled/focused/pressed states, and cross-platform sandbox story IDs.
- Auth view support: a single email-first AuthScreen with S01 email entry, S02 existing-user password, S03 new-user create account, S04 dark, V01 invalid email, and V02 submitting/loading variants. Separate generic SignIn/SignUp pages are not sufficient.
- Clerk/Convex integration: successful email, OAuth, and sign-up paths must update shared auth state, bind Clerk JWT into Convex `setAuth`, wait for `db.users.getCurrentUser`, route to IdleScreen with the real rider name, restore after cold start, and sign out cleanly.
- Human evidence: tests must drive the same steps a reviewer would perform. Snapshot/view render tests support the gate but do not replace real-device XCTest evidence for auth, Convex, restore, and unauthenticated-error handling.

## Human Testing Gate

**Gate:** A reviewer can run the remediation evidence suite and see both native platforms render AuthScreen variants matching `.spec/design/system/views/auth/auth-screen.html`, then complete a real Clerk-backed login that binds Convex auth and lands on IdleScreen with the rider name from `db.users.getCurrentUser`.

## Human Test Deliverable

**Test Steps:**
1. Open the iOS and Android sandbox catalogs and confirm these story IDs exist with light/dark PNG baselines: `molecules.auth-provider-button.apple`, `molecules.auth-provider-button.google`, `templates.auth-screen.email-entry`, `templates.auth-screen.existing-user`, `templates.auth-screen.new-user`, `templates.auth-screen.invalid-email`, `templates.auth-screen.submitting`, and `templates.auth-screen.dark`.
2. Compare native AuthScreen screenshots against `.spec/design/system/views/auth/auth-screen.html` and confirm the paper contour background, scrim, back glass chip, brand mark, Newsreader headline, social buttons, divider, field rows, primary CTA, legal footer, error state, and loading spinner all match the design.
3. On a real iOS device through native XCUITest, launch with a clean auth state and sign in with a Clerk test email/password account.
4. Confirm the iOS app routes to IdleScreen only after Convex auth is bound and `db.users.getCurrentUser` returns the rider's real display name.
5. Kill and relaunch the iOS app; confirm the session restores from secure storage and the IdleScreen greeting still includes the Convex user name.
6. Sign out through Settings on iOS; confirm Clerk tokens, Convex auth, persisted route/session state, and local auth route state clear and the app returns to AuthScreen.
7. Run the Android auth integration and instrumentation/manual evidence flow; confirm Google OAuth/email login, Convex binding, restore, and sign-out evidence is PASS or honestly MANUAL/BLOCKED with exact witness instructions.
8. Trigger or simulate a Convex `UNAUTHENTICATED` response on each platform; confirm the app redirects to AuthScreen and records evidence.

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| AUTH-S03-R01 | Missing auth component inventory and cross-platform story contract | swift-planner + kotlin-planner | 90 min |
| AUTH-S03-R02 | iOS auth atoms and social-button molecule parity | swift-implementer | 240 min |
| AUTH-S03-R03 | Android auth atoms and social-button molecule parity | kotlin-implementer | 240 min |
| AUTH-S03-R04 | iOS AuthScreen view fidelity and sandbox variants | swift-implementer | 360 min |
| AUTH-S03-R05 | Android AuthScreen view fidelity and sandbox variants | kotlin-implementer | 360 min |
| AUTH-S03-R06 | iOS Clerk-to-Convex login integration and routing proof | swift-implementer | 300 min |
| AUTH-S03-R07 | Android Clerk-to-Convex login integration and routing proof | kotlin-implementer | 300 min |
| AUTH-S03-R08 | Real human-step E2E evidence gate for auth remediation | swift-implementer + kotlin-implementer | 300 min |
| AUTH-S03-R09 | Fix Android E2E login flow — add missing "Continue with Email" navigation step | kotlin-implementer | 60 min |
| AUTH-S03-R10 | Fix iOS E2E registration flow — verify sign-up entry navigation after redesign | swift-implementer | 60 min |

## Source Coverage

- `.spec/design/system/views/auth/auth-screen.html`
- `.spec/design/system/views/auth/README.md`
- `.spec/design/system/molecules/social-button/README.md`
- `.spec/prds/v3-integration/04-uc-auth.md`
- `.spec/prds/v3-integration/tasks/sprint-03-auth-convex-foundation/SPRINT.md`
- `RULES.md` Real Device E2E Testing and Cross-Platform Component Parity
- `docs/REAL_DEVICE_E2E.md`
- `ios/LaneShadow/Features/Auth/**`
- `android/app/src/main/java/com/laneshadow/ui/auth/**`
- `convex/db/users.ts`

## Blocks

- Blocks: Sprint 04 Conversational Planning Loop
- Dependent on: Sprint 03 Auth & Convex Foundation

## Task Detail Files

Generated by /kb-sprint-tasks-plan on 2026-04-30 (updated 2026-05-01)

- [AUTH-S03-R01-missing-auth-component-inventory.md](AUTH-S03-R01-missing-auth-component-inventory.md)
- [AUTH-S03-R02-ios-auth-primitives.md](AUTH-S03-R02-ios-auth-primitives.md)
- [AUTH-S03-R03-android-auth-primitives.md](AUTH-S03-R03-android-auth-primitives.md)
- [AUTH-S03-R04-ios-auth-screen-fidelity.md](AUTH-S03-R04-ios-auth-screen-fidelity.md)
- [AUTH-S03-R05-android-auth-screen-fidelity.md](AUTH-S03-R05-android-auth-screen-fidelity.md)
- [AUTH-S03-R06-ios-clerk-convex-login-integration.md](AUTH-S03-R06-ios-clerk-convex-login-integration.md)
- [AUTH-S03-R07-android-clerk-convex-login-integration.md](AUTH-S03-R07-android-clerk-convex-login-integration.md)
- [AUTH-S03-R08-auth-human-e2e-evidence.md](AUTH-S03-R08-auth-human-e2e-evidence.md)
- [AUTH-S03-R09-android-e2e-missing-email-entry-step.md](AUTH-S03-R09-android-e2e-missing-email-entry-step.md)
- [AUTH-S03-R10-ios-e2e-registration-navigation-harden.md](AUTH-S03-R10-ios-e2e-registration-navigation-harden.md)
