import * as SecureStore from 'expo-secure-store'
import type { TokenCache } from '@clerk/clerk-expo'

const storeKey = async (key: string, value: string | null): Promise<void> => {
  if (value === null) {
    await SecureStore.deleteItemAsync(key)
    return
  }
  await SecureStore.setItemAsync(key, value)
}

export const clerkTokenCache: TokenCache = {
  getToken: async (key: string): Promise<string | null> => {
    return SecureStore.getItemAsync(key)
  },
  saveToken: async (key: string, value: string): Promise<void> => {
    await storeKey(key, value)
  },
  clearToken: async (key: string): Promise<void> => {
    await storeKey(key, null)
  },
}
