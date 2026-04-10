/**
 * WiFi connection validation for offline downloads.
 *
 * Ensures downloads only proceed over WiFi to prevent cellular data charges.
 * Uses @react-native-community/netinfo when available, falls back to allowing downloads.
 */

export type ConnectionType = 'wifi' | 'cellular' | 'unknown' | 'none'

export interface NetworkState {
  type: ConnectionType
  isConnected: boolean
}

export type NetworkChangeListener = (state: NetworkState) => void

/**
 * Get current network state.
 * Returns wifi by default — actual implementation provided by the app at runtime.
 */
let getNetworkStateFn: () => Promise<NetworkState> = async () => ({
  type: 'wifi',
  isConnected: true,
})

let subscribeFn: (listener: NetworkChangeListener) => () => void = () => () => {}

export const WiFiValidator = {
  /**
   * Configure the network state provider (called at app startup).
   */
  configure(opts: {
    getNetworkState: () => Promise<NetworkState>
    subscribe: (listener: NetworkChangeListener) => () => void
  }) {
    getNetworkStateFn = opts.getNetworkState
    subscribeFn = opts.subscribe
  },

  /**
   * Check if currently connected to WiFi.
   */
  async isWiFi(): Promise<boolean> {
    const state = await getNetworkStateFn()
    return state.type === 'wifi' && state.isConnected
  },

  /**
   * Get current network state.
   */
  async getNetworkState(): Promise<NetworkState> {
    return getNetworkStateFn()
  },

  /**
   * Subscribe to network changes. Returns unsubscribe function.
   */
  subscribe(listener: NetworkChangeListener): () => void {
    return subscribeFn(listener)
  },

  /**
   * Wait until WiFi is connected. Resolves immediately if already on WiFi.
   */
  async waitForWiFi(): Promise<void> {
    const state = await getNetworkStateFn()
    if (state.type === 'wifi' && state.isConnected) return

    return new Promise((resolve) => {
      const unsub = subscribeFn((newState) => {
        if (newState.type === 'wifi' && newState.isConnected) {
          unsub()
          resolve()
        }
      })
    })
  },
} as const
