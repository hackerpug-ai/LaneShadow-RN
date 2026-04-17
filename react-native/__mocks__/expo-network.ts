export async function getNetworkStateAsync(): Promise<{
  isConnected: boolean
  type: string | null
  isInternetReachable: boolean
}> {
  // Mock implementation for testing
  return {
    isConnected: true,
    type: 'WIFI',
    isInternetReachable: true,
  }
}
