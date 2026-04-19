import LaneShadowTheme
import SwiftUI

// MARK: - Delete Confirmation Dialog Component

/**
 * Delete confirmation dialog molecule component
 *
 * Confirmation dialog for deleting offline maps.
 * Following React Native component from react-native/components/ui/delete-confirmation-dialog.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Background: `theme.colors.surface.default`
 *   - Text: `theme.colors.onSurface.default`
 *   - Delete button: `theme.colors.danger.default`
 * - Layout:
 *   - Native SwiftUI alert/dialog styling
 *
 * ## Parameters
 * - visible: Whether to show the dialog
 * - regionName: Name of the offline map region being deleted
 * - regionSize: Size of the offline map region (e.g., "125 MB")
 * - onConfirm: Callback when user confirms deletion
 * - onDismiss: Callback when user cancels or dismisses
 * - testID: Optional test identifier for UI testing
 */
public struct LSDeleteConfirmationDialog: View {
    @Environment(\.theme) private var theme

    private let visible: Bool
    private let regionName: String
    private let regionSize: String
    private let onConfirm: () -> Void
    private let onDismiss: () -> Void
    private let testID: String?

    public init(
        visible: Bool,
        regionName: String,
        regionSize: String,
        onConfirm: @escaping () -> Void,
        onDismiss: @escaping () -> Void,
        testID: String? = nil
    ) {
        self.visible = visible
        self.regionName = regionName
        self.regionSize = regionSize
        self.onConfirm = onConfirm
        self.onDismiss = onDismiss
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        EmptyView()
            .alert(isPresented: .constant(visible)) {
                Alert(
                    title: Text("Delete Offline Map")
                        .foregroundStyle(theme.colors.onSurface.default),
                    message: Text(
                        "Delete \"\(regionName)\" (\(regionSize))? This map will no longer be available offline."
                    )
                    .foregroundStyle(theme.colors.onSurface.default),
                    primaryButton: .destructive(
                        Text("Delete")
                            .foregroundStyle(theme.colors.danger.default)
                    ) {
                        onConfirm()
                    },
                    secondaryButton: .cancel(
                        Text("Cancel")
                            .foregroundStyle(theme.colors.onSurface.default)
                    ) {
                        onDismiss()
                    }
                )
            }
            .accessibilityIdentifier(testID ?? "delete-confirmation-dialog")
            .accessibilityElement(children: .contain)
            .accessibilityLabel("Delete offline map confirmation")
    }
}

// MARK: - Preview

#Preview("DeleteConfirmationDialog - Shown") {
    VStack {
        Text("Parent View")
            .font(.headline)

        LSDeleteConfirmationDialog(
            visible: true,
            regionName: "San Francisco Bay Area",
            regionSize: "125 MB",
            onConfirm: {
                print("Confirmed deletion")
            },
            onDismiss: {
                print("Cancelled")
            },
            testID: "delete-confirmation-dialog-preview"
        )
    }
    .laneShadowTheme()
}

#Preview("DeleteConfirmationDialog - Hidden") {
    VStack {
        Text("Parent View")
            .font(.headline)
            .padding()

        LSDeleteConfirmationDialog(
            visible: false,
            regionName: "Los Angeles Metro",
            regionSize: "98 MB",
            onConfirm: {
                print("Confirmed deletion")
            },
            onDismiss: {
                print("Cancelled")
            }
        )
    }
    .laneShadowTheme()
}

#Preview("DeleteConfirmationDialog - Large Region") {
    VStack {
        Text("Parent View")
            .font(.headline)

        LSDeleteConfirmationDialog(
            visible: true,
            regionName: "California Central Coast",
            regionSize: "512 MB",
            onConfirm: {
                print("Confirmed deletion")
            },
            onDismiss: {
                print("Cancelled")
            }
        )
    }
    .laneShadowTheme()
}
