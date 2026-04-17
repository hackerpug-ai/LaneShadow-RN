# Sprint 9: Gatekeeper and Platform Polish

**Sequence:** 9
**Status:** Planned

## Overview

Finish the commercial and platform-critical edges by wiring Sprint-2 atoms/molecules and onboarding screens into trial counts, paywall logic, purchases, restores, onboarding, permissions, deep linking, notifications, and settings polish. UI components are already built; this sprint wires them to commerce SDKs, gate state, and navigation.

## Human Testing Gate

**Gate:** A free rider can exhaust trials, trigger the paywall, complete a purchase with verification, restore access on a fresh install, and confirm subscription state flows through settings — validated by paywall triggering, purchase verification, and restore flows rather than UI rendering.

## Human Test Deliverable

The apps feel release-shaped from an account, billing, onboarding, and lifecycle perspective rather than just feature-complete.

## Human Test Steps

1. Launch as a new free user and confirm onboarding screens (`WelcomeScreen`, `SetupRequiredScreen`, `DownloadProgressScreen`, `CompletionScreen`), permissions (`PermissionNotification`), and initial trial count (`TrialCountIndicator`) wire correctly on both platforms.
2. Spend the remaining free rides and confirm planning is blocked at zero — the `GatekeeperUpgradePrompt` triggers with correct tier context via `SubscriptionGatekeeperProvider`.
3. Purchase or simulate a subscription and confirm `PurchaseVerificationOverlay` shows during verification, premium planning immediately unlocks, and trials are not decremented.
4. Restore purchases on a fresh install and confirm premium status is recovered via the restore flow and `PurchaseVerificationOverlay` feedback.
5. Open a deep link or push notification and confirm the app routes into the correct native screen.
6. Visit settings and confirm `SubscriptionSettingsSection` surfaces subscription status, management actions, tier cards (`SubscriptionTierCard`), and permission state.

## Source Coverage

- `06-technical-requirements.md`
- `15-uc-ride-flow.md`
- `16-uc-gatekeeper.md`

## Dependencies

- Sprint 2: Design System + Atomic Components (including pending delta: `GatekeeperUpgradePrompt`, `SubscriptionTierCard`, `SubscriptionGatekeeperProvider`, `TrialCountIndicator`, `PurchaseVerificationOverlay`, `SubscriptionSettingsSection`; onboarding screens `UI-057`, `UI-058`; `Banner`, `PermissionNotification`)
- Sprint 3: Auth and Discovery Shell
- Sprint 4: Chat Planning and Comparison

## Blocks

- Sprint 10: Native Parity and React Native Retirement

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| GATE-001 | Define shared trial-counter and subscription-state cache model | worker | 0.5 day |
| GATE-002 | Wire Android Billing Client SDK to gate checks, purchase, and restore flows | kotlin-implementer | 1 day |
| GATE-003 | Wire iOS StoreKit 2 SDK to gate checks, purchase, and restore flows | swift-implementer | 1 day |
| GATE-004 | Wire onboarding, paywall, permissions, and trial surfaces into gatekeeper flows per UC-GATE-01..08 | frontend-designer | 0.5 day |
| GATE-005 | Add deep-link, notification, and app-entry routing integration | worker | 0.5 day |
| GATE-006 | Wire settings, subscription management, and offline gate behavior via `SubscriptionSettingsSection` | convex-implementer | 0.5 day |

## Task Detail

### GATE-001 — Define shared trial-counter and subscription-state cache model

Define the typed cache model and contract consumed by `SubscriptionGatekeeperProvider`, trial surfaces, and platform billing clients. Pure data/model work; no UI.

**Components Consumed**
- None (backing model for `SubscriptionGatekeeperProvider (pending Sprint 2 delta)`)

### GATE-002 — Wire Android Billing Client SDK to gate checks, purchase, and restore flows

Integrate Google Play Billing Library: product fetch, launch purchase, acknowledge, restore, server-side verification callbacks. Emit state into the shared subscription cache (GATE-001) so already-built UI components react. No UI construction in this task.

**Components Consumed**
- `GatekeeperUpgradePrompt (pending Sprint 2 delta)` — triggered on gate failure
- `PurchaseVerificationOverlay (pending Sprint 2 delta)` — shown during verification
- `SubscriptionGatekeeperProvider (pending Sprint 2 delta)` — cache producer/consumer

### GATE-003 — Wire iOS StoreKit 2 SDK to gate checks, purchase, and restore flows

Integrate StoreKit 2: `Product.products(for:)`, `product.purchase()`, `Transaction.currentEntitlements`, `AppStore.sync()` restore, and server receipt verification. Emit state into the shared subscription cache (GATE-001). No UI construction in this task.

**Components Consumed**
- `GatekeeperUpgradePrompt (pending Sprint 2 delta)` — triggered on gate failure
- `PurchaseVerificationOverlay (pending Sprint 2 delta)` — shown during verification
- `SubscriptionGatekeeperProvider (pending Sprint 2 delta)` — cache producer/consumer

### GATE-004 — Wire onboarding, paywall, permissions, and trial surfaces into gatekeeper flows per UC-GATE-01..08

Wire Sprint-2 `WelcomeScreen` (UI-057) + `CompletionScreen` (UI-058) + `DownloadProgressScreen` + `SetupRequiredScreen` + `PermissionNotification` + `Banner` + (pending delta) `GatekeeperUpgradePrompt` + `SubscriptionTierCard` + `TrialCountIndicator` + `PurchaseVerificationOverlay` + `SubscriptionSettingsSection` into trial/subscription/onboarding flows per UC-GATE-01..08. No new components are constructed; this task is composition, routing, and state binding only.

**Components Consumed**
- `WelcomeScreen` (UI-057)
- `CompletionScreen` (UI-058)
- `DownloadProgressScreen`
- `SetupRequiredScreen`
- `PermissionNotification`
- `Banner`
- `GatekeeperUpgradePrompt (pending Sprint 2 delta)`
- `SubscriptionTierCard (pending Sprint 2 delta)`
- `SubscriptionGatekeeperProvider (pending Sprint 2 delta)`
- `TrialCountIndicator (pending Sprint 2 delta)`
- `PurchaseVerificationOverlay (pending Sprint 2 delta)`
- `SubscriptionSettingsSection (pending Sprint 2 delta)`

### GATE-005 — Add deep-link, notification, and app-entry routing integration

Wire universal links, deep links, and push notification routing into the native navigation graphs so entry paths land on the correct screen with the right gate state applied.

**Components Consumed**
- `Banner` — in-app notification surface
- `PermissionNotification` — push permission re-prompt surface

### GATE-006 — Wire settings, subscription management, and offline gate behavior via `SubscriptionSettingsSection`

Bind `SubscriptionSettingsSection` to Convex-backed subscription queries, management actions (cancel/manage/restore entry points), and offline-mode gate fallback logic. Composition/wiring only; no new UI components.

**Components Consumed**
- `SubscriptionSettingsSection (pending Sprint 2 delta)`
- `SubscriptionTierCard (pending Sprint 2 delta)`
- `SubscriptionGatekeeperProvider (pending Sprint 2 delta)`
