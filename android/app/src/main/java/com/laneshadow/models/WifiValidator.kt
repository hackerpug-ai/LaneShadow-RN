package com.laneshadow.models

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

/**
 * WiFi connection validation for offline downloads.
 *
 * Ensures downloads only proceed over WiFi to prevent cellular data charges.
 * Matches TypeScript API from react-native/lib/mapbox/wifi-validator.ts
 *
 * Translation:
 * - TypeScript: export type ConnectionType = 'wifi' | 'cellular' | 'unknown' | 'none'
 * - Kotlin: enum class ConnectionType
 */
enum class ConnectionType {
    WIFI,
    CELLULAR,
    UNKNOWN,
    NONE
}

/**
 * Network state representation.
 * Translation of TypeScript: interface NetworkState
 */
data class NetworkState(
    val type: ConnectionType,
    val isConnected: Boolean
)

/**
 * Network state change listener.
 * Translation of TypeScript: type NetworkChangeListener = (state: NetworkState) => void
 */
typealias NetworkChangeListener = (NetworkState) -> Unit

/**
 * Network state provider interface for dependency injection.
 * Allows runtime injection of network state provider (matches TypeScript pattern).
 *
 * Translation of TypeScript:
 * let getNetworkStateFn: () => Promise<NetworkState>
 * let subscribeFn: (listener) => () => void
 */
interface NetworkStateProvider {
    suspend fun getNetworkState(): NetworkState
    fun subscribe(listener: NetworkChangeListener): () -> Unit
}

/**
 * Default implementation using Android ConnectivityManager.
 * Provides real network state detection for WiFi/cellular/none.
 *
 * This is the production implementation that would be configured at app startup.
 */
class DefaultNetworkStateProvider(
    private val context: Context
) : NetworkStateProvider {

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

/**
 * WiFi Validator - Singleton object matching TypeScript export.
 *
 * Translation of TypeScript:
 * export const WiFiValidator = {
 *   configure(opts),
 *   async isWiFi(),
 *   async getNetworkState(),
 *   subscribe(listener),
 *   async waitForWiFi()
 * }
 *
 * Usage:
 * 1. At app startup: WiFiValidator.configure(provider)
 * 2. Check connection: val isWifi = WiFiValidator.isWiFi()
 * 3. Wait for WiFi: WiFiValidator.waitForWiFi()
 * 4. Subscribe to changes: val unsubscribe = WiFiValidator.subscribe { state -> ... }
 */
object WiFiValidator {
    private var provider: NetworkStateProvider? = null

    /**
     * Configure the network state provider (called at app startup).
     * Translation of: configure(opts: { getNetworkState, subscribe })
     */
    fun configure(provider: NetworkStateProvider) {
        this.provider = provider
    }

    /**
     * Check if currently connected to WiFi.
     * Translation of: async isWiFi(): Promise<boolean>
     */
    suspend fun isWiFi(): Boolean {
        val state = getNetworkState()
        return state.type == ConnectionType.WIFI && state.isConnected
    }

    /**
     * Get current network state.
     * Translation of: async getNetworkState(): Promise<NetworkState>
     */
    suspend fun getNetworkState(): NetworkState {
        return provider?.getNetworkState()
            ?: throw IllegalStateException("NetworkStateProvider not configured. Call WiFiValidator.configure() first.")
    }

    /**
     * Subscribe to network changes. Returns unsubscribe function.
     * Translation of: subscribe(listener): () => void
     */
    fun subscribe(listener: NetworkChangeListener): () -> Unit {
        return provider?.subscribe(listener)
            ?: throw IllegalStateException("NetworkStateProvider not configured. Call WiFiValidator.configure() first.")
    }

    /**
     * Wait until WiFi is connected. Resolves immediately if already on WiFi.
     * Translation of: async waitForWiFi(): Promise<void>
     */
    suspend fun waitForWiFi() {
        val state = getNetworkState()
        if (state.type == ConnectionType.WIFI && state.isConnected) return

        suspendCancellableCoroutine { continuation ->
            var unsubscribe: (() -> Unit)? = null
            unsubscribe = subscribe { newState ->
                if (newState.type == ConnectionType.WIFI && newState.isConnected) {
                    unsubscribe?.invoke()
                    continuation.resume(Unit)
                }
            }

            continuation.invokeOnCancellation {
                unsubscribe?.invoke()
            }
        }
    }
}
