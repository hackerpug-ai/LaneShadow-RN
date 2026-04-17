/**
 * Strongly-Typed Async Storage Hook
 *
 * Centralized storage management with type safety
 * Uses expo-secure-store for native, localStorage for web
 *
 * ## Usage Guidelines
 *
 * ### Imperative API (asyncStorage)
 * Use for one-time reads/writes without reactivity:
 * - In context providers (avoids unnecessary re-renders)
 * - In event handlers
 * - In useEffect callbacks
 * - In async functions
 *
 * ```typescript
 * // ✅ Good: Use in providers/event handlers
 * const token = await asyncStorage.getItem('workos_access_token')
 * await asyncStorage.setItem('active_organization_id', orgId)
 * ```
 *
 * ### Reactive Hooks (useAsyncStorage)
 * Use when components need to react to storage changes:
 * - Individual components that display stored values
 * - Components that need live updates when storage changes
 * - Settings screens
 *
 * ```typescript
 * // ✅ Good: Use in components that need reactivity
 * const [theme, setTheme] = useAsyncStorage('theme_preference')
 * ```
 *
 * ⚠️ **DO NOT use reactive hooks in context providers** - they cause
 * unnecessary re-renders for all consumers!
 */

import * as SecureStore from 'expo-secure-store'
import { useCallback, useEffect, useState } from 'react'
import { Platform } from 'react-native'

/**
 * Storage Key Registry
 * All storage keys and their types defined in one place
 */
export type StorageSchema = {
  // Auth tokens
  workos_access_token: string
  workos_refresh_token: string
  workos_token_expiry: string // Unix timestamp as string
  workos_code_verifier: string

  // Session state
  active_organization_id: string // Convex organization ID

  // App preferences (future)
  theme_preference?: 'light' | 'dark' | 'auto'
  notifications_enabled?: 'true' | 'false'
}

export type StorageKey = keyof StorageSchema

/**
 * Storage Adapter Interface
 */
type StorageAdapter = {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  deleteItem: (key: string) => Promise<void>
}

/**
 * Web Storage Adapter (localStorage)
 */
const webStorageAdapter: StorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (typeof window === 'undefined' || !('localStorage' in window)) return null
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (typeof window === 'undefined' || !('localStorage' in window)) return
      window.localStorage.setItem(key, value)
    } catch {
      // ignore
    }
  },
  async deleteItem(key: string): Promise<void> {
    try {
      if (typeof window === 'undefined' || !('localStorage' in window)) return
      window.localStorage.removeItem(key)
    } catch {
      // ignore
    }
  },
}

/**
 * Native Storage Adapter (SecureStore)
 */
const secureStoreAdapter: StorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key)
  },
  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value)
  },
  async deleteItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key)
  },
}

// Platform-specific storage adapter
const storage: StorageAdapter = Platform.OS === 'web' ? webStorageAdapter : secureStoreAdapter

/**
 * Type-safe storage operations
 */
export const asyncStorage = {
  /**
   * Get item from storage
   */
  async getItem<K extends StorageKey>(key: K): Promise<StorageSchema[K] | null> {
    try {
      const value = await storage.getItem(key)
      return value as StorageSchema[K] | null
    } catch (_error) {
      return null
    }
  },

  /**
   * Set item in storage
   */
  async setItem<K extends StorageKey>(key: K, value: NonNullable<StorageSchema[K]>): Promise<void> {
    try {
      await storage.setItem(key, value as string)
    } catch (_error) {}
  },

  /**
   * Remove item from storage
   */
  async removeItem<K extends StorageKey>(key: K): Promise<void> {
    try {
      await storage.deleteItem(key)
    } catch (_error) {}
  },

  /**
   * Clear multiple items
   */
  async removeItems(keys: StorageKey[]): Promise<void> {
    await Promise.all(keys.map((key) => this.removeItem(key)))
  },

  /**
   * Clear all storage (use with caution!)
   */
  async clearAll(): Promise<void> {
    const allKeys: StorageKey[] = [
      'workos_access_token',
      'workos_refresh_token',
      'workos_token_expiry',
      'workos_code_verifier',
      'active_organization_id',
    ]
    await this.removeItems(allKeys)
  },
}

/**
 * Hook for reactive storage access
 * Returns [value, setValue, removeValue, isLoading]
 */
export const useAsyncStorage = <K extends StorageKey>(
  key: K,
): [
  StorageSchema[K] | null,
  (value: NonNullable<StorageSchema[K]>) => Promise<void>,
  () => Promise<void>,
  boolean,
] => {
  const [value, setValue] = useState<StorageSchema[K] | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load initial value
  useEffect(() => {
    const loadValue = async () => {
      setIsLoading(true)
      const storedValue = await asyncStorage.getItem(key)
      setValue(storedValue)
      setIsLoading(false)
    }

    loadValue()
  }, [key])

  // Set value (updates state and storage)
  const setStoredValue = useCallback(
    async (newValue: NonNullable<StorageSchema[K]>) => {
      setValue(newValue)
      await asyncStorage.setItem(key, newValue)
    },
    [key],
  )

  // Remove value (updates state and storage)
  const removeValue = useCallback(async () => {
    setValue(null)
    await asyncStorage.removeItem(key)
  }, [key])

  return [value, setStoredValue, removeValue, isLoading]
}

/**
 * Hook for multiple storage keys
 */
export const useMultipleAsyncStorage = <K extends StorageKey>(
  keys: K[],
): [Record<K, StorageSchema[K] | null>, boolean] => {
  const [values, setValues] = useState<Record<K, StorageSchema[K] | null>>({} as any)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadValues = async () => {
      setIsLoading(true)
      const results = await Promise.all(keys.map((key) => asyncStorage.getItem(key)))

      const valueMap = {} as Record<K, StorageSchema[K] | null>
      keys.forEach((key, index) => {
        valueMap[key] = results[index] ?? null
      })

      setValues(valueMap)
      setIsLoading(false)
    }

    loadValues()
  }, [keys.map, keys.forEach])

  return [values, isLoading]
}
