/**
 * Download Error Sheet
 * Bottom sheet shown when download fails
 *
 * Features:
 * - User-friendly error message with copper accent
 * - Retry Download button
 * - Contact Support link (after multiple failures)
 * - No technical error codes shown to users
 */

import type React from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { BottomSheetWrapper } from '../sheets/bottom-sheet-wrapper'
import { Button } from '../ui/button'

export interface DownloadErrorSheetProps {
  isVisible: boolean
  onRetry: () => void
  onClose: () => void
  error?: string
  retryCount?: number
  testID?: string
}

export const DownloadErrorSheet: React.FC<DownloadErrorSheetProps> = ({
  isVisible,
  onRetry,
  onClose,
  error,
  retryCount = 0,
  testID = 'download-error-sheet',
}) => {
  const { semantic } = useSemanticTheme()

  // Show support link after 3 retries
  const showSupportLink = retryCount >= 3

  return (
    <BottomSheetWrapper isVisible={isVisible} onClose={onClose} testID={testID} preset="content">
      <View style={[styles.content, { gap: semantic.space.lg }]}>
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: semantic.color.danger.default,
              borderRadius: semantic.radius.full,
            },
          ]}
        >
          <Text
            variant="headlineLarge"
            style={[
              styles.icon,
              {
                color: semantic.color.onPrimary.default,
              },
            ]}
          >
            !
          </Text>
        </View>

        {/* Title */}
        <Text
          variant="titleLarge"
          style={[
            semantic.type.title.lg,
            { color: semantic.color.onSurface.default, textAlign: 'center' },
          ]}
        >
          Download Failed
        </Text>

        {/* Message */}
        <Text
          variant="bodyMedium"
          style={[
            semantic.type.body.md,
            { color: semantic.color.onSurface.muted, textAlign: 'center' },
          ]}
        >
          {error ||
            'There was a problem downloading your Shadow. Please check your connection and try again.'}
        </Text>

        {/* Retry Button */}
        <Button
          variant="default"
          size="lg"
          onPress={onRetry}
          testID={`${testID}-retry-button`}
          style={{ width: '100%' }}
        >
          Retry Download
        </Button>

        {/* Support Link (shown after multiple failures) */}
        {showSupportLink && (
          <Button
            variant="ghost"
            size="default"
            onPress={() => {
              // In production, this would open support chat or email
              // console.log('Contact support pressed')
            }}
            testID={`${testID}-support-button`}
            style={{ width: '100%' }}
          >
            Contact Support
          </Button>
        )}

        {/* Cancel Button */}
        <Button
          variant="ghost"
          size="default"
          onPress={onClose}
          testID={`${testID}-cancel-button`}
          style={{ width: '100%' }}
        >
          Cancel
        </Button>
      </View>
    </BottomSheetWrapper>
  )
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
    fontWeight: '700',
  },
})
