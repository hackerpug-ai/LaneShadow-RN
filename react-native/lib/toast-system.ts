/**
 * Centralized Toast Notification System
 *
 * Provides theme-aware toast notifications for success, error, warning,
 * and info states. Reuses existing notification infrastructure.
 *
 * Features:
 * - Automatic theme styling via semantic tokens
 * - Multiple toast types (success, error, warning, info)
 * - Configurable duration
 * - Queue management to prevent notification spam
 */

import { Notifier } from 'react-native-notifier'
import { ErrorToast } from '../components/toasts/error-toast'
import { InfoToast } from '../components/toasts/info-toast'
import { SuccessToast } from '../components/toasts/success-toast'
import { WarningToast } from '../components/toasts/warning-toast'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastOptions {
  title?: string
  message: string
  duration?: number
  showCloseButton?: boolean
  onDismiss?: () => void
}

/**
 * Show a toast notification
 *
 * @param type - Toast type (success, error, warning, info)
 * @param options - Toast options
 */
export const showToast = (type: ToastType, options: ToastOptions) => {
  const { title, message, duration = 4000, showCloseButton = true, onDismiss } = options

  const Component = {
    success: SuccessToast,
    error: ErrorToast,
    warning: WarningToast,
    info: InfoToast,
  }[type]

  const defaultTitle = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
  }[type]

  Notifier.showNotification({
    title: title || defaultTitle,
    description: message,
    duration,
    showAnimationDuration: 300,
    hideAnimationDuration: 300,
    Component,
    componentProps: {
      showCloseButton,
    },
    onHidden: onDismiss,
    queueMode: 'next', // Don't spam - queue notifications
    swipeEnabled: true,
  })
}

/**
 * Convenience functions for each toast type
 */
export const toast = {
  success: (message: string, options?: Partial<ToastOptions>) => {
    showToast('success', { message, ...options })
  },

  error: (message: string, options?: Partial<ToastOptions>) => {
    showToast('error', { message, duration: 5000, ...options }) // Errors stay longer
  },

  warning: (message: string, options?: Partial<ToastOptions>) => {
    showToast('warning', { message, ...options })
  },

  info: (message: string, options?: Partial<ToastOptions>) => {
    showToast('info', { message, ...options })
  },

  /**
   * Hide all active toasts
   */
  hideAll: () => {
    Notifier.clearQueue()
    Notifier.hideNotification()
  },

  /**
   * Hide the current toast
   */
  hide: () => {
    Notifier.hideNotification()
  },
}
