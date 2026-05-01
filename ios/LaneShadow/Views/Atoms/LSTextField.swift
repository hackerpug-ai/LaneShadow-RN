import LaneShadowTheme
import NativeTheme
import SwiftUI

public struct LSTextField: View {
    struct ResolvedTokens {
        let minHeight: CGFloat
        let horizontalPadding: CGFloat
        let cornerRadius: CGFloat
        let borderWidth: CGFloat
        let background: Color
        let border: Color
        let textColor: Color
        let placeholderColor: Color
        let helperColor: Color
        let iconColor: Color
        let iconContentColor: IconContentColor
        let iconSize: CGFloat
        let iconSpacing: CGFloat
        let textStyle: TypographyStyle
        let helperVariant: TypographyVariant
        let opacity: CGFloat
    }

    @Environment(\.theme) private var theme
    @FocusState private var isFocused: Bool

    @Binding private var value: String
    private let placeholder: String?
    private let state: InputState
    private let isSecureEntry: Bool
    private let leadingIcon: IconName?
    private let trailingIcon: IconName?
    private let leadingSymbolName: String?
    private let trailingSymbolName: String?
    private let helperText: String?
    private let inputAccessibilityIdentifier: String?

    public init(
        value: Binding<String>,
        placeholder: String? = nil,
        state: InputState = .default,
        isSecureEntry: Bool = false,
        leadingIcon: IconName? = nil,
        trailingIcon: IconName? = nil,
        leadingSymbolName: String? = nil,
        trailingSymbolName: String? = nil,
        helperText: String? = nil,
        inputAccessibilityIdentifier: String? = nil
    ) {
        _value = value
        self.placeholder = placeholder
        self.state = state
        self.isSecureEntry = isSecureEntry
        self.leadingIcon = leadingIcon
        self.trailingIcon = trailingIcon
        self.leadingSymbolName = leadingSymbolName
        self.trailingSymbolName = trailingSymbolName
        self.helperText = helperText
        self.inputAccessibilityIdentifier = inputAccessibilityIdentifier
    }

    public var body: some View {
        let tokens = Self.resolvedTokens(for: state, isFocused: isFocused, theme: theme)

        VStack(alignment: .leading, spacing: theme.space.xs) {
            HStack(spacing: tokens.iconSpacing) {
                if let leadingSymbolName {
                    LSIconSymbolIOS(
                        name: leadingSymbolName,
                        size: tokens.iconSize,
                        color: tokens.iconContentColor
                    )
                    .frame(width: tokens.iconSize, height: tokens.iconSize)
                } else if let leadingIcon {
                    LSIcon(name: leadingIcon, size: .sm, resolvedColorOverride: tokens.iconColor)
                        .frame(width: tokens.iconSize, height: tokens.iconSize)
                }

                inputField(tokens: tokens)

                if let trailingSymbolName {
                    LSIconSymbolIOS(
                        name: trailingSymbolName,
                        size: tokens.iconSize,
                        color: tokens.iconContentColor
                    )
                    .frame(width: tokens.iconSize, height: tokens.iconSize)
                } else if let trailingIcon {
                    LSIcon(name: trailingIcon, size: .sm, resolvedColorOverride: tokens.iconColor)
                        .frame(width: tokens.iconSize, height: tokens.iconSize)
                }
            }
            .padding(.horizontal, tokens.horizontalPadding)
            .frame(minHeight: tokens.minHeight)
            .background(tokens.background)
            .clipShape(RoundedRectangle(cornerRadius: tokens.cornerRadius))
            .overlay {
                RoundedRectangle(cornerRadius: tokens.cornerRadius)
                    .stroke(tokens.border, lineWidth: tokens.borderWidth)
            }
            .opacity(tokens.opacity)

            if let helperText {
                LSText(helperText, variant: tokens.helperVariant, color: .tertiary)
                    .accessibilityIdentifier("lstextfield-helper")
            }
        }
        .accessibilityIdentifier(inputAccessibilityIdentifier ?? "lstextfield")
    }

    static func resolvedTokens(
        for state: InputState,
        isFocused: Bool = false,
        theme: Theme
    ) -> ResolvedTokens {
        let visualState = visualState(for: state, isFocused: isFocused)
        let helperColor: Color = switch visualState {
        case .error:
            theme.colors.danger.default
        case .disabled:
            theme.colors.onSurface.disabled ?? theme.colors.onSurface.default.opacity(theme.opacity.disabled)
        case .default, .focused:
            ContentColor.tertiary.resolved(in: theme)
        }
        let iconColor: Color = switch visualState {
        case .error:
            theme.colors.danger.default
        case .disabled:
            theme.colors.onSurface.disabled ?? theme.colors.onSurface.default.opacity(theme.opacity.disabled)
        case .default, .focused:
            ContentColor.secondary.resolved(in: theme)
        }
        let iconContentColor: IconContentColor = switch visualState {
        case .disabled:
            .subtle
        case .default, .focused, .error:
            .secondary
        }

        return ResolvedTokens(
            minHeight: theme.control.minHeight,
            horizontalPadding: theme.space.md,
            cornerRadius: theme.radius.sm,
            borderWidth: theme.borderWidth.thin,
            background: backgroundColor(for: visualState, theme: theme),
            border: borderColor(for: visualState, theme: theme),
            textColor: textColor(for: visualState, theme: theme),
            placeholderColor: ContentColor.subtle.resolved(in: theme),
            helperColor: helperColor,
            iconColor: iconColor,
            iconContentColor: iconContentColor,
            iconSize: theme.iconSize.small,
            iconSpacing: theme.space.sm,
            textStyle: theme.type.body.lg,
            helperVariant: TypographyVariant.body.sm,
            opacity: visualState == .disabled ? theme.opacity.disabled : 1
        )
    }

    static func commitChange(current: String, proposed: String, state: InputState) -> String {
        state == .disabled ? current : proposed
    }

    private static func visualState(for state: InputState, isFocused: Bool) -> InputState {
        switch state {
        case .disabled:
            .disabled
        case .error:
            .error
        case .focused:
            .focused
        case .default:
            isFocused ? .focused : .default
        }
    }

    private static func backgroundColor(for state: InputState, theme: Theme) -> Color {
        switch state {
        case .disabled:
            theme.colors.input.disabled ?? theme.colors.surfaceVariant.default
        case .default, .focused, .error:
            theme.colors.input.default
        }
    }

    private static func borderColor(for state: InputState, theme: Theme) -> Color {
        switch state {
        case .error:
            theme.colors.danger.default
        case .focused:
            theme.colors.border.focus ?? theme.colors.primary.default
        case .disabled:
            theme.colors.border.disabled ?? theme.colors.border.default.opacity(theme.opacity.disabled)
        case .default:
            theme.colors.border.default
        }
    }

    private static func textColor(for state: InputState, theme: Theme) -> Color {
        switch state {
        case .disabled:
            theme.colors.onSurface.disabled ?? theme.colors.onSurface.default.opacity(theme.opacity.disabled)
        case .default, .focused, .error:
            ContentColor.primary.resolved(in: theme)
        }
    }

    private var editableBinding: Binding<String> {
        Binding(
            get: { value },
            set: { nextValue in
                value = Self.commitChange(current: value, proposed: nextValue, state: state)
            }
        )
    }

    private func prompt(tokens: ResolvedTokens) -> Text? {
        guard let placeholder else { return nil }
        return Text(placeholder)
            .font(tokens.textStyle.font)
            .foregroundStyle(tokens.placeholderColor)
    }

    @ViewBuilder
    private func inputField(tokens: ResolvedTokens) -> some View {
        if isSecureEntry {
            SecureField("", text: editableBinding, prompt: prompt(tokens: tokens))
                .font(tokens.textStyle.font)
                .foregroundStyle(tokens.textColor)
                .focused($isFocused)
                .disabled(state == .disabled)
                .optionalAccessibilityIdentifier(inputAccessibilityIdentifier)
        } else {
            TextField("", text: editableBinding, prompt: prompt(tokens: tokens))
                .font(tokens.textStyle.font)
                .foregroundStyle(tokens.textColor)
                .focused($isFocused)
                .disabled(state == .disabled)
                .optionalAccessibilityIdentifier(inputAccessibilityIdentifier)
        }
    }
}

private extension View {
    @ViewBuilder
    func optionalAccessibilityIdentifier(_ identifier: String?) -> some View {
        if let identifier {
            accessibilityIdentifier(identifier)
        } else {
            self
        }
    }
}
