import LaneShadowTheme
import SwiftUI

// MARK: - DownloadErrorSheet Component

/**
 * DownloadErrorSheet molecule component
 *
 * Bottom sheet dialog for download error states with retry and support options.
 * Following React Native component from react-native/components/offline/download-error-sheet.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Background: `theme.colors.surface.default`
 *   - Error icon background: `theme.colors.danger.default`
 *   - Error icon text: `theme.colors.onPrimary.default`
 *   - Title: `theme.colors.onSurface.default`
 *   - Message: `theme.colors.onSurface.default` with 0.6 opacity
 * - Layout:
 *   - Content padding: 24pt
 *   - Gap: `theme.space.lg` (16pt)
 *   - Error icon size: 64pt
 * - Typography:
 *   - Title: 18pt semibold (title.lg)
 *   - Message: 14pt regular (body.md)
 *   - Error icon: 32pt bold
 *
 * ## Parameters
 * - isVisible: Whether to show the error sheet
 * - onRetry: Callback when user taps retry button
 * - onClose: Callback when user cancels or dismisses the sheet
 * - error: Optional error message to display (defaults to generic message)
 * - retryCount: Number of retry attempts (defaults to 0, shows "Contact Support" at 3+)
 * - testID: Optional test ID for UI testing
 */
public struct LSDownloadErrorSheet: View {
    @Environment(\.theme) private var theme

    private let isVisible: Bool
    private let onRetry: () -> Void
    private let onClose: () -> Void
    private let error: String?
    private let retryCount: Int
    private let testID: String?

    private let defaultErrorMessage = "There was a problem downloading this map. Please check your connection and try again."

    public init(
        isVisible: Bool,
        onRetry: @escaping () -> Void,
        onClose: @escaping () -> Void,
        error: String? = nil,
        retryCount: Int = 0,
        testID: String? = nil
    ) {
        self.isVisible = isVisible
        self.onRetry = onRetry
        self.onClose = onClose
        self.error = error
        self.retryCount = retryCount
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        EmptyView()
            .sheet(isPresented: .constant(isVisible)) {
                sheetContent
            }
            .accessibilityIdentifier(testID ?? "download-error-sheet")
    }

    // MARK: - Sheet Content

    private var sheetContent: some View {
        VStack(spacing: 0) {
            // Drag indicator for bottom sheet
            RoundedRectangle(cornerRadius: 2)
                .fill(theme.colors.onSurface.default.opacity(0.3))
                .frame(width: 36, height: 4)
                .padding(.top, theme.space.md)
                .accessibilityHidden(true)

            VStack(spacing: theme.space.lg) {
                // Error icon (64x64 danger circle with "!" text)
                errorIcon
                    .accessibilityIdentifier(testID?.let { "\($0)-icon" } ?? "download-error-icon")

                // Title: "Download Failed"
                Text("Download Failed")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(theme.colors.onSurface.default)
                    .multilineTextAlignment(.center)
                    .accessibilityIdentifier(testID?.let { "\($0)-title" } ?? "download-error-title")

                // Error message
                Text(errorMessage)
                    .font(.system(size: 14, weight: .regular))
                    .foregroundStyle(theme.colors.onSurface.default.opacity(0.6))
                    .multilineTextAlignment(.center)
                    .accessibilityIdentifier(testID?.let { "\($0)-message" } ?? "download-error-message")

                // Retry Download button (default variant, lg size, full width)
                LSButton(
                    "Retry Download",
                    variant: .default,
                    size: .lg,
                    onPress: onRetry
                )
                .accessibilityIdentifier(testID?.let { "\($0)-retry" } ?? "download-error-retry")

                VStack(spacing: theme.space.md) {
                    // Contact Support button (ghost, shown when retryCount >= 3)
                    if showContactSupport {
                        LSButton(
                            "Contact Support",
                            variant: .ghost,
                            size: .default,
                            onPress: {
                                // TODO: Navigate to support flow
                                onClose()
                            }
                        )
                        .accessibilityIdentifier(testID?.let { "\($0)-support" } ?? "download-error-support")
                    }

                    // Cancel button (ghost, full width)
                    LSButton(
                        "Cancel",
                        variant: .ghost,
                        size: .default,
                        onPress: onClose
                    )
                    .accessibilityIdentifier(testID?.let { "\($0)-cancel" } ?? "download-error-cancel")
                }
            }
            .padding(.horizontal, 24)
            .padding(.vertical, theme.space.lg)
        }
        .background(theme.colors.surface.default)
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.xl))
        .presentationDetents([.large])
        .presentationDragIndicator(.hidden)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Download failed. \(errorMessage)")
    }

    // MARK: - Error Icon

    private var errorIcon: some View {
        ZStack {
            Circle()
                .fill(theme.colors.danger.default)
                .frame(width: 64, height: 64)

            Text("!")
                .font(.system(size: 32, weight: .bold))
                .foregroundStyle(theme.colors.onPrimary.default)
        }
    }

    // MARK: - Computed Properties

    private var errorMessage: String {
        error ?? defaultErrorMessage
    }

    private var showContactSupport: Bool {
        retryCount >= 3
    }
}

// MARK: - Preview

#Preview("DownloadErrorSheet - Default") {
    LSDownloadErrorSheet(
        isVisible: true,
        onRetry: {
            print("Retry tapped")
        },
        onClose: {
            print("Close tapped")
        },
        testID: "preview-download-error"
    )
    .laneShadowTheme()
}

#Preview("DownloadErrorSheet - Custom Error") {
    LSDownloadErrorSheet(
        isVisible: true,
        error: "Network connection failed. Please check your internet connection.",
        retryCount: 1,
        onRetry: {
            print("Retry tapped")
        },
        onClose: {
            print("Close tapped")
        },
        testID: "preview-custom-error"
    )
    .laneShadowTheme()
}

#Preview("DownloadErrorSheet - With Contact Support") {
    LSDownloadErrorSheet(
        isVisible: true,
        error: "Download failed after multiple attempts",
        retryCount: 4,
        onRetry: {
            print("Retry tapped")
        },
        onClose: {
            print("Close tapped")
        },
        testID: "preview-with-support"
    )
    .laneShadowTheme()
}

#Preview("DownloadErrorSheet - Hidden") {
    VStack {
        Text("Parent View")
            .font(.headline)
            .padding()

        LSDownloadErrorSheet(
            isVisible: false,
            onRetry: {
                print("Retry tapped")
            },
            onClose: {
                print("Close tapped")
            }
        )
    }
    .laneShadowTheme()
}
