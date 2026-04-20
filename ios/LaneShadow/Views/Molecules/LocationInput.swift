import LaneShadowTheme
import SwiftUI

// MARK: - LocationInput Component

/**
 * LocationInput molecule component
 *
 * Input field with autocomplete suggestions for location search.
 * Following React Native component from react-native/components/location-input.tsx
 * Matrix reference: .spec/prds/native-rewrite/matrices/ui/molecules/LocationInput.md
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Background: `theme.colors.surface.default`
 *   - Text (value): `theme.colors.onSurface.default`
 *   - Text (placeholder): `theme.colors.onSurface.subtle`
 *   - Border: `theme.colors.border.default`
 *   - Suggestions background: `theme.colors.surface.default`
 *   - Suggestions pressed: `theme.colors.surfaceVariant.pressed`
 *   - Skeleton background: `theme.colors.surfaceVariant.default`
 * - Layout:
 *   - Corner radius: `theme.radius.lg`
 *   - Padding: `theme.space.sm` (input horizontal), `theme.space.md` (suggestions)
 *   - Gap: `theme.space.sm`
 * - Typography:
 *   - Input text: `theme.type.body.sm.fontSize` (14), regular weight
 *   - Label: `theme.type.label.sm.fontSize` (12), medium weight, uppercase
 * - Icon:
 *   - Size: 20pt
 * - Spacing:
 *   - Input padding: horizontal `theme.space.sm` (8)
 *   - Suggestions padding: `theme.space.md` (16)
 *
 * ## Parameters
 * - label: Label text displayed above input
 * - value: Current input value
 * - onValueChange: Optional callback when text changes
 * - placeholder: Placeholder text
 * - iconName: SF Symbol name for right icon
 * - isFocused: Whether input is focused (controls suggestions visibility)
 * - suggestions: Array of suggestion strings to display
 * - isLoading: Show skeleton loading state instead of suggestions
 * - onSuggestionSelect: Optional callback when suggestion tapped (passes index)
 * - onFocusChange: Optional callback when focus state changes
 *
 * ## Behavior
 * - Input removes bottom border radius when suggestions showing
 * - Suggestions flush with input (no gap) using negative margin
 * - Skeleton shows 3 rows when loading
 * - Maximum 3 suggestions displayed
 */
public struct LSLocationInput: View {
    @Environment(\.theme) private var theme
    @FocusState private var internalFocused: Bool

    private let label: String
    private let value: String
    private let onValueChange: ((String) -> Void)?
    private let placeholder: String
    private let iconName: String
    private let isFocused: Bool
    private let suggestions: [String]
    private let isLoading: Bool
    private let onSuggestionSelect: ((Int) -> Void)?
    private let onFocusChange: ((Bool) -> Void)?

    public init(
        label: String,
        value: String,
        onValueChange: ((String) -> Void)? = nil,
        placeholder: String,
        iconName: String,
        isFocused: Bool,
        suggestions: [String],
        isLoading: Bool,
        onSuggestionSelect: ((Int) -> Void)? = nil,
        onFocusChange: ((Bool) -> Void)? = nil
    ) {
        self.label = label
        self.value = value
        self.onValueChange = onValueChange
        self.placeholder = placeholder
        self.iconName = iconName
        self.isFocused = isFocused
        self.suggestions = suggestions
        self.isLoading = isLoading
        self.onSuggestionSelect = onSuggestionSelect
        self.onFocusChange = onFocusChange
    }

    // MARK: - Body

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Input container
            VStack(alignment: .leading, spacing: theme.space.xs) {
                // Label above input
                Text(label.uppercased())
                    .font(.system(size: theme.type.label.sm.fontSize, weight: .medium))
                    .foregroundStyle(theme.colors.onSurface.default.opacity(0.6))
                    .padding(.leading, theme.space.xs)

                // Input field with right icon
                HStack(spacing: theme.space.sm) {
                    TextField(text: Binding(
                        get: { value },
                        set: { newValue in
                            onValueChange?(newValue)
                        }
                    )) {
                        Text(placeholder)
                            .font(.system(size: theme.type.body.sm.fontSize, weight: .regular))
                            .foregroundStyle(theme.colors.onSurface.default.opacity(0.6))
                    }
                    .font(.system(size: theme.type.body.sm.fontSize, weight: .regular))
                    .foregroundStyle(theme.colors.onSurface.default)
                    .focused($internalFocused)
                    .onChange(of: internalFocused) { oldValue, newValue in
                        onFocusChange?(newValue)
                    }
                    .padding(.horizontal, theme.space.sm)

                    Image(systemName: iconName)
                        .font(.system(size: 20, weight: .regular))
                        .foregroundStyle(theme.colors.onSurface.default.opacity(0.6))
                }
                .padding(.horizontal, theme.space.sm)
                .padding(.vertical, theme.space.sm)
                .background(theme.colors.surface.default)
                .clipShape(RoundedRectangle(cornerRadius: bottomBorderRadius))
                .overlay {
                    RoundedRectangle(cornerRadius: bottomBorderRadius)
                        .stroke(theme.colors.border.default, lineWidth: 1)
                }
            }

            // Suggestions dropdown (flush with input)
            if isFocused, isLoading || !suggestions.isEmpty {
                VStack(spacing: 0) {
                    if isLoading {
                        // Skeleton loading state - 3 rows
                        ForEach(0 ..< 3, id: \.self) { index in
                            skeletonSuggestionRow
                        }
                    } else {
                        // Actual suggestions - max 3
                        ForEach(Array(suggestions.prefix(3).enumerated()), id: \.offset) { index, suggestion in
                            suggestionRow(suggestion, at: index)
                        }
                    }
                }
                .background(theme.colors.surface.default)
                .clipShape(
                    RoundedRectangle(cornerRadius: theme.radius.lg)
                )
                .overlay {
                    // Border on sides and bottom only (flush with input)
                    RoundedRectangle(cornerRadius: theme.radius.lg)
                        .stroke(theme.colors.border.default, lineWidth: 1)
                        .padding(.top, -1) // Overlap input border
                }
                .padding(.top, -1) // Flush with input
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Location input")
    }

    // MARK: - Private Views

    private func suggestionRow(_ suggestion: String, at index: Int) -> some View {
        Button(action: {
            onSuggestionSelect?(index)
        }) {
            HStack(spacing: theme.space.sm) {
                Text(suggestion)
                    .font(.system(size: theme.type.body.sm.fontSize, weight: .regular))
                    .foregroundStyle(theme.colors.onSurface.default)
                    .lineLimit(1)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(.horizontal, theme.space.md)
            .padding(.vertical, theme.space.sm)
            .background(theme.colors.surfaceVariant.pressed.opacity(buttonPressOpacity))
        }
        .buttonStyle(PlainButtonStyle())
    }

    private var skeletonSuggestionRow: some View {
        HStack(spacing: theme.space.sm) {
            RoundedRectangle(cornerRadius: theme.radius.md)
                .fill(theme.colors.surface.default)
                .frame(width: skeletonWidth, height: theme.space.md)
        }
        .padding(.horizontal, theme.space.md)
        .padding(.vertical, theme.space.sm)
        .background(theme.colors.surfaceVariant.default)
    }

    // MARK: - Private Computed Properties

    private var bottomBorderRadius: CGFloat {
        // Remove bottom border radius when suggestions showing
        if isFocused, isLoading || !suggestions.isEmpty {
            return 0
        }
        return theme.radius.lg
    }

    private var buttonPressOpacity: Double {
        // Simulate pressed state opacity
        0.5
    }

    private var skeletonWidth: CGFloat {
        // Skeleton bar width (70% as in RN)
        UIScreen.main.bounds.width * 0.7
    }
}

// MARK: - Preview

#Preview("Default State") {
    LSLocationInput(
        label: "Starting Location",
        value: "",
        placeholder: "Enter starting location",
        iconName: "location.fill",
        isFocused: false,
        suggestions: [],
        isLoading: false
    )
    .laneShadowTheme()
    .padding()
}

#Preview("With Value") {
    LSLocationInput(
        label: "Destination",
        value: "San Francisco, CA",
        placeholder: "Enter destination",
        iconName: "magnifyingglass",
        isFocused: false,
        suggestions: [],
        isLoading: false
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Focused with Suggestions") {
    LSLocationInput(
        label: "Destination",
        value: "San",
        placeholder: "Enter destination",
        iconName: "magnifyingglass",
        isFocused: true,
        suggestions: [
            "San Francisco, CA",
            "San Jose, CA",
            "San Diego, CA",
        ],
        isLoading: false
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Loading State") {
    LSLocationInput(
        label: "Destination",
        value: "San",
        placeholder: "Enter destination",
        iconName: "magnifyingglass",
        isFocused: true,
        suggestions: [],
        isLoading: true
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Multiple States") {
    VStack(spacing: 32) {
        LSLocationInput(
            label: "Starting Location",
            value: "",
            placeholder: "Enter starting location",
            iconName: "location.fill",
            isFocused: false,
            suggestions: [],
            isLoading: false
        )

        LSLocationInput(
            label: "Destination",
            value: "San Francisco, CA",
            placeholder: "Enter destination",
            iconName: "magnifyingglass",
            isFocused: true,
            suggestions: [
                "San Francisco, CA",
                "San Jose, CA",
                "San Diego, CA",
            ],
            isLoading: false
        )

        LSLocationInput(
            label: "Destination",
            value: "San",
            placeholder: "Enter destination",
            iconName: "magnifyingglass",
            isFocused: true,
            suggestions: [],
            isLoading: true
        )
    }
    .laneShadowTheme()
    .padding()
}
