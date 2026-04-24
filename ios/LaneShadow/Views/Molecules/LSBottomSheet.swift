import LaneShadowTheme
import NativeTheme
import SwiftUI

public enum LSBottomSheetDetent: String, CaseIterable, Sendable {
    case small
    case medium
    case large

    public var fraction: CGFloat {
        switch self {
        case .small:
            0.25
        case .medium:
            0.5
        case .large:
            0.9
        }
    }

    var presentationDetent: PresentationDetent {
        .fraction(fraction)
    }
}

final class LSBottomSheetDismissCoordinator {
    private var hasDispatched = false

    func reset() {
        hasDispatched = false
    }

    func dispatch(_ action: () -> Void) {
        guard !hasDispatched else { return }
        hasDispatched = true
        action()
    }
}

struct LSOverlayEnterRecipe: Equatable {
    let name: String
    let durationMilliseconds: Int
    let easing: [Double]

    var animation: Animation {
        .timingCurve(
            easing[0],
            easing[1],
            easing[2],
            easing[3],
            duration: Double(durationMilliseconds) / 1000
        )
    }
}

public struct LSBottomSheet<Content: View>: View {
    @Environment(\.theme) private var theme
    @Binding private var isPresented: Bool
    @State private var selectedDetent: PresentationDetent
    @State private var dismissCoordinator = LSBottomSheetDismissCoordinator()

    private let detent: LSBottomSheetDetent
    private let onDismiss: () -> Void
    private let content: Content

    static var surfaceTokenPath: String {
        "color.surface.overlay"
    }

    static var dragHandleTokenPath: String {
        "color.border.subtle"
    }

    static var dragHandleWidth: CGFloat {
        36
    }

    public init(
        isPresented: Binding<Bool>,
        detent: LSBottomSheetDetent = .medium,
        onDismiss: @escaping () -> Void = {},
        @ViewBuilder content: () -> Content
    ) {
        _isPresented = isPresented
        _selectedDetent = State(initialValue: detent.presentationDetent)
        self.detent = detent
        self.onDismiss = onDismiss
        self.content = content()
    }

    public var body: some View {
        EmptyView()
            .sheet(
                isPresented: $isPresented,
                onDismiss: {
                    dismissCoordinator.dispatch(onDismiss)
                }
            ) {
                sheetSurface
                    .presentationDetents(
                        [.fraction(0.25), .fraction(0.5), .fraction(0.9)],
                        selection: $selectedDetent
                    )
                    .presentationDragIndicator(.hidden)
                    .presentationBackground(.clear)
            }
            .onChange(of: isPresented) { _, newValue in
                guard newValue else { return }
                dismissCoordinator.reset()
                selectedDetent = detent.presentationDetent
            }
    }

    private var sheetSurface: some View {
        VStack(alignment: .leading, spacing: theme.space.md) {
            Capsule()
                .fill(LaneShadowTheme.color.border.subtle)
                .frame(width: Self.dragHandleWidth, height: 4)
                .frame(maxWidth: .infinity)
                .accessibilityLabel("Drag to resize")
                .accessibilityIdentifier("lsbottomsheet-handle")

            content
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
        .padding(theme.space.lg)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(LaneShadowTheme.color.surface.overlay)
        .clipShape(
            UnevenRoundedRectangle(
                topLeadingRadius: theme.radius.lg,
                bottomLeadingRadius: 0,
                bottomTrailingRadius: 0,
                topTrailingRadius: theme.radius.lg,
                style: .continuous
            )
        )
        .animation(Self.enterRecipe(in: theme).animation, value: selectedDetent)
        .accessibilityElement(children: .contain)
        .accessibilityValue(Self.enterRecipe(in: theme).name)
        .accessibilityIdentifier("lsbottomsheet")
    }
}

extension LSBottomSheet {
    static func enterRecipe(in theme: Theme) -> LSOverlayEnterRecipe {
        LSOverlayEnterRecipe(
            name: "motion.recipe.chatOverlayEnter",
            durationMilliseconds: theme.motion.duration["standard"] ?? 240,
            easing: theme.motion.easing["decelerated"] ?? [0, 0, 0.2, 1]
        )
    }
}
