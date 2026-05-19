import SwiftUI

// MARK: - Slot API Types for LSMapLayer

/// A glass-styled overlay slot that can be positioned at top or bottom of the map layer.
@MainActor
public struct GlassOverlaySlot: Identifiable {
    public let id: String
    public let content: () -> AnyView

    public init(id: String, @ViewBuilder content: @escaping () -> some View) {
        self.id = id
        self.content = { AnyView(content()) }
    }
}

/// Scrim overlay specification with opacity control and an optional
/// tap-to-dismiss callback. When `onTap` is non-nil, LSScrim renders as
/// blocking and routes taps through this closure.
public struct ScrimSpec: Sendable {
    public let opacity: Double
    public let onTap: (@Sendable () -> Void)?

    @MainActor
    public init(
        opacity: Double = LSScrim.defaultOpacity,
        onTap: (@Sendable () -> Void)? = nil
    ) {
        self.opacity = opacity
        self.onTap = onTap
    }
}

/// Leading drawer specification (e.g., SessionsDrawer).
@MainActor
public struct DrawerSpec {
    public let content: () -> AnyView
    public let onDismiss: @Sendable () -> Void

    public init(@ViewBuilder content: @escaping () -> some View, onDismiss: @escaping @Sendable () -> Void) {
        self.content = { AnyView(content()) }
        self.onDismiss = onDismiss
    }
}

/// Bottom sheet specification (e.g., RouteSheet).
@MainActor
public struct BottomSheetSpec {
    public enum Detent: Sendable {
        case medium
        case large

        var presentationDetent: PresentationDetent {
            switch self {
            case .medium:
                .fraction(0.5)
            case .large:
                .fraction(0.9)
            }
        }
    }

    public let content: () -> AnyView
    public let detent: Detent

    public init(detent: Detent = .medium, @ViewBuilder content: @escaping () -> some View) {
        self.detent = detent
        self.content = { AnyView(content()) }
    }
}
