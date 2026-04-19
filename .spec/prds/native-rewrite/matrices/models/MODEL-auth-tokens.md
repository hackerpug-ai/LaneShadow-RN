# MODEL-auth-tokens.md - Auth Token Storage Translation Plan

**Document ID**: MAT-MODEL-AUTH-TOKENS
**Status**: Draft
**Source File**: `react-native/lib/auth-tokens.ts`
**Classification**: PORT
**Priority**: P0 (Foundational)
**Protocol**: 08g-model-translation-protocol.md

---

## Overview

Auth token storage utilities for WorkOS OAuth flow. Manages access tokens, refresh tokens, PKCE code verifiers, token expiry, and active organization ID. Currently uses AsyncStorage as a persistence detail, but the core business logic for token lifecycle must be consistent across platforms.

---

## Type Definitions

### Input/Output Contracts

```typescript
// Access token operations
getStoredAccessToken(): Promise<string | undefined>
storeAccessToken(token: string): Promise<void>

// Refresh token operations
getRefreshToken(): Promise<string | null>
storeRefreshToken(token: string): Promise<void>

// Token expiry operations
getTokenExpiry(): Promise<number | null>
storeTokenExpiry(expiresAt: number): Promise<void>

// PKCE flow operations
getCodeVerifier(): Promise<string | null>
storeCodeVerifier(verifier: string): Promise<void>

// Organization operations
getActiveOrganizationId(): Promise<string | null>
storeActiveOrganizationId(orgId: string): Promise<void>
clearActiveOrganizationId(): Promise<void>

// Clear all operation
clearAllTokens(): Promise<void>
```

### Storage Keys

| Key | Type | Purpose |
|-----|------|---------|
| `workos_access_token` | string | Convex auth JWT |
| `workos_refresh_token` | string | OAuth refresh token |
| `workos_token_expiry` | number (Unix timestamp seconds) | Token expiration time |
| `workos_code_verifier` | string | PKCE code verifier |
| `active_organization_id` | string | Current user's active org |

---

## State Machine

### Token Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│ INITIAL: No tokens stored                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ storeAccessToken() + storeRefreshToken()
                     │ + storeTokenExpiry()
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ AUTHENTICATED: Valid tokens present                         │
│ - getStoredAccessToken() returns token                      │
│ - Token used for Convex auth                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Token expires or user logs out
                     │
                     ├─────────────────┐
                     │                 │
                     │ clearAllTokens()│
                     │                 │
                     ▼                 ▼
        ┌──────────────────┐  ┌────────────────────┐
        │ LOGGED_OUT       │  │ TOKEN_REFRESH_NEEDED│
        │ No tokens        │  │ (Refresh flow uses  │
        │ (Clean slate)    │  │  code verifier)     │
        └──────────────────┘  └────────────────────┘
```

### PKCE Flow State

```
┌─────────────────────────────────────────────────────────────┐
│ START: Initiate OAuth login                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ storeCodeVerifier()
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ CODE_VERIFIER_STORED: Ready for callback                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ OAuth callback received
                     │ getCodeVerifier() + exchange for tokens
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ TOKENS_RECEIVED: storeAccessToken() + storeRefreshToken()  │
└─────────────────────────────────────────────────────────────┘
```

---

## API Surface

### Functions

| Function | Parameters | Returns | Purpose |
|----------|-----------|---------|---------|
| `getStoredAccessToken()` | - | `Promise<string \| undefined>` | Get Convex auth JWT |
| `storeAccessToken()` | `token: string` | `Promise<void>` | Store access token |
| `storeRefreshToken()` | `token: string` | `Promise<void>` | Store refresh token |
| `getRefreshToken()` | - | `Promise<string \| null>` | Get refresh token |
| `getTokenExpiry()` | - | `Promise<number \| null>` | Get token expiry timestamp |
| `storeTokenExpiry()` | `expiresAt: number` | `Promise<void>` | Store token expiry |
| `getCodeVerifier()` | - | `Promise<string \| null>` | Get PKCE verifier |
| `storeCodeVerifier()` | `verifier: string` | `Promise<void>` | Store PKCE verifier |
| `getActiveOrganizationId()` | - | `Promise<string \| null>` | Get active org ID |
| `storeActiveOrganizationId()` | `orgId: string` | `Promise<void>` | Store active org ID |
| `clearActiveOrganizationId()` | - | `Promise<void>` | Clear active org ID |
| `clearAllTokens()` | - | `Promise<void>` | Clear all auth data |

---

## Platform Translation Strategy

### Android (Kotlin)

**Storage**: EncryptedSharedPreferences (AndroidX Security)

**Implementation Pattern**:
```kotlin
// AuthTokenManager.kt
class AuthTokenManager(
    private val context: Context
) {
    private val sharedPrefs = EncryptedSharedPreferences.create(
        context,
        "laneshadow_auth",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    suspend fun getStoredAccessToken(): String? = withContext(Dispatchers.IO) {
        sharedPrefs.getString("workos_access_token", null)
    }

    suspend fun storeAccessToken(token: String) = withContext(Dispatchers.IO) {
        sharedPrefs.edit { putString("workos_access_token", token) }
    }

    // ... similar implementations for all other functions
}
```

**Dependencies**:
- `androidx.security:security-crypto:1.1.0-alpha06`

**DI Integration**:
```kotlin
@Module
@InstallIn(SingletonComponent::class)
object AuthModule {
    @Provides
    @Singleton
    fun provideAuthTokenManager(@ApplicationContext context: Context): AuthTokenManager {
        return AuthTokenManager(context)
    }
}
```

---

### iOS (Swift)

**Storage**: Keychain with kSecClassGenericPassword

**Implementation Pattern**:
```swift
// AuthTokenManager.swift
class AuthTokenManager {
    private let service = "com.laneshadow.auth"

    func getStoredAccessToken() async -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: "workos_access_token",
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let data = result as? Data,
              let token = String(data: data, encoding: .utf8) else {
            return nil
        }
        return token
    }

    func storeAccessToken(_ token: String) async throws {
        let data = token.data(using: .utf8)!
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: "workos_access_token",
            kSecValueData as String: data
        ]

        // Add or update
        let status = SecItemAdd(query as CFDictionary, nil)
        if status == errSecDuplicateItem {
            let updateQuery: [String: Any] = [
                kSecClass as String: kSecClassGenericPassword,
                kSecAttrService as String: service,
                kSecAttrAccount as String: "workos_access_token"
            ]
            let attributes: [String: Any] = [kSecValueData as String: data]
            SecItemUpdate(updateQuery as CFDictionary, attributes as CFDictionary)
        }
    }

    // ... similar implementations for all other functions
}
```

---

## Parity Contracts

### Behavioral Requirements

| Requirement | Description |
|-------------|-------------|
| **Persistence** | Tokens must survive app restart and device reboot |
| **Encryption** | Tokens must be encrypted at rest (Keychain/EncryptedSharedPreferences) |
| **Type Safety** | `getTokenExpiry()` must return number or null (not undefined) |
| **Clear All** | `clearAllTokens()` must remove all auth-related keys |
| **PKCE Verifier** | Code verifier must be stored securely (used during OAuth callback) |
| **Org ID** | Active organization ID must be separate from tokens |

### Storage Key Mapping

| TypeScript Key | Android Key | iOS Keychain Account |
|----------------|-------------|----------------------|
| `workos_access_token` | `workos_access_token` | `workos_access_token` |
| `workos_refresh_token` | `workos_refresh_token` | `workos_refresh_token` |
| `workos_token_expiry` | `workos_token_expiry` | `workos_token_expiry` |
| `workos_code_verifier` | `workos_code_verifier` | `workos_code_verifier` |
| `active_organization_id` | `active_organization_id` | `active_organization_id` |

---

## Dependencies

### Internal
- `hooks/use-async-storage.ts` — AsyncStorage wrapper (implementation detail to be replaced)

### External
- `@react-native-async-storage/async-storage` — To be replaced with platform-native secure storage

### Platform Replacements
- **Android**: `androidx.security:security-crypto` (EncryptedSharedPreferences)
- **iOS**: Security framework (Keychain Services)

---

## Test Migration Strategy

### Test Cases to Port

| Test Case | Description |
|-----------|-------------|
| Store and retrieve access token | Verify token persistence |
| Store and retrieve refresh token | Verify refresh token persistence |
| Token expiry storage | Verify timestamp storage and retrieval |
| PKCE code verifier flow | Verify OAuth PKCE flow support |
| Clear all tokens | Verify all keys removed |
| Missing token returns null | Verify graceful handling of missing data |

### Android Test Framework
```kotlin
// AuthTokenManagerTest.kt
@RunWith(AndroidJUnit4::class)
class AuthTokenManagerTest {
    @get:Rule
    val instantExecutorRule = InstantTaskExecutorRule()

    private lateinit var manager: AuthTokenManager
    private lateinit var context: Context

    @Before
    fun setup() {
        context = ApplicationProvider.getApplicationContext<Context>()
        manager = AuthTokenManager(context)
    }

    @Test
    fun `store and retrieve access token`() = runTest {
        manager.storeAccessToken("test-token")
        val token = manager.getStoredAccessToken()
        assertEquals("test-token", token)
    }

    // ... other test cases
}
```

### iOS Test Framework
```swift
// AuthTokenManagerTests.swift
@testable import LaneShadow
import XCTest

class AuthTokenManagerTests: XCTestCase {
    var manager: AuthTokenManager!

    override func setUp() {
        super.setUp()
        manager = AuthTokenManager()
        // Clear keychain before each test
        manager.clearAllTokens()
    }

    func testStoreAndRetrieveAccessToken() async throws {
        try await manager.storeAccessToken("test-token")
        let token = await manager.getStoredAccessToken()
        XCTAssertEqual(token, "test-token")
    }

    // ... other test cases
}
```

---

## Edge Cases

| Edge Case | Expected Behavior |
|-----------|------------------|
| Token expires | `getStoredAccessToken()` returns token but app must check expiry |
| Corrupted storage | Functions should return null/undefined, not throw |
| Concurrent access | Platform storage must handle concurrent reads/writes |
| Device migration | Tokens should survive app updates but not device restore (by design) |
| Keychain access denied | iOS: Handle `errSecNotAvailable` gracefully |

---

## Performance Considerations

| Operation | Performance Target |
|-----------|-------------------|
| `getStoredAccessToken()` | < 10ms (cached in memory during auth flow) |
| `storeAccessToken()` | < 50ms (I/O bound, but infrequent) |
| `clearAllTokens()` | < 100ms (called on logout only) |

---

## Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| **Encryption at rest** | EncryptedSharedPreferences (Android), Keychain (iOS) |
| **No plaintext logging** | Tokens must never appear in logs |
| **Secure storage only** | Never use UserDefaults or regular SharedPreferences |
| **Biometric lock optional** | Future: require biometric to access tokens |

---

## Migration Notes

### Data Migration from RN

During native app rollout, existing AsyncStorage data must be migrated:

**Android**: One-time migration in `Application.onCreate()`
```kotlin
class MigrateAuthTokensTask : Runnable {
    override fun run() {
        // Read from AsyncStorage (RN bridge)
        // Write to EncryptedSharedPreferences
        // Clear AsyncStorage
    }
}
```

**iOS**: One-time migration in `AppDelegate.init()`
```swift
func migrateAuthTokens() {
    // Read from AsyncStorage (RN bridge)
    // Write to Keychain
    // Clear AsyncStorage
}
```

---

## References

- `08g-model-translation-protocol.md` — Classification and translation patterns
- `INVENTORY.md` — Complete file inventory
- React Native source: `react-native/lib/auth-tokens.ts`

---

**Change Log**:
- 2026-04-19: Initial translation plan authored (FND-006)
