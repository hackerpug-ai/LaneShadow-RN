/**
 * Camera UI Color Constants
 *
 * Static colors for camera overlay UI that remain consistent across themes
 * Camera interface traditionally uses white/black overlays for clarity
 */

export const CAMERA_COLORS = {
  // Overlay backgrounds
  overlayDark: 'rgba(0, 0, 0, 0.3)', // Semi-transparent black for headers
  overlayDarker: 'rgba(0, 0, 0, 0.5)', // Darker for footers

  // Interactive elements
  buttonPressed: 'rgba(255, 255, 255, 0.3)',
  buttonDefault: 'rgba(255, 255, 255, 0.2)',

  // Text and icons - white for contrast on dark camera preview
  textPrimary: '#FFFFFF',
  iconColor: '#FFFFFF',

  // Helper text
  textSecondary: 'rgba(255, 255, 255, 0.7)',

  // Pure colors for capture button
  captureButtonBorder: '#FFFFFF',
  captureButtonInner: '#FFFFFF',

  // Camera background
  cameraBackground: '#000000',
} as const

export type CameraColor = keyof typeof CAMERA_COLORS
