import LaneShadowTheme
import NativeTheme
import SwiftUI

public struct LSModalAction {
    let title: String
    let variant: LSButtonVariant
    let action: () -> Void

    public static func destructive(_ title: String, action: @escaping () -> Void) -> LSModalAction {
        LSModalAction(title: title, variant: .destructive, action: action)
    }

    public static func ghost(_ title: String, action: @escaping () -> Void) -> LSModalAction {
        LSModalAction(title: title, variant: .ghost, action: action)
    }

    public static func primary(_ title: String, action: @escaping () -> Void) -> LSModalAction {
        LSModalAction(title: title, variant: .primary, action: action)
    }
}

public struct LSModal: View {
    @Environment(\.theme) private var theme
    @Binding private var isPresented: Bool

    private let title: String
    private let bodyText: String
    private let primary: LSModalAction
    private let secondary: LSModalAction?
    private let onDismiss: () -> Void

    public init(
        title: String,
        body: String,
        primary: LSModalAction,
        secondary: LSModalAction? = nil,
        isPresented: Binding<Bool>,
        onDismiss: @escaping () -> Void = {}
    ) {
        self.title = title
        bodyText = body
        self.primary = primary
        self.secondary = secondary
        _isPresented = isPresented
        self.onDismiss = onDismiss
    }

    public var bodyView: some View {
        let body = bodyText

        return VStack(alignment: .leading, spacing: theme.space.md) {
            LSText(title, variant: .title.md)
                .accessibilityIdentifier("lsmodal-title")

            LSText(body, variant: .body.md, color: .secondary)
                .accessibilityIdentifier("lsmodal-body")

            HStack(spacing: theme.space.sm) {
                if let secondary {
                    LSButton(secondary.title, variant: secondary.variant) {
                        dismiss(using: secondary)
                    }
                }

                LSButton(primary.title, variant: primary.variant) {
                    dismiss(using: primary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .padding(theme.space.xl)
        .background(LaneShadowTheme.color.surface.overlay)
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
        .frame(maxWidth: 288)
        .accessibilityElement(children: .contain)
        .accessibilityValue(Self.enterRecipe(in: theme).name)
        .accessibilityIdentifier("lsmodal")
    }

    public var body: some View {
        Group {
            if isPresented {
                ZStack {
                    LSScrim(
                        opacity: LSScrim.defaultOpacity,
                        blocking: secondary != nil,
                        onTap: secondary == nil ? nil : {
                            if let secondary {
                                dismiss(using: secondary)
                            }
                        }
                    )

                    bodyView
                        .padding(theme.space.xl)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .transition(.opacity.combined(with: .scale(scale: 0.94)))
                .animation(Self.enterRecipe(in: theme).animation, value: isPresented)
            }
        }
    }

    static func dispatch(
        action: LSModalAction?,
        isPresented: inout Bool,
        onDismiss: (() -> Void)? = nil
    ) {
        action?.action()
        isPresented = false
        onDismiss?()
    }

    private func dismiss(using action: LSModalAction?) {
        var nextPresentationState = isPresented
        Self.dispatch(
            action: action,
            isPresented: &nextPresentationState,
            onDismiss: onDismiss
        )
        isPresented = nextPresentationState
    }
}

extension LSModal {
    static func enterRecipe(in theme: Theme) -> LSOverlayEnterRecipe {
        LSOverlayEnterRecipe(
            name: "motion.recipe.chatOverlayEnter",
            durationMilliseconds: theme.motion.duration["standard"] ?? 240,
            easing: theme.motion.easing["decelerated"] ?? [0, 0, 0.2, 1]
        )
    }
}
