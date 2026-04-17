import type { TokenCache } from '@clerk/clerk-expo'
import * as SecureStore from 'expo-secure-store'

export const clerkTokenCache: TokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key)
    } catch (error) {
      console.error('❌ Error retrieving token from SecureStore:', error)
      return null
    }
  },
  async saveToken(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value)
    } catch (error) {
      console.error('❌ Error saving token to SecureStore:', error)
    }
  },
  async clearToken(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key)
    } catch (error) {
      console.error('❌ Error clearing token from SecureStore:', error)
    }
  },
}
