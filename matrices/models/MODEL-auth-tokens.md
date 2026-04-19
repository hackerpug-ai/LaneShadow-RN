# MODEL-auth-tokens.md - Token Storage Translation Plan

**Source File**: `react-native/lib/auth-tokens.ts`
**Classification**: PORT
**Priority**: P0 (authentication)

---

## SOURCE ANALYSIS

### Purpose
Centralized token management for WorkOS OAuth. Tokens stored securely via asyncStorage (expo-secure-store / localStorage wrapper). Manages access tokens, refresh tokens, PKCE code verifiers, and organization IDs.

### Exports
- `getStoredAccessToken()` → `Promise<string | undefined>`
- `storeAccessToken(token)` → `Promise<void>`
- `storeRefreshToken(token)` → `Promise<void>`
- `getRefreshToken()` → `Promise<string | null>`
- `storeTokenExpiry(expiresAt)` → `Promise<void>`
- `getTokenExpiry()` → `Promise<number | null>`
- `storeCodeVerifier(verifier)` → `Promise<void>`
- `getCodeVerifier()` → `Promise<string | null>`
- `storeActiveOrganizationId(orgId)` → `Promise<void>`
- `getActiveOrganizationId()` → `Promise<string | null>`
- `clearActiveOrganizationId()` → `Promise<void>`
- `clearAllTokens()` → `Promise<void>`

### Dependencies
- `../hooks/use-async-storage` (asyncStorage) - Platform storage abstraction

### Key Behaviors
- Secure storage of OAuth tokens
- PKCE code verifier persistence
- Token expiry tracking (Unix timestamp in seconds)
- Active organization ID management
- Clear all tokens on logout

---

## TRANSLATION STRATEGY

### Android (Kotlin)

```kotlin
// auth/AuthTokenStorage.kt
import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

interface AuthTokenStorage {
    suspend fun getStoredAccessToken(): String?
    suspend fun storeAccessToken(token: String)
    suspend fun storeRefreshToken(token: String)
    suspend fun getRefreshToken(): String?
    suspend fun storeTokenExpiry(expiresAt: Long)
    suspend fun getTokenExpiry(): Long?
    suspend fun storeCodeVerifier(verifier: String)
    suspend fun getCodeVerifier(): String?
    suspend fun storeActiveOrganizationId(orgId: String)
    suspend fun getActiveOrganizationId(): String?
    suspend fun clearActiveOrganizationId()
    suspend fun clearAllTokens()
}

class SharedPrefsAuthTokenStorage(
    private val context: Context
) : AuthTokenStorage {

    private val prefs: SharedPreferences by lazy {
        context.getSharedPreferences("auth_tokens", Context.MODE_PRIVATE)
    }

    override suspend fun getStoredAccessToken(): String? = withContext(Dispatchers.IO) {
        prefs.getString(KEY_ACCESS_TOKEN, null)
    }

    override suspend fun storeAccessToken(token: String) = withContext(Dispatchers.IO) {
        prefs.edit().putString(KEY_ACCESS_TOKEN, token).apply()
    }

    override suspend fun storeRefreshToken(token: String) = withContext(Dispatchers.IO) {
        prefs.edit().putString(KEY_REFRESH_TOKEN, token).apply()
    }

    override suspend fun getRefreshToken(): String? = withContext(Dispatchers.IO) {
        prefs.getString(KEY_REFRESH_TOKEN, null)
    }

    override suspend fun storeTokenExpiry(expiresAt: Long) = withContext(Dispatchers.IO) {
        prefs.edit().putLong(KEY_TOKEN_EXPIRY, expiresAt).apply()
    }

    override suspend fun getTokenExpiry(): Long? = withContext(Dispatchers.IO) {
        val expiry = prefs.getLong(KEY_TOKEN_EXPIRY, -1L)
        if (expiry == -1L) null else expiry
    }

    override suspend fun storeCodeVerifier(verifier: String) = withContext(Dispatchers.IO) {
        prefs.edit().putString(KEY_CODE_VERIFIER, verifier).apply()
    }

    override suspend fun getCodeVerifier(): String? = withContext(Dispatchers.IO) {
        prefs.getString(KEY_CODE_VERIFIER, null)
    }

    override suspend fun storeActiveOrganizationId(orgId: String) = withContext(Dispatchers.IO) {
        prefs.edit().putString(KEY_ACTIVE_ORG_ID, orgId).apply()
    }

    override suspend fun getActiveOrganizationId(): String? = withContext(Dispatchers.IO) {
        prefs.getString(KEY_ACTIVE_ORG_ID, null)
    }

    override suspend fun clearActiveOrganizationId() = withContext(Dispatchers.IO) {
        prefs.edit().remove(KEY_ACTIVE_ORG_ID).apply()
    }

    override suspend fun clearAllTokens() = withContext(Dispatchers.IO) {
        prefs.edit().clear().apply()
    }

    companion object {
        private const val KEY_ACCESS_TOKEN = "workos_access_token"
        private const val KEY_REFRESH_TOKEN = "workos_refresh_token"
        private const val KEY_TOKEN_EXPIRY = "workos_token_expiry"
        private const val KEY_CODE_VERIFIER = "workos_code_verifier"
        private const val KEY_ACTIVE_ORG_ID = "active_organization_id"
    }
}

// For production, use EncryptedSharedPreferences for better security
class EncryptedAuthTokenStorage(
    private val context: Context
) : AuthTokenStorage {

    private val encryptedPrefs: SharedPreferences by lazy {
        // TODO: Implement EncryptedSharedPreferences
        // For now, use regular SharedPreferences
        context.getSharedPreferences("auth_tokens_encrypted", Context.MODE_PRIVATE)
    }

    // Implementation same as SharedPrefsAuthTokenStorage
    // but uses EncryptedSharedPreferences
}
```

### iOS (Swift)

```swift
// auth/AuthTokenStorage.swift
import Foundation
import Security

protocol AuthTokenStorage {
    func getStoredAccessToken() async -> String?
    func storeAccessToken(token: String) async
    func storeRefreshToken(token: String) async
    func getRefreshToken() async -> String?
    func storeTokenExpiry(expiresAt: Int) async
    func getTokenExpiry() async -> Int?
    func storeCodeVerifier(verifier: String) async
    func getCodeVerifier() async -> String?
    func storeActiveOrganizationId(orgId: String) async
    func getActiveOrganizationId() async -> String?
    func clearActiveOrganizationId() async
    func clearAllTokens() async
}

class KeychainAuthTokenStorage: AuthTokenStorage {

    private let service = "com.laneshadow.auth"

    func getStoredAccessToken() async -> String? {
        return get(key: KEY_ACCESS_TOKEN)
    }

    func storeAccessToken(token: String) async {
        set(key: KEY_ACCESS_TOKEN, value: token)
    }

    func storeRefreshToken(token: String) async {
        set(key: KEY_REFRESH_TOKEN, value: token)
    }

    func getRefreshToken() async -> String? {
        return get(key: KEY_REFRESH_TOKEN)
    }

    func storeTokenExpiry(expiresAt: Int) async {
        set(key: KEY_TOKEN_EXPIRY, value: String(expiresAt))
    }

    func getTokenExpiry() async -> Int? {
        guard let value = get(key: KEY_TOKEN_EXPIRY) else { return nil }
        return Int(value)
    }

    func storeCodeVerifier(verifier: String) async {
        set(key: KEY_CODE_VERIFIER, value: verifier)
    }

    func getCodeVerifier() async -> String? {
        return get(key: KEY_CODE_VERIFIER)
    }

    func storeActiveOrganizationId(orgId: String) async {
        set(key: KEY_ACTIVE_ORG_ID, value: orgId)
    }

    func getActiveOrganizationId() async -> String? {
        return get(key: KEY_ACTIVE_ORG_ID)
    }

    func clearActiveOrganizationId() async {
        delete(key: KEY_ACTIVE_ORG_ID)
    }

    func clearAllTokens() async {
        delete(key: KEY_ACCESS_TOKEN)
        delete(key: KEY_REFRESH_TOKEN)
        delete(key: KEY_TOKEN_EXPIRY)
        delete(key: KEY_CODE_VERIFIER)
        delete(key: KEY_ACTIVE_ORG_ID)
    }

    // MARK: - Keychain Helpers

    private func get(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let data = result as? Data,
              let value = String(data: data, encoding: .utf8) else {
            return nil
        }

        return value
    }

    private func set(key: String, value: String) {
        let data = value.data(using: .utf8)!

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]

        // First try to update existing item
        let attributes: [String: Any] = [
            kSecValueData as String: data
        ]

        let status = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)

        // If item doesn't exist, add it
        if status == errSecItemNotFound {
            let newQuery: [String: Any] = [
                kSecClass as String: kSecClassGenericPassword,
                kSecAttrService as String: service,
                kSecAttrAccount as String: key,
                kSecValueData as String: data
            ]

            SecItemAdd(newQuery as CFDictionary, nil)
        }
    }

    private func delete(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]

        SecItemDelete(query as CFDictionary)
    }

    // MARK: - Keys

    private static let KEY_ACCESS_TOKEN = "workos_access_token"
    private static let KEY_REFRESH_TOKEN = "workos_refresh_token"
    private static let KEY_TOKEN_EXPIRY = "workos_token_expiry"
    private static let KEY_CODE_VERIFIER = "workos_code_verifier"
    private static let KEY_ACTIVE_ORG_ID = "active_organization_id"
}
```

---

## PARITY CONTRACT

### Behavioral Invariants
1. **Token Storage**: MUST securely store access/refresh tokens
2. **PKCE Support**: MUST store code verifier for OAuth flow
3. **Expiry Tracking**: MUST store token expiry as Unix timestamp (seconds)
4. **Organization Management**: MUST store active organization ID
5. **Clear All**: MUST remove all auth data on logout
6. **Null Safety**: getAccessToken returns undefined/null if not found

### Storage Keys
- `workos_access_token`
- `workos_refresh_token`
- `workos_token_expiry`
- `workos_code_verifier`
- `active_organization_id`

### Security Requirements
- Android: Use EncryptedSharedPreferences in production
- iOS: Use Keychain (not UserDefaults)
- All operations should be async (suspend/await)

---

## DEPENDENCIES

### Translation Order
- No dependencies on other business logic files
- Can be translated independently

### Integration Points
- Used by `lib/clerk-token-cache.ts` (NATIVE-OWNED) for Clerk auth
- Used by Convex auth provider for JWT inclusion
- Used by auth flow components

### Test Porting
- Port tests from `lib/__tests__/auth-tokens.test.ts` (if exists) to platform tests
- Test token persistence across app restarts
- Test clearAllTokens removes all keys
