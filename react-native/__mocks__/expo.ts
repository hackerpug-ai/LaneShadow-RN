/**
 * Mock for expo package
 * Provides stub implementations for Expo functionality
 */

export const Constants = {
  expoVersion: '54.0.0',
  deviceName: 'test-device',
  deviceId: 'test-device-id',
}

export const Platform = {
  OS: 'ios',
  isTesting: true,
}

export const requireOptionalNativeModule = (name: string) => null

export default {
  Constants,
  Platform,
  requireOptionalNativeModule,
}
