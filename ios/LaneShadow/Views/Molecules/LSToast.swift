import LaneShadowTheme
import NativeTheme
import SwiftUI

public enum LSToastVariant: CaseIterable, Sendable {
    case `default`
    case success
    case warning
    case error

    func resolvedStyle(in _: Theme) -> LSToastResolvedStyle {
        switch self {
        case .default:
            LSToastResolvedStyle(
                backgroundToken: "color.surface.overlay",
                foregroundToken: "color.content.primary",
                progressToken: "color.border.strong",
                backgroundColor: LaneShadowTheme.color.surface.overlay,
                foregroundColor: LaneShadowTheme.color.content.primary,
                progressColor: LaneShadowTheme.color.border.strong,
                icon: .clock,
                textColor: .primary
            )
        case .success:
            LSToastResolvedStyle(
                backgroundToken: "color.status.success.default",
                foregroundToken: "color.content.onSignal",
                progressToken: "color.status.success.default",
                backgroundColor: LaneShadowTheme.color.status.success.default,
                foregroundColor: LaneShadowTheme.color.content.onSignal,
                progressColor: LaneShadowTheme.color.status.success.default,
                icon: .bookmarkFill,
                textColor: .onSignal
            )
        case .warning:
            LSToastResolvedStyle(
                backgroundToken: "color.status.warning.default",
                foregroundToken: "color.content.onSignal",
                progressToken: "color.status.warning.default",
                backgroundColor: LaneShadowTheme.color.status.warning.default,
                foregroundColor: LaneShadowTheme.color.content.onSignal,
                progressColor: LaneShadowTheme.color.status.warning.default,
                icon: .therm,
                textColor: .onSignal
            )
        case .error:
            LSToastResolvedStyle(
                backgroundToken: "color.status.error.default",
                foregroundToken: "color.content.onSignal",
                progressToken: "color.status.error.default",
                backgroundColor: LaneShadowTheme.color.status.error.default,
                foregroundColor: LaneShadowTheme.color.content.onSignal,
                progressColor: LaneShadowTheme.color.status.error.default,
                icon: .close,
                textColor: .onSignal
            )
        }
    }
}

struct LSToastResolvedStyle {
    let backgroundToken: String
    let foregroundToken: String
    let progressToken: String
    let backgroundColor: Color
    let foregroundColor: Color
    let progressColor: Color
    let icon: IconName
    let textColor: ContentColor
}

struct LSToastEnterRecipe: Equatable {
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

struct LSToastDismissRecipe: Equatable {
    let name: String
    let visibleDurationMilliseconds: Int
    let animationDurationMilliseconds: Int
    let easing: [Double]

    var dismissalAnimation: Animation {
        .timingCurve(
            easing[0],
            easing[1],
            easing[2],
            easing[3],
            duration: Double(animationDurationMilliseconds) / 1000
        )
    }
}

final class LSToastDismissCoordinator {
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

public struct LSToast: View {
    @Environment(\.theme) private var theme
    @Binding private var isPresented: Bool
    @State private var isVisible = false
    @State private var progress: CGFloat = 1
    @State private var autoDismissTask: Task<Void, Never>?
    @State private var teardownTask: Task<Void, Never>?
    @State private var dismissCoordinator = LSToastDismissCoordinator()

    private let message: String
    private let detail: String?
    private let variant: LSToastVariant
    private let onDismiss: () -> Void

    public init(
        message: String,
        detail: String? = nil,
        variant: LSToastVariant = .default,
        isPresented: Binding<Bool>,
        onDismiss: @escaping () -> Void = {}
    ) {
        self.message = message
        self.detail = detail
        self.variant = variant
        _isPresented = isPresented
        self.onDismiss = onDismiss
    }

    public var body: some View {
        Group {
            if isPresented || isVisible {
                toastCard
                    .padding(.horizontal, theme.space.lg)
                    .padding(.bottom, theme.space.xxxl)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
                    .task(id: isPresented) {
                        if isPresented {
                            presentToast()
                        } else {
                            dismissToast(updateBinding: false)
                        }
                    }
                    .onDisappear {
                        autoDismissTask?.cancel()
                        teardownTask?.cancel()
                    }
            }
        }
    }

    static func show(
        message: String,
        detail: String? = nil,
        variant: LSToastVariant = .default,
        isPresented: Binding<Bool>,
        onDismiss: @escaping () -> Void = {}
    ) -> LSToast {
        LSToast(
            message: message,
            detail: detail,
            variant: variant,
            isPresented: isPresented,
            onDismiss: onDismiss
        )
    }

    private var toastCard: some View {
        let style = variant.resolvedStyle(in: theme)

        return VStack(alignment: .leading, spacing: theme.space.xs) {
            HStack(alignment: .top, spacing: theme.space.sm) {
                LSIcon(name: style.icon, size: .md, resolvedColorOverride: style.foregroundColor)

                VStack(alignment: .leading, spacing: theme.space.xs) {
                    LSText(message, variant: .body.md, color: style.textColor)

                    if let detail {
                        LSText(detail, variant: .body.sm, color: style.textColor)
                    }
                }

                Spacer(minLength: 0)

                LSButton("", variant: .ghost, size: .sm) {
                    dismissToast(updateBinding: true)
                }
                .overlay {
                    LSIcon(name: .close, size: .sm, resolvedColorOverride: style.foregroundColor)
                }
                .accessibilityLabel("Dismiss notification")
            }

            GeometryReader { geometry in
                Capsule()
                    .fill(style.progressColor)
                    .frame(width: geometry.size.width * progress, height: 2)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .frame(height: 2)
        }
        .padding(theme.space.lg)
        .frame(maxWidth: 340, alignment: .leading)
        .background(style.backgroundColor)
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.lg, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: theme.radius.lg, style: .continuous)
                .stroke(LaneShadowTheme.color.border.default, lineWidth: theme.borderWidth.hairline)
        }
        .shadow(
            color: theme.elevation.level8.shadowColor.opacity(theme.elevation.level8.opacity),
            radius: theme.elevation.level8.radius,
            x: theme.elevation.level8.offsetX,
            y: theme.elevation.level8.offsetY
        )
        .offset(y: isVisible ? 0 : theme.space.xxxl)
        .opacity(isVisible ? 1 : 0)
        .accessibilityElement(children: .contain)
        .accessibilityValue(Self.enterRecipe(in: theme).name)
        .accessibilityIdentifier("lstoast")
    }

    private func presentToast() {
        let dismissRecipe = Self.dismissRecipe(in: theme)

        dismissCoordinator.reset()
        autoDismissTask?.cancel()
        teardownTask?.cancel()
        progress = 1

        withAnimation(Self.enterRecipe(in: theme).animation) {
            isVisible = true
        }

        withAnimation(.linear(duration: Double(dismissRecipe.visibleDurationMilliseconds) / 1000)) {
            progress = 0
        }

        autoDismissTask = Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(dismissRecipe.visibleDurationMilliseconds))
            dismissToast(updateBinding: true)
        }
    }

    private func dismissToast(updateBinding: Bool) {
        let dismissRecipe = Self.dismissRecipe(in: theme)

        autoDismissTask?.cancel()
        teardownTask?.cancel()

        withAnimation(dismissRecipe.dismissalAnimation) {
            isVisible = false
        }

        teardownTask = Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(dismissRecipe.animationDurationMilliseconds))
            if updateBinding {
                isPresented = false
            }
            dismissCoordinator.dispatch(onDismiss)
        }
    }
}

extension LSToast {
    static func enterRecipe(in theme: Theme) -> LSToastEnterRecipe {
        LSToastEnterRecipe(
            name: "motion.recipe.chatOverlayEnter",
            durationMilliseconds: theme.motion.duration["standard"] ?? 240,
            easing: theme.motion.easing["decelerated"] ?? [0, 0, 0.2, 1]
        )
    }

    private static func dismissDurationMilliseconds(in theme: Theme) -> Int {
        // The semantic token file keeps recipes as references, so the toast resolves
        // the named dismiss contract through the backing duration token here.
        theme.motion.duration["fast"] ?? 120
    }

    static func dismissRecipe(in theme: Theme) -> LSToastDismissRecipe {
        let dismissDurationMilliseconds = dismissDurationMilliseconds(in: theme)

        return LSToastDismissRecipe(
            name: "motion.recipe.chatOverlayDismiss",
            visibleDurationMilliseconds: dismissDurationMilliseconds,
            animationDurationMilliseconds: dismissDurationMilliseconds,
            easing: theme.motion.easing["linear"] ?? [0, 0, 1, 1]
        )
    }
}
