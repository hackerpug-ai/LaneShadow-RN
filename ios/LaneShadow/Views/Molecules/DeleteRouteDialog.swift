import LaneShadowTheme
import SwiftUI

// MARK: - Delete Route Dialog Component

/**
 * Delete route dialog molecule component
 *
 * Confirmation dialog for deleting routes with undo notice.
 * Following React Native component from react-native/components/ui/delete-route-dialog.tsx
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
 * - routeName: Name of the route being deleted
 * - onConfirm: Callback when user confirms deletion
 * - onDismiss: Callback when user cancels or dismisses
 * - testID: Optional test identifier for UI testing
 */
public struct LSDeleteRouteDialog: View {
    @Environment(\.theme) private var theme

    private let visible: Bool
    private let routeName: String
    private let onConfirm: () -> Void
    private let onDismiss: () -> Void
    private let testID: String?

    public init(
        visible: Bool,
        routeName: String,
        onConfirm: @escaping () -> Void,
        onDismiss: @escaping () -> Void,
        testID: String? = nil
    ) {
        self.visible = visible
        self.routeName = routeName
        self.onConfirm = onConfirm
        self.onDismiss = onDismiss
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        EmptyView()
            .alert(isPresented: .constant(visible)) {
                Alert(
                    title: Text("Delete Route")
                        .foregroundStyle(theme.colors.onSurface.default),
                    message: Text(
                        "Are you sure you want to delete \"\(routeName)\"? You can undo this within 5 seconds."
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
            .accessibilityIdentifier(testID ?? "delete-route-dialog")
    }
}

// MARK: - Preview

#Preview("DeleteRouteDialog - Shown") {
    VStack {
        Text("Parent View")
            .font(.headline)

        LSDeleteRouteDialog(
            visible: true,
            routeName: "Morning Commute",
            onConfirm: {
                print("Confirmed deletion")
            },
            onDismiss: {
                print("Cancelled")
            },
            testID: "delete-route-dialog-preview"
        )
    }
    .laneShadowTheme()
}

#Preview("DeleteRouteDialog - Hidden") {
    VStack {
        Text("Parent View")
            .font(.headline)
            .padding()

        LSDeleteRouteDialog(
            visible: false,
            routeName: "Evening Ride",
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
