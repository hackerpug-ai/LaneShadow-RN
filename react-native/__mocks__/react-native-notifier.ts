/**
 * Mock for react-native-notifier
 */
export const Notifier = {
  showNotification: () => ({
    hide: () => {},
  }),
  hideNotification: () => {},
  clearQueue: () => {},
}

export default Notifier
