import LaneShadowTheme
import NativeTheme
import SwiftUI

public struct LSTextArea: View {
    struct ResolvedTokens {
        let minHeight: CGFloat
        let contentPadding: CGFloat
        let cornerRadius: CGFloat
        let borderWidth: CGFloat
        let background: Color
        let border: Color
        let textColor: Color
        let placeholderColor: Color
        let helperColor: Color
        let textStyle: TypographyStyle
        let helperVariant: TypographyVariant
        let opacity: CGFloat
    }

    @Environment(\.theme) private var theme
    @FocusState private var isFocused: Bool

    @Binding private var value: String
    private let placeholder: String?
    private let state: InputState
    private let autoGrow: Bool
    private let helperText: String?

    public init(
        value: Binding<String>,
        placeholder: String? = nil,
        state: InputState = .default,
        autoGrow: Bool = false,
        helperText: String? = nil
    ) {
        _value = value
        self.placeholder = placeholder
        self.state = state
        self.autoGrow = autoGrow
        self.helperText = helperText
    }

    public var body: some View {
        let tokens = Self.resolvedTokens(for: state, isFocused: isFocused, theme: theme)
        let editorHeight = Self.resolvedHeight(text: value, theme: theme, autoGrow: autoGrow)

        VStack(alignment: .leading, spacing: theme.space.xs) {
            ZStack(alignment: .topLeading) {
                if value.isEmpty, let placeholder {
                    Text(placeholder)
                        .font(tokens.textStyle.font)
                        .foregroundStyle(tokens.placeholderColor)
                        .padding(tokens.contentPadding)
                        .accessibilityHidden(true)
                }

                TextEditor(text: editableBinding)
                    .font(tokens.textStyle.font)
                    .foregroundStyle(tokens.textColor)
                    .focused($isFocused)
                    .disabled(state == .disabled)
                    .scrollContentBackground(.hidden)
                    .padding(.horizontal, tokens.contentPadding - 4)
                    .padding(.vertical, tokens.contentPadding - 4)
                    .frame(height: autoGrow ? editorHeight : nil, alignment: .top)
            }
            .frame(minHeight: tokens.minHeight, alignment: .top)
            .background(tokens.background)
            .clipShape(RoundedRectangle(cornerRadius: tokens.cornerRadius))
            .overlay {
                RoundedRectangle(cornerRadius: tokens.cornerRadius)
                    .stroke(tokens.border, lineWidth: tokens.borderWidth)
            }
            .opacity(tokens.opacity)

            if let helperText {
                LSText(helperText, variant: tokens.helperVariant, color: .tertiary)
                    .accessibilityIdentifier("lstextarea-helper")
            }
        }
        .accessibilityIdentifier("lstextarea")
    }

    static func resolvedTokens(
        for state: InputState,
        isFocused: Bool = false,
        theme: Theme
    ) -> ResolvedTokens {
        let visualState = visualState(for: state, isFocused: isFocused)

        return ResolvedTokens(
            minHeight: theme.control.minHeight,
            contentPadding: theme.space.md,
            cornerRadius: theme.radius.sm,
            borderWidth: theme.borderWidth.thin,
            background: backgroundColor(for: visualState, theme: theme),
            border: borderColor(for: visualState, theme: theme),
            textColor: textColor(for: visualState, theme: theme),
            placeholderColor: ContentColor.subtle.resolved(in: theme),
            helperColor: helperColor(for: visualState, theme: theme),
            textStyle: theme.type.body.lg,
            helperVariant: TypographyVariant.body.sm,
            opacity: visualState == .disabled ? theme.opacity.disabled : 1
        )
    }

    static func resolvedHeight(text: String, theme: Theme, autoGrow: Bool) -> CGFloat {
        guard autoGrow else { return theme.control.minHeight }

        let lineCount = max(1, text.split(separator: "\n", omittingEmptySubsequences: false).count)
        let measuredHeight = CGFloat(lineCount) * theme.type.body.lg.lineHeight + (theme.space.md * 2)
        return max(theme.control.minHeight, measuredHeight)
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

    private static func helperColor(for state: InputState, theme: Theme) -> Color {
        switch state {
        case .error:
            theme.colors.danger.default
        case .disabled:
            theme.colors.onSurface.disabled ?? theme.colors.onSurface.default.opacity(theme.opacity.disabled)
        case .default, .focused:
            ContentColor.tertiary.resolved(in: theme)
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
}
