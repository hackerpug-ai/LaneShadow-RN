import LaneShadowTheme
import SwiftUI

// MARK: - Delete Favorite Dialog Component

/**
 * Delete favorite dialog molecule component
 *
 * Confirmation dialog for deleting saved routes.
 * Following React Native component from react-native/components/ui/delete-favorite-dialog.tsx
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
 * - favoriteName: Name of the favorite being deleted
 * - onConfirm: Callback when user confirms deletion
 * - onDismiss: Callback when user cancels or dismisses
 * - testID: Optional test identifier for UI testing
 */
public struct LSDeleteFavoriteDialog: View {
    @Environment(\.theme) private var theme

    private let visible: Bool
    private let favoriteName: String
    private let onConfirm: () -> Void
    private let onDismiss: () -> Void
    private let testID: String?

    public init(
        visible: Bool,
        favoriteName: String,
        onConfirm: @escaping () -> Void,
        onDismiss: @escaping () -> Void,
        testID: String? = nil
    ) {
        self.visible = visible
        self.favoriteName = favoriteName
        self.onConfirm = onConfirm
        self.onDismiss = onDismiss
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        EmptyView()
            .alert(isPresented: .constant(visible)) {
                Alert(
                    title: Text("Delete saved route?")
                        .foregroundStyle(theme.colors.onSurface.default),
                    message: Text("Are you sure you want to delete \"\(favoriteName)\"?")
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
            .accessibilityIdentifier(testID ?? "delete-favorite-dialog")
    }
}

// MARK: - Preview

#Preview("DeleteFavoriteDialog - Shown") {
    VStack {
        Text("Parent View")
            .font(.headline)

        LSDeleteFavoriteDialog(
            visible: true,
            favoriteName: "Morning Commute",
            onConfirm: {
                print("Confirmed deletion")
            },
            onDismiss: {
                print("Cancelled")
            },
            testID: "delete-favorite-dialog-preview"
        )
    }
    .laneShadowTheme()
}

#Preview("DeleteFavoriteDialog - Hidden") {
    VStack {
        Text("Parent View")
            .font(.headline)
            .padding()

        LSDeleteFavoriteDialog(
            visible: false,
            favoriteName: "Evening Ride",
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
