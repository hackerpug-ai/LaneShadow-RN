# Gatekeeper & Trial System - Native Rewrite UC

**Document ID:** UC-GATE
**Status:** Draft
**Last Updated:** 2026-04-16

## Overview

This document defines the gatekeeper and trial system for LaneShadow's native rewrite. The gatekeeper enforces subscription checks before premium actions, manages free trial counters, and handles subscription purchase and restoration.

### Trial System Design

- **Free tier**: 3 free route plans
- **Trial counter**: Persists locally, decrements on each plan
- **Gate checks**: Occur before premium actions (route planning, AI features)
- **Upgrade prompt**: Modal when trial exhausted
- **Subscription tiers**: Monthly ($4.99/mo) and Annual ($39.99/yr)

---

## UC-GATE-01: Trial Counter Display

### Description
Display the remaining number of free route plans to the user. The counter decrements with each plan and persists across app restarts.

### Preconditions
- User is not subscribed
- User has not exhausted free trial
- App is initialized

### Main Flow
1. App launches and loads trial count from storage
2. Trial count displays in prominent UI location
3. User initiates a route plan
4. Counter decrements by 1
5. Updated count persists to storage
6. UI reflects new count

### Acceptance Criteria

#### Android (Given/When/Then)
- **Given** the user is on the free tier
- **When** the app launches
- **Then** the remaining trial count displays in the header
- **And** the format is "X free rides left"
- **And** the count is stored in DataStore
- **When** the user plans a route
- **Then** the counter decrements by 1
- **And** the updated count persists to DataStore
- **And** the UI updates to show the new count

#### iOS (Given/When/Then)
- **Given** the user is on the free tier
- **When** the app launches
- **Then** the remaining trial count displays in the header
- **And** the format is "X free rides left"
- **And** the count is stored in UserDefaults
- **When** the user plans a route
- **Then** the counter decrements by 1
- **And** the updated count persists to UserDefaults
- **And** the UI updates to show the new count

---

## UC-GATE-02: Feature Gate Check

### Description
Before executing premium actions (route planning, AI chat), check if the user has an active subscription or remaining trials. Block access if neither condition is met.

### Preconditions
- User attempts a premium action
- Subscription status is cached or fetchable

### Main Flow
1. User taps "Plan Ride" or sends chat message
2. Gate check intercepts the action
3. Check subscription status (cache first, then network)
4. If subscribed: allow action
5. If not subscribed: check trial count
6. If trials > 0: allow action and decrement
7. If trials == 0: show upgrade prompt

### Acceptance Criteria

#### Android
- **Given** the user is not subscribed
- **When** the user attempts to plan a route with 0 trials left
- **Then** the action is blocked
- **And** the upgrade prompt modal displays
- **And** the planning action does not execute
- **Given** the user is not subscribed
- **When** the user attempts to plan a route with 2 trials left
- **Then** the action is allowed
- **And** the trial count decrements to 1
- **And** the planning action executes
- **Given** the user has an active subscription
- **When** the user attempts to plan a route
- **Then** the action is allowed
- **And** the trial count is not decremented
- **And** the planning action executes immediately

#### iOS
- **Given** the user is not subscribed
- **When** the user attempts to plan a route with 0 trials left
- **Then** the action is blocked
- **And** the upgrade prompt modal displays
- **And** the planning action does not execute
- **Given** the user is not subscribed
- **When** the user attempts to plan a route with 2 trials left
- **Then** the action is allowed
- **And** the trial count decrements to 1
- **And** the planning action executes
- **Given** the user has an active subscription
- **When** the user attempts to plan a route
- **Then** the action is allowed
- **And** the trial count is not decremented
- **And** the planning action executes immediately

---

## UC-GATE-03: Upgrade Prompt

### Description
When the user exhausts their free trials, display a modal prompting them to subscribe. Show subscription tiers and benefits clearly.

### Preconditions
- User attempts premium action
- Trial count == 0
- User is not subscribed

### Main Flow
1. Gate check fails (no trials, no subscription)
2. Upgrade prompt modal animates in
3. Headline: "Your free rides are used up"
4. Body text explains premium benefits
5. Two subscription tiers shown: Monthly and Annual
6. Annual tier highlighted as "Save 20%"
7. "Subscribe" and "Maybe Later" buttons
8. Tapping "Maybe Later" returns to map

### Acceptance Criteria

#### Android
- **Given** the user has 0 trials left
- **When** they attempt to plan a route
- **Then** a bottom sheet modal slides up
- **And** the headline reads "Your free rides are used up"
- **And** the Monthly tier shows "$4.99/month"
- **And** the Annual tier shows "$39.99/year (Save 20%)"
- **And** the Annual tier has a "Best Value" badge
- **And** tapping "Subscribe" launches the billing flow
- **And** tapping "Maybe Later" dismisses the modal

#### iOS
- **Given** the user has 0 trials left
- **When** they attempt to plan a route
- **Then** a modal presents from the bottom
- **And** the headline reads "Your free rides are used up"
- **And** the Monthly tier shows "$4.99/month"
- **And** the Annual tier shows "$39.99/year (Save 20%)"
- **And** the Annual tier has a "Best Value" badge
- **And** tapping "Subscribe" launches StoreKit
- **And** tapping "Maybe Later" dismisses the modal

---

## UC-GATE-04: Subscription Purchase

### Description
Handle the subscription purchase flow through platform billing systems. Verify purchases and update subscription status.

### Preconditions
- User tapped "Subscribe" in upgrade prompt
- Billing system is available
- Network is available (for purchase verification)

### Main Flow
1. User selects a subscription tier
2. Platform billing flow launches
3. User confirms purchase (fingerprint/Face ID)
4. Payment processed
5. Purchase verified with backend
6. Subscription status updated locally
7. Premium features unlocked
8. Success message displays

### Acceptance Criteria

#### Android
- **Given** the user tapped "Subscribe"
- **When** the Google Play billing flow launches
- **Then** the selected subscription tier is pre-selected
- **And** the user can confirm with fingerprint/biometrics
- **And** on successful purchase, BillingClient acknowledges
- **And** the purchase token is sent to backend for verification
- **And** subscription status is stored in DataStore
- **And** a success toast displays "Subscription activated!"
- **And** the gate check now passes for premium actions
- **And** if purchase fails, an error message displays
- **And** if verification fails, purchase is pending until retry

#### iOS
- **Given** the user tapped "Subscribe"
- **When** the StoreKit flow launches
- **Then** the selected subscription tier is pre-selected
- **And** the user can confirm with Face ID/Touch ID
- **And** on successful purchase, StoreKit updates Transaction.updates
- **And** the transaction is verified with the backend
- **And** subscription status is stored in UserDefaults
- **And** a success alert displays "Subscription activated!"
- **And** the gate check now passes for premium actions
- **And** if purchase fails, an error message displays
- **And** if verification fails, transaction is pending until retry

---

## UC-GATE-05: Subscription Management

### Description
Allow users to view their current subscription plan, change tiers, or cancel. Link to platform subscription management.

### Preconditions
- User has an active subscription
- User is in settings screen

### Main Flow
1. User navigates to Settings
2. "Subscription" section shows current plan
3. "Manage Subscription" button available
4. Tapping opens platform subscription management
5. User can cancel or change tier
6. Changes reflect in app after restart

### Acceptance Criteria

#### Android
- **Given** the user has an active subscription
- **When** they open Settings
- **Then** a "Subscription" section displays
- **And** the current plan shows (Monthly or Annual)
- **And** a "Manage Subscription" button is available
- **When** the user taps "Manage Subscription"
- **Then** Google Play's subscription management opens
- **And** the user can cancel or change tiers
- **And** changes are reflected in the app after restart
- **And** cancellation allows premium features until period ends

#### iOS
- **Given** the user has an active subscription
- **When** they open Settings
- **Then** a "Subscription" section displays
- **And** the current plan shows (Monthly or Annual)
- **And** a "Manage Subscription" button is available
- **When** the user taps "Manage Subscription"
- **Then** the App Store subscription management opens
- **And** the user can cancel or change tiers
- **And** changes are reflected in the app after restart
- **And** cancellation allows premium features until period ends

---

## UC-GATE-06: Restore Purchases

### Description
Allow users to restore purchases on a new device or after reinstalling the app. Verify past purchases with the platform.

### Preconditions
- User is on a new device or reinstalled
- User has previously purchased a subscription
- "Restore Purchases" option is available

### Main Flow
1. User opens Settings
2. "Restore Purchases" button available
3. User taps "Restore Purchases"
4. App queries platform for past purchases
5. Purchases verified with backend
6. Subscription status updated
7. Success or error message displays

### Acceptance Criteria

#### Android
- **Given** the user is on a new device
- **When** they open Settings
- **Then** a "Restore Purchases" button displays
- **When** the user taps "Restore Purchases"
- **Then** BillingClient.queryPurchasesAsync() is called
- **And** existing purchases are fetched from Google Play
- **And** purchase tokens are verified with the backend
- **And** subscription status is updated in DataStore
- **And** a success toast displays "Subscription restored!"
- **And** premium features are unlocked
- **If no purchases found, an error message displays**

#### iOS
- **Given** the user is on a new device
- **When** they open Settings
- **Then** a "Restore Purchases" button displays
- **When** the user taps "Restore Purchases"
- **Then** Transaction.updates is checked for past purchases
- **And** AppStore.sync() is called to fetch latest transactions
- **And** transactions are verified with the backend
- **And** subscription status is updated in UserDefaults
- **And** a success alert displays "Subscription restored!"
- **And** premium features are unlocked
- **If no purchases found, an error message displays**

---

## UC-GATE-07: Trial Reset

### Description
Reset the trial counter when a new user completes onboarding. Ensure the gatekeeper recognizes first-time users.

### Preconditions
- User is installing the app for the first time
- User has completed onboarding
- No previous subscription exists

### Main Flow
1. User completes onboarding
2. Trial counter initialized to 3
3. Counter persists to storage
4. Gatekeeper recognizes free tier user
5. Premium actions allowed until trials exhausted

### Acceptance Criteria

#### Android
- **Given** a new user completes onboarding
- **When** the main app loads
- **Then** the trial counter is set to 3
- **And** the counter is stored in DataStore
- **And** the header displays "3 free rides left"
- **And** the user can plan routes without seeing the upgrade prompt
- **Until** the trial counter reaches 0

#### iOS
- **Given** a new user completes onboarding
- **When** the main app loads
- **Then** the trial counter is set to 3
- **And** the counter is stored in UserDefaults
- **And** the header displays "3 free rides left"
- **And** the user can plan routes without seeing the upgrade prompt
- **Until** the trial counter reaches 0

---

## UC-GATE-08: Offline Gate Check

### Description
Cache subscription status locally to allow gate checks when offline. Prevent blocking premium users due to network issues.

### Preconditions
- User has active subscription
- Device is offline
- User attempts premium action

### Main Flow
1. User attempts premium action
2. Gate check queries local cache
3. If cached status is "subscribed": allow action
4. If cached status is "free": check trial count
5. If trials > 0: allow and decrement
6. If trials == 0: show upgrade prompt (with note about offline)
7. When online, sync with backend to verify status

### Acceptance Criteria

#### Android
- **Given** the user has an active subscription
- **When** the device is offline
- **And** the user attempts to plan a route
- **Then** the gate check reads from DataStore cache
- **And** the cached subscription status is "active"
- **And** the planning action is allowed
- **And** the action executes without network
- **Given** the user is on the free tier with 0 trials
- **When** the device is offline
- **And** the user attempts to plan a route
- **Then** the upgrade prompt displays
- **And** a note shows "Connect to internet to subscribe"
- **And** the "Subscribe" button is disabled

#### iOS
- **Given** the user has an active subscription
- **When** the device is offline
- **And** the user attempts to plan a route
- **Then** the gate check reads from UserDefaults cache
- **And** the cached subscription status is "active"
- **And** the planning action is allowed
- **And** the action executes without network
- **Given** the user is on the free tier with 0 trials
- **When** the device is offline
- **And** the user attempts to plan a route
- **Then** the upgrade prompt displays
- **And** a note shows "Connect to internet to subscribe"
- **And** the "Subscribe" button is disabled

---

## Platform-Specific Implementation

### Android

```kotlin
// Subscription status data class
data class SubscriptionStatus(
    val isSubscribed: Boolean,
    val tier: SubscriptionTier?, // MONTHLY, ANNUAL, or null
    val expiryDate: Long?, // Unix timestamp
    val trialCount: Int // 0-3 for free users
)

// DataStore persistence
class SubscriptionManager(private val context: Context) {
    private val Context.dataStore by preferencesDataStore("subscription")
    
    private val trialCountKey = intPreferencesKey("trial_count")
    private val isSubscribedKey = booleanPreferencesKey("is_subscribed")
    private val tierKey = stringPreferencesKey("subscription_tier")
    
    suspend fun getSubscriptionStatus(): SubscriptionStatus {
        val prefs = context.dataStore.data.first()
        return SubscriptionStatus(
            isSubscribed = prefs[isSubscribedKey] ?: false,
            tier = prefs[tierKey]?.let { SubscriptionTier.valueOf(it) },
            expiryDate = null, // Stored separately if needed
            trialCount = prefs[trialCountKey] ?: 3
        )
    }
    
    suspend fun decrementTrial() {
        context.dataStore.edit { prefs ->
            val current = prefs[trialCountKey] ?: 3
            prefs[trialCountKey] = maxOf(0, current - 1)
        }
    }
}

// Google Play Billing Library 6+ integration
class BillingManager(
    private val activity: Activity,
    private val onPurchaseComplete: (Boolean) -> Unit
) {
    private val billingClient = BillingClient.newBuilder(activity)
        .setListener { billingResult, purchases ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                verifyPurchases(purchases)
            }
        }
        .enablePendingPurchases()
        .build()
    
    fun launchBillingFlow(sku: String) {
        val productDetailsParams = BillingFlowParams.ProductDetailsParams.newBuilder()
            .setProductDetails(productDetails)
            .build()
        
        val billingFlowParams = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(listOf(productDetailsParams))
            .build()
        
        billingClient.launchBillingFlow(activity, billingFlowParams)
    }
}
```

### iOS

```swift
// Subscription status model
struct SubscriptionStatus: Codable {
    let isSubscribed: Bool
    let tier: SubscriptionTier? // .monthly, .annual, or nil
    let expiryDate: Date?
    let trialCount: Int // 0-3 for free users
}

enum SubscriptionTier: String, Codable {
    case monthly
    case annual
}

// UserDefaults persistence
class SubscriptionManager: ObservableObject {
    private let trialCountKey = "trial_count"
    private let isSubscribedKey = "is_subscribed"
    private let tierKey = "subscription_tier"
    
    @Published var subscriptionStatus: SubscriptionStatus
    
    init() {
        self.subscriptionStatus = Self.loadStatus()
    }
    
    private static func loadStatus() -> SubscriptionStatus {
        let defaults = UserDefaults.standard
        return SubscriptionStatus(
            isSubscribed: defaults.bool(forKey: isSubscribedKey),
            tier: defaults.string(forKey: tierKey).flatMap { SubscriptionTier(rawValue: $0) },
            expiryDate: nil, // Stored separately if needed
            trialCount: defaults.integer(forKey: trialCountKey)
        )
    }
    
    func decrementTrial() {
        subscriptionStatus.trialCount = max(0, subscriptionStatus.trialCount - 1)
        UserDefaults.standard.set(subscriptionStatus.trialCount, forKey: trialCountKey)
    }
}

// StoreKit 2 integration
@main
struct AppDelegate: AppDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Listen for transaction updates
        Task {
            for await result in Transaction.updates {
                guard case .verified(let transaction) = result else { continue }
                await self.verifyPurchase(transaction)
            }
        }
        return true
    }
    
    func purchase(_ product: Product) async throws {
        let result = try await product.purchase()
        switch result {
        case .success(let verification):
            guard case .verified(let transaction) = verification else { return }
            await verifyPurchase(transaction)
            await transaction.finish()
        case .userCancelled:
            break
        default:
            break
        }
    }
}
```

---

## References

- Existing gatekeeper component: `/components/gatekeeper/model-gatekeeper-provider.tsx`
- Setup required screen: `/components/gatekeeper/setup-required-screen.tsx`
- Onboarding welcome screen: `/components/onboarding/welcome-screen.tsx`
- Settings store pattern: `/stores/settings-store.ts`
