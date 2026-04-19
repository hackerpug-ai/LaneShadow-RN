# MODEL-wifi-validator.md - Network Validation Translation Plan

**Source File**: `react-native/lib/mapbox/wifi-validator.ts`
**Classification**: PORT
**Priority**: P1 (offline download requirements)

---

## SOURCE ANALYSIS

### Purpose
WiFi connection validation for offline downloads. Ensures downloads only proceed over WiFi to prevent cellular data charges. Uses runtime injection for network state provider.

### Exports
- `WiFiValidator` object with:
  - `configure(opts)` → `void` (inject network state provider)
  - `isWiFi()` → `Promise<boolean>`
  - `getNetworkState()` → `Promise<NetworkState>`
  - `subscribe(listener)` → `() => void` (unsubscribe function)
  - `waitForWiFi()` → `Promise<void>`

### Dependencies
- None (network state provider injected at runtime)

### Key Behaviors
- WiFi-only enforcement for downloads
- Network change subscription support
- Async waiting for WiFi connection
- Default to WiFi for testing (injected provider)

---

## TRANSLATION STRATEGY

### Android (Kotlin)

```kotlin
// network/WiFiValidator.kt
import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

enum class ConnectionType {
    WIFI,
    CELLULAR,
    UNKNOWN,
    NONE
}

data class NetworkState(
    val type: ConnectionType,
    val isConnected: Boolean
)

typealias NetworkChangeListener = (NetworkState) -> Unit

interface NetworkStateProvider {
    suspend fun getNetworkState(): NetworkState
    fun subscribe(listener: NetworkChangeListener): () -> Unit
}

class DefaultNetworkStateProvider(private val context: Context) : NetworkStateProvider {

    private val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    override suspend fun getNetworkState(): NetworkState {
        val network = connectivityManager.activeNetwork ?: return NetworkState(ConnectionType.NONE, false)

        val capabilities = connectivityManager.getNetworkCapabilities(network)
            ?: return NetworkState(ConnectionType.UNKNOWN, false)

        return when {
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> {
                NetworkState(ConnectionType.WIFI, true)
            }
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> {
                NetworkState(ConnectionType.CELLULAR, true)
            }
            else -> NetworkState(ConnectionType.UNKNOWN, true)
        }
    }

    override fun subscribe(listener: NetworkChangeListener): () -> Unit {
        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()

        val networkCallback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                val capabilities = connectivityManager.getNetworkCapabilities(network)
                val type = when {
                    capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true -> ConnectionType.WIFI
                    capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) == true -> ConnectionType.CELLULAR
                    else -> ConnectionType.UNKNOWN
                }
                listener(NetworkState(type, true))
            }

            override fun onLost(network: Network) {
                listener(NetworkState(ConnectionType.NONE, false))
            }
        }

        connectivityManager.registerNetworkCallback(request, networkCallback)

        return {
            connectivityManager.unregisterNetworkCallback(networkCallback)
        }
    }
}

object WiFiValidator {
    private var provider: NetworkStateProvider? = null

    fun configure(provider: NetworkStateProvider) {
        this.provider = provider
    }

    suspend fun isWiFi(): Boolean {
        val state = getNetworkState()
        return state.type == ConnectionType.WIFI && state.isConnected
    }

    suspend fun getNetworkState(): NetworkState {
        return provider?.getNetworkState()
            ?: throw IllegalStateException("NetworkStateProvider not configured")
    }

    fun subscribe(listener: NetworkChangeListener): () -> Void {
        return provider?.subscribe(listener)
            ?: throw IllegalStateException("NetworkStateProvider not configured")
    }

    suspend fun waitForWiFi() {
        val state = getNetworkState()
        if (state.type == ConnectionType.WIFI && state.isConnected) return

        suspendCancellableCoroutine { continuation ->
            val unsubscribe = subscribe { newState ->
                if (newState.type == ConnectionType.WIFI && newState.isConnected) {
                    unsubscribe()
                    continuation.resume(Unit)
                }
            }

            continuation.invokeOnCancellation {
                unsubscribe()
            }
        }
    }
}
```

### iOS (Swift)

```swift
// network/WiFiValidator.swift
import Foundation
import Network

enum ConnectionType {
    case wifi
    case cellular
    case unknown
    case none
}

struct NetworkState {
    let type: ConnectionType
    let isConnected: Bool
}

typealias NetworkChangeListener = (NetworkState) -> Void

protocol NetworkStateProvider {
    func getNetworkState() async -> NetworkState
    func subscribe(listener: @escaping NetworkChangeListener) -> (() -> Void)
}

@available(iOS 12.0, *)
class DefaultNetworkStateProvider: NetworkStateProvider {
    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "NetworkMonitor")

    func getNetworkState() async -> NetworkState {
        await withCheckedContinuation { continuation in
            monitor.pathUpdateHandler = { path in
                let state = self.convertPathToState(path)
                continuation.resume(returning: state)
            }

            monitor.start(queue: queue)
        }
    }

    func subscribe(listener: @escaping NetworkChangeListener) -> (() -> Void) {
        monitor.pathUpdateHandler = { path in
            listener(self.convertPathToState(path))
        }

        monitor.start(queue: queue)

        return {
            self.monitor.cancel()
        }
    }

    private func convertPathToState(_ path: NWPath) -> NetworkState {
        guard path.status == .satisfied else {
            return NetworkState(type: .none, isConnected: false)
        }

        // Check for WiFi
        if path.usesInterfaceType(.wifi) {
            return NetworkState(type: .wifi, isConnected: true)
        }

        // Check for cellular
        if path.usesInterfaceType(.cellular) {
            return NetworkState(type: .cellular, isConnected: true)
        }

        // Other interface (wired, etc.)
        if path.usesInterfaceType(.wiredEthernet) || path.usesInterfaceType(.other) {
            return NetworkState(type: .unknown, isConnected: true)
        }

        return NetworkState(type: .unknown, isConnected: true)
    }
}

class WiFiValidator {
    static var provider: NetworkStateProvider?

    static func configure(provider: NetworkStateProvider) {
        self.provider = provider
    }

    static func isWiFi() async throws -> Bool {
        let state = try await getNetworkState()
        return state.type == .wifi && state.isConnected
    }

    static func getNetworkState() async throws -> NetworkState {
        guard let provider = provider else {
            throw NSError(domain: "WiFi", code: -1, userInfo: [NSLocalizedDescriptionKey: "NetworkStateProvider not configured"])
        }

        return await provider.getNetworkState()
    }

    static func subscribe(listener: @escaping NetworkChangeListener) -> (() -> Void) {
        guard let provider = provider else {
            fatalError("NetworkStateProvider not configured")
        }

        return provider.subscribe(listener: listener)
    }

    static func waitForWiFi() async throws {
        let state = try await getNetworkState()
        if state.type == .wifi && state.isConnected {
            return
        }

        try await withCheckedThrowingContinuation { continuation in
            let unsubscribe = subscribe { newState in
                if newState.type == .wifi && newState.isConnected {
                    unsubscribe()
                    continuation.resume()
                }
            }

            continuation.onCancellation = {
                unsubscribe()
            }
        }
    }
}
```

---

## PARITY CONTRACT

### Behavioral Invariants
1. **WiFi Detection**: MUST accurately detect WiFi vs cellular vs none
2. **WiFi Enforcement**: Downloads MUST only proceed on WiFi
3. **Subscription**: MUST support network change listeners with unsubscribe
4. **Async Wait**: MUST wait until WiFi is connected (resolves immediately if already on WiFi)
5. **Provider Injection**: MUST support runtime injection of network provider

### Edge Cases
- No network → ConnectionType.NONE, isConnected=false
- Airplane mode → ConnectionType.NONE
- WiFi + cellular simultaneously → prefer WiFi
- Provider not configured → throw error

### Network Type Detection
- Android: ConnectivityManager.NetworkCapabilities (TRANSPORT_WIFI, TRANSPORT_CELLULAR)
- iOS: NWPathMonitor (usesInterfaceType .wifi, .cellular)

---

## DEPENDENCIES

### Translation Order
- No dependencies on other business logic files
- Can be translated independently

### Integration Points
- Used by `lib/mapbox/offline-manager.ts` (NATIVE-OWNED) for download gating
- Used by `lib/ai/model-download.ts` (PORT) for WiFi enforcement
- UI components for network status display

### Test Porting
- Port tests from `lib/mapbox/__tests__/wifi-validator.test.ts` (if exists) to platform tests
- Test WiFi detection accuracy
- Test subscription behavior
- Test async waiting
