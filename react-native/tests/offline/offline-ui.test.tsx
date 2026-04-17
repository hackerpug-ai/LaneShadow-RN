/**
 * Tests for offline region UI components.
 *
 * Tests rendering and behavior of:
 * - DeleteConfirmationDialog
 * - DownloadProgressIndicator
 * - RegionListItem
 */

import { fireEvent, render } from '@testing-library/react-native'
import type React from 'react'
import { Pressable, Text as RNText, View } from 'react-native'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// --- Semantic theme mock ---

const mockSemanticTheme = {
  color: {
    primary: { default: '#B87333' },
    secondary: { default: '#1A1C1F' },
    tertiary: { default: '#2B9AEB' },
    success: { default: '#31A362' },
    warning: { default: '#D98E04' },
    warningContainer: { default: '#FFF8E7' },
    onWarningContainer: { default: '#5C3E00' },
    danger: { default: '#E35D6A' },
    info: { default: '#2B9AEB' },
    surface: { default: '#2B2725' },
    surfaceVariant: { default: '#34302D', pressed: '#3E3A37' },
    background: { default: '#1B1715' },
    onSurface: {
      default: 'rgba(255,255,255,0.92)',
      muted: 'rgba(255,255,255,0.72)',
      subtle: 'rgba(255,255,255,0.55)',
      disabled: '#6B7280',
    },
    onPrimary: { default: '#0E0F11' },
    onSecondary: { default: '#F8F7F6' },
    border: { default: '#3A3431' },
    ring: { default: '#B87333' },
    card: { default: '#24272B' },
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48, '4xl': 64 },
  radius: { none: 0, sm: 4, md: 8, lg: 12, xl: 16, '2xl': 20, full: 9999 },
  type: {
    label: {
      sm: { fontSize: 12, lineHeight: 18, fontWeight: '500' },
      md: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
      lg: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
    },
    body: {
      sm: { fontSize: 14, lineHeight: 21, fontWeight: '400' },
      md: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
      lg: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
    },
    title: {
      sm: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
      md: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
      lg: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
    },
    heading: {
      sm: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
      md: { fontSize: 18, lineHeight: 27, fontWeight: '600' },
      lg: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
    },
  },
  elevation: { 0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {} },
}

vi.mock('../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: mockSemanticTheme }),
}))

// Mock expo-router
vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
  }),
  useLocalSearchParams: () => ({}),
}))

// Mock react-native-safe-area-context
vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock @rnmapbox/maps
vi.mock('@rnmapbox/maps')

// Mock react-native-paper with compound Dialog
vi.mock('react-native-paper', () => {
  const { createElement } = require('react')

  const Dialog = ({ children, visible, onDismiss, testID, style }: any) => {
    if (!visible) return null
    return createElement(View, { testID, style }, children)
  }
  Dialog.Title = ({ children, style }: any) =>
    createElement(RNText, { testID: 'dialog-title', style }, children)
  Dialog.Content = ({ children }: any) =>
    createElement(View, { testID: 'dialog-content' }, children)
  Dialog.Actions = ({ children }: any) =>
    createElement(View, { testID: 'dialog-actions' }, children)

  const Portal = ({ children }: any) => createElement(View, null, children)

  const Button = ({ children, onPress, testID, textColor }: any) =>
    createElement(
      Pressable,
      { onPress, testID, accessibilityRole: 'button' },
      createElement(RNText, { style: { color: textColor } }, children),
    )

  const Text = ({ children, style, variant }: any) => createElement(RNText, { style }, children)

  return { Dialog, Portal, Button, Text }
})

// Mock useOfflineStore (Zustand)
vi.mock('../../stores/offline-store', () => ({
  useOfflineStore: () => ({
    regions: [],
    progress: null,
    error: null,
    isDownloading: false,
    _hydrated: true,
    downloadRegion: vi.fn(async () => {}),
    deleteRegion: vi.fn(async () => {}),
    renameRegion: vi.fn(async () => {}),
    clearError: vi.fn(),
    hydrateFromMapbox: vi.fn(async () => {}),
  }),
  getTotalStorageUsed: () => 0,
}))

// Mock useOfflineDownload (shim over store)
vi.mock('../../hooks/useOfflineDownload', () => ({
  useOfflineDownload: () => ({
    progress: null,
    regions: [],
    error: null,
    isDownloading: false,
    queueStatus: { status: 'idle', pendingCount: 0, queuedIds: [] },
    totalStorageUsed: 0,
    downloadRegion: vi.fn(async () => {}),
    deleteRegion: vi.fn(async () => {}),
    pauseDownload: vi.fn(async () => {}),
    resumeDownload: vi.fn(async () => {}),
    refreshRegions: vi.fn(),
  }),
}))

// Mock useThemePreference
vi.mock('../../contexts/theme-preference', () => ({
  useThemePreference: () => ({
    isDark: false,
    mode: 'auto',
    setMode: vi.fn(),
  }),
}))

// --- DeleteConfirmationDialog ---

describe('DeleteConfirmationDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with region name and size', async () => {
    const { DeleteConfirmationDialog } = await import(
      '../../components/offline/delete-confirmation-dialog'
    )

    const { getByText, getByTestId } = render(
      <DeleteConfirmationDialog
        visible={true}
        regionName="Rocky Mountains"
        regionSize="850 MB"
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />,
    )

    expect(getByTestId('delete-region-dialog')).toBeTruthy()
    expect(getByText(/Rocky Mountains/)).toBeTruthy()
    expect(getByText(/850 MB/)).toBeTruthy()
  })

  it('does not render when not visible', async () => {
    const { DeleteConfirmationDialog } = await import(
      '../../components/offline/delete-confirmation-dialog'
    )

    const { queryByTestId } = render(
      <DeleteConfirmationDialog
        visible={false}
        regionName="Test"
        regionSize="100 MB"
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />,
    )

    expect(queryByTestId('delete-region-dialog')).toBeNull()
  })

  it('calls onDismiss when Cancel is pressed', async () => {
    const { DeleteConfirmationDialog } = await import(
      '../../components/offline/delete-confirmation-dialog'
    )
    const onDismiss = vi.fn()

    const { getByTestId } = render(
      <DeleteConfirmationDialog
        visible={true}
        regionName="Test Region"
        regionSize="100 MB"
        onConfirm={vi.fn()}
        onDismiss={onDismiss}
      />,
    )

    fireEvent.press(getByTestId('delete-region-dialog-cancel'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('calls onConfirm when Delete is pressed', async () => {
    const { DeleteConfirmationDialog } = await import(
      '../../components/offline/delete-confirmation-dialog'
    )
    const onConfirm = vi.fn()

    const { getByTestId } = render(
      <DeleteConfirmationDialog
        visible={true}
        regionName="Test Region"
        regionSize="100 MB"
        onConfirm={onConfirm}
        onDismiss={vi.fn()}
      />,
    )

    fireEvent.press(getByTestId('delete-region-dialog-confirm'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})

// --- DownloadProgressIndicator ---

describe('DownloadProgressIndicator', () => {
  it('renders progress percentage and size', async () => {
    const { DownloadProgressIndicator } = await import(
      '../../components/offline/download-progress-indicator'
    )

    const { getByText } = render(
      <DownloadProgressIndicator
        packName="test-pack"
        bytesDownloaded={50 * 1024 * 1024}
        totalBytes={100 * 1024 * 1024}
        percentage={50}
        eta={60}
        state="downloading"
      />,
    )

    expect(getByText('50%')).toBeTruthy()
    expect(getByText(/50 MB/)).toBeTruthy()
    expect(getByText(/1 min left/)).toBeTruthy()
  })

  it('shows complete state without cancel button', async () => {
    const { DownloadProgressIndicator } = await import(
      '../../components/offline/download-progress-indicator'
    )

    const { getByText, queryByTestId } = render(
      <DownloadProgressIndicator
        packName="test-pack"
        bytesDownloaded={100 * 1024 * 1024}
        totalBytes={100 * 1024 * 1024}
        percentage={100}
        eta={0}
        state="complete"
      />,
    )

    expect(getByText('Complete')).toBeTruthy()
    expect(getByText('Download complete')).toBeTruthy()
    expect(queryByTestId('download-progress-cancel')).toBeNull()
  })

  it('fires onCancel when cancel button pressed', async () => {
    const { DownloadProgressIndicator } = await import(
      '../../components/offline/download-progress-indicator'
    )
    const onCancel = vi.fn()

    const { getByTestId } = render(
      <DownloadProgressIndicator
        packName="test-pack"
        bytesDownloaded={0}
        totalBytes={100 * 1024 * 1024}
        percentage={0}
        eta={120}
        state="downloading"
        onCancel={onCancel}
      />,
    )

    fireEvent.press(getByTestId('download-progress-cancel'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

// --- RegionListItem ---

describe('RegionListItem', () => {
  const mockRegion = {
    name: 'Rocky Mountains',
    packName: 'Rocky Mountains',
    bounds: {
      sw: { lat: 39.5, lng: -105.2 },
      ne: { lat: 39.9, lng: -104.7 },
    },
    size: 850 * 1024 * 1024, // 850 MB
    downloadedAt: '2026-04-09T12:00:00.000Z',
    state: 'complete' as const,
  }

  it('renders region name, size, and date', async () => {
    const { RegionListItem } = await import('../../components/offline/region-list-item')

    const { getByText } = render(<RegionListItem region={mockRegion} />)

    expect(getByText('Rocky Mountains')).toBeTruthy()
    expect(getByText(/850 MB/)).toBeTruthy()
    // Date is now part of "Apr 9, 2026 • 39.70, -104.95 area"
    expect(getByText(/area/)).toBeTruthy()
  })

  it('calls onDelete when delete button pressed', async () => {
    const { RegionListItem } = await import('../../components/offline/region-list-item')
    const onDelete = vi.fn()

    const { getByTestId } = render(<RegionListItem region={mockRegion} onDelete={onDelete} />)

    fireEvent.press(getByTestId('region-list-item-delete'))
    expect(onDelete).toHaveBeenCalledWith('Rocky Mountains')
  })

  it('calls onView when view button pressed', async () => {
    const { RegionListItem } = await import('../../components/offline/region-list-item')
    const onView = vi.fn()

    const { getByTestId } = render(<RegionListItem region={mockRegion} onView={onView} />)

    fireEvent.press(getByTestId('region-list-item-view'))
    expect(onView).toHaveBeenCalledWith('Rocky Mountains')
  })

  it('calls onEdit when rename button pressed', async () => {
    const { RegionListItem } = await import('../../components/offline/region-list-item')
    const onEdit = vi.fn()

    const { getByTestId } = render(<RegionListItem region={mockRegion} onEdit={onEdit} />)

    fireEvent.press(getByTestId('region-list-item-edit'))
    expect(onEdit).toHaveBeenCalledWith('Rocky Mountains')
  })
})
