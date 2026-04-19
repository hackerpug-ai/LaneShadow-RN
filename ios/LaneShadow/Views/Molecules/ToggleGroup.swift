import LaneShadowTheme
import SwiftUI

// MARK: - ToggleGroup Type

/**
 * ToggleGroup selection type
 *
 * Defines whether the group allows single or multiple selection.
 */
public enum LSToggleGroupType: Sendable {
    case single
    case multiple
}

// MARK: - ToggleGroup Size

/**
 * ToggleGroup item size
 *
 * Defines the height of toggle items in the group.
 */
public enum LSToggleSize: Sendable {
    case sm // 36pt
    case `default` // 40pt
    case lg // 44pt
}

// MARK: - ToggleGroup Variant

/**
 * ToggleGroup visual variant
 *
 * Defines the visual style of toggle items.
 */
public enum LSToggleVariant: Sendable {
    case `default`
    case outline
}

// MARK: - ToggleGroup Environment Key

private struct ToggleGroupStateKey: EnvironmentKey {
    static let defaultValue: ToggleGroupState = ToggleGroupState(
        type: .single,
        value: nil,
        onValueChange: { _ in },
        size: .default,
        variant: .default,
        disabled: false
    )
}

private struct ToggleGroupState {
    let type: LSToggleGroupType
    let value: Any?
    let onValueChange: (Any) -> Void
    let size: LSToggleSize
    let variant: LSToggleVariant
    let disabled: Bool
}

public extension EnvironmentValues {
    var toggleGroupState: ToggleGroupState {
        get { self[ToggleGroupStateKey.self] }
        set { self[ToggleGroupStateKey.self] = newValue }
    }
}

// MARK: - ToggleGroup Component

/**
 * ToggleGroup molecule component
 *
 * Group of toggle buttons supporting single/multiple selection.
 * Following React Native component from react-native/components/ui/toggle-group.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Selected background: `theme.colors.accent.default` or `theme.colors.primary.default`
 *   - Border: `theme.colors.border.default` (1pt for outline variant)
 *   - Text: `theme.colors.onSurface.default`
 *   - Disabled opacity: 0.5
 * - Layout:
 *   - Corner radius: `theme.radius.md` (8pt)
 *   - Item padding: horizontal 12pt
 *   - Item heights: sm=36pt, default=40pt, lg=44pt
 *   - Spacing between items: 4pt
 * - Typography: 14pt medium
 *
 * ## Behavior
 * - Single type: Only one item can be selected at a time
 * - Multiple type: Multiple items can be selected
 * - Items receive group state via @Environment
 *
 * ## Parameters
 * - type: Selection mode (single or multiple, default: single)
 * - value: Current selection (String for single, [String] for multiple)
 * - onValueChange: Callback when selection changes
 * - variant: Visual style (default or outline, default: default)
 * - size: Item size (sm, default, lg, default: default)
 * - disabled: Whether all items are disabled (default: false)
 * - content: ToggleGroupItem views via ViewBuilder
 */
public struct LSToggleGroup<Content: View>: View {
    @Environment(\.theme) private var theme

    private let type: LSToggleGroupType
    private let value: Any
    private let onValueChange: (Any) -> Void
    private let variant: LSToggleVariant
    private let size: LSToggleSize
    private let disabled: Bool
    private let content: () -> Content

    /// Creates a ToggleGroup
    /// - Parameters:
    ///   - type: Selection mode (default: single)
    ///   - value: Current selection (String for single, [String] for multiple)
    ///   - onValueChange: Callback when selection changes
    ///   - variant: Visual style (default: default)
    ///   - size: Item size (default: default)
    ///   - disabled: Whether all items are disabled (default: false)
    ///   - content: ToggleGroupItem views
    public init(
        type: LSToggleGroupType = .single,
        value: Any,
        onValueChange: @escaping (Any) -> Void = { _ in },
        variant: LSToggleVariant = .default,
        size: LSToggleSize = .default,
        disabled: Bool = false,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.type = type
        self.value = value
        self.onValueChange = onValueChange
        self.variant = variant
        self.size = size
        self.disabled = disabled
        self.content = content
    }

    public var body: some View {
        HStack(spacing: 4) {
            content()
        }
        .environment(\.toggleGroupState, ToggleGroupState(
            type: type,
            value: value,
            onValueChange: onValueChange,
            size: size,
            variant: variant,
            disabled: disabled
        ))
    }
}

// MARK: - ToggleGroupItem Component

/**
 * ToggleGroupItem component
 *
 * Individual toggle button within a ToggleGroup.
 * Must be a direct child of LSToggleGroup.
 *
 * ## Design Tokens Used
 * - Colors: Inherited from parent ToggleGroup
 * - Layout:
 *   - Height: Determined by parent's size prop
 *   - Padding: horizontal 12pt
 *   - Corner radius: 8pt
 *
 * ## Parameters
 * - value: Unique identifier for this item
 * - icon: Optional icon view
 * - accessibilityLabel: Optional accessibility label
 * - content: Item content via ViewBuilder
 */
public struct LSToggleGroupItem<Content: View>: View {
    @Environment(\.theme) private var theme
    @Environment(\.toggleGroupState) private var groupState

    private let value: String
    private let icon: AnyView?
    private let accessibilityLabel: String?
    private let content: () -> Content

    /// Creates a ToggleGroupItem
    /// - Parameters:
    ///   - value: Unique identifier for this item
    ///   - icon: Optional icon view
    ///   - accessibilityLabel: Optional accessibility label
    ///   - content: Item content
    public init(
        value: String,
        icon: AnyView? = nil,
        accessibilityLabel: String? = nil,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.value = value
        self.icon = icon
        self.accessibilityLabel = accessibilityLabel
        self.content = content
    }

    // MARK: - Computed Properties

    private var height: CGFloat {
        switch groupState.size {
        case .sm:
            36
        case .default:
            40
        case .lg:
            44
        }
    }

    private var isSelected: Bool {
        switch groupState.type {
        case .single:
            if let singleValue = groupState.value as? String {
                return singleValue == value
            }
            return false
        case .multiple:
            if let multipleValues = groupState.value as? [String] {
                return multipleValues.contains(value)
            }
            return false
        }
    }

    private var backgroundColor: Color {
        if groupState.disabled {
            return .clear
        }

        if isSelected {
            return theme.colors.accent.default
        }

        return .clear
    }

    private var borderColor: Color? {
        switch groupState.variant {
        case .default:
            return nil
        case .outline:
            return theme.colors.border.default
        }
    }

    private var textColor: Color {
        if groupState.disabled {
            return theme.colors.onSurface.default.opacity(0.38)
        }

        return theme.colors.onSurface.default
    }

    // MARK: - Body

    public var body: some View {
        Button(action: {
            guard !groupState.disabled else { return }
            handleTap()
        }) {
            HStack(spacing: 8) {
                if let icon {
                    icon
                        .foregroundStyle(textColor)
                }

                content()
                    .foregroundStyle(textColor)
            }
            .padding(.horizontal, 12)
            .frame(height: height)
            .background(backgroundColor)
            .cornerRadius(theme.radius.md)
            .overlay(
                RoundedRectangle(cornerRadius: theme.radius.md)
                    .stroke(borderColor, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
        .disabled(groupState.disabled)
        .opacity(groupState.disabled ? 0.5 : 1.0)
        .accessibilityLabel(accessibilityLabel ?? value)
        .accessibilityValue(isSelected ? "Selected" : "Not selected")
        .accessibilityAddTraits(isSelected ? [.isSelected, .isButton] : .isButton)
    }

    // MARK: - Interaction Handlers

    private func handleTap() {
        switch groupState.type {
        case .single:
            // Single selection: always select the tapped item
            groupState.onValueChange(value)

        case .multiple:
            // Multiple selection: toggle the item
            if let currentValues = groupState.value as? [String] {
                if currentValues.contains(value) {
                    // Deselect
                    let newValues = currentValues.filter { $0 != value }
                    groupState.onValueChange(newValues)
                } else {
                    // Select
                    let newValues = currentValues + [value]
                    groupState.onValueChange(newValues)
                }
            } else {
                // Initialize with this item selected
                groupState.onValueChange([value])
            }
        }
    }
}

// MARK: - Convenience Initializers

public extension LSToggleGroup {
    /// Convenience initializer for single selection with String value
    init(
        value: String,
        onValueChange: @escaping (String) -> Void = { _ in },
        variant: LSToggleVariant = .default,
        size: LSToggleSize = .default,
        disabled: Bool = false,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.init(
            type: .single,
            value: value,
            onValueChange: { anyValue in
                if let stringValue = anyValue as? String {
                    onValueChange(stringValue)
                }
            },
            variant: variant,
            size: size,
            disabled: disabled,
            content: content
        )
    }

    /// Convenience initializer for multiple selection with [String] value
    init(
        type: LSToggleGroupType,
        value: [String],
        onValueChange: @escaping ([String]) -> Void = { _ in },
        variant: LSToggleVariant = .default,
        size: LSToggleSize = .default,
        disabled: Bool = false,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.init(
            type: type,
            value: value,
            onValueChange: { anyValue in
                if let arrayValue = anyValue as? [String] {
                    onValueChange(arrayValue)
                }
            },
            variant: variant,
            size: size,
            disabled: disabled,
            content: content
        )
    }
}

// MARK: - Previews

#Preview("Single selection - default variant") {
    struct SingleSelectionDemo: View {
        @State private var selectedValue = "option1"

        var body: some View {
            VStack(spacing: 24) {
                Text("Selected: \(selectedValue)")
                    .font(.caption)

                LSToggleGroup(
                    value: selectedValue,
                    onValueChange: { selectedValue = $0 }
                ) {
                    LSToggleGroupItem(value: "option1") {
                        Text("Option 1")
                    }
                    LSToggleGroupItem(value: "option2") {
                        Text("Option 2")
                    }
                    LSToggleGroupItem(value: "option3") {
                        Text("Option 3")
                    }
                }
            }
            .padding()
            .laneShadowTheme()
        }
    }

    return SingleSelectionDemo()
}

#Preview("Single selection - outline variant") {
    struct OutlineDemo: View {
        @State private var selectedValue = "day"

        var body: some View {
            VStack(spacing: 24) {
                Text("View: \(selectedValue)")
                    .font(.caption)

                LSToggleGroup(
                    value: selectedValue,
                    onValueChange: { selectedValue = $0 },
                    variant: .outline
                ) {
                    LSToggleGroupItem(value: "day") {
                        Text("Day")
                    }
                    LSToggleGroupItem(value: "week") {
                        Text("Week")
                    }
                    LSToggleGroupItem(value: "month") {
                        Text("Month")
                    }
                }
            }
            .padding()
            .laneShadowTheme()
        }
    }

    return OutlineDemo()
}

#Preview("Multiple selection") {
    struct MultipleSelectionDemo: View {
        @State private var selectedValues: [String] = []

        var body: some View {
            VStack(spacing: 24) {
                Text("Selected: \(selectedValues.sorted().joined(separator: ", "))")
                    .font(.caption)

                LSToggleGroup(
                    type: .multiple,
                    value: selectedValues,
                    onValueChange: { selectedValues = $0 }
                ) {
                    LSToggleGroupItem(value: "pizza") {
                        Text("🍕 Pizza")
                    }
                    LSToggleGroupItem(value: "tacos") {
                        Text("🌮 Tacos")
                    }
                    LSToggleGroupItem(value: "sushi") {
                        Text("🍣 Sushi")
                    }
                    LSToggleGroupItem(value: "burgers") {
                        Text("🍔 Burgers")
                    }
                }
            }
            .padding()
            .laneShadowTheme()
        }
    }

    return MultipleSelectionDemo()
}

#Preview("With icons") {
    struct IconsDemo: View {
        @State private var selectedView = "list"

        var body: some View {
            VStack(spacing: 24) {
                Text("View: \(selectedView)")
                    .font(.caption)

                LSToggleGroup(
                    value: selectedView,
                    onValueChange: { selectedView = $0 }
                ) {
                    LSToggleGroupItem(
                        value: "list",
                        icon: AnyView(Image(systemName: "list.bullet"))
                    ) {
                        Text("List")
                    }
                    LSToggleGroupItem(
                        value: "grid",
                        icon: AnyView(Image(systemName: "square.grid.2x2"))
                    ) {
                        Text("Grid")
                    }
                    LSToggleGroupItem(
                        value: "map",
                        icon: AnyView(Image(systemName: "map"))
                    ) {
                        Text("Map")
                    }
                }
            }
            .padding()
            .laneShadowTheme()
        }
    }

    return IconsDemo()
}

#Preview("Sizes") {
    struct SizesDemo: View {
        @State private var selected = "option1"

        var body: some View {
            VStack(spacing: 24) {
                VStack(spacing: 8) {
                    Text("Small")
                        .font(.caption)
                    LSToggleGroup(
                        value: selected,
                        size: .sm
                    ) {
                        LSToggleGroupItem(value: "option1") { Text("A") }
                        LSToggleGroupItem(value: "option2") { Text("B") }
                        LSToggleGroupItem(value: "option3") { Text("C") }
                    }
                }

                VStack(spacing: 8) {
                    Text("Default")
                        .font(.caption)
                    LSToggleGroup(
                        value: selected
                    ) {
                        LSToggleGroupItem(value: "option1") { Text("A") }
                        LSToggleGroupItem(value: "option2") { Text("B") }
                        LSToggleGroupItem(value: "option3") { Text("C") }
                    }
                }

                VStack(spacing: 8) {
                    Text("Large")
                        .font(.caption)
                    LSToggleGroup(
                        value: selected,
                        size: .lg
                    ) {
                        LSToggleGroupItem(value: "option1") { Text("A") }
                        LSToggleGroupItem(value: "option2") { Text("B") }
                        LSToggleGroupItem(value: "option3") { Text("C") }
                    }
                }
            }
            .padding()
            .laneShadowTheme()
        }
    }

    return SizesDemo()
}

#Preview("Disabled") {
    struct DisabledDemo: View {
        @State private var selected = "option1"

        var body: some View {
            VStack(spacing: 24) {
                LSToggleGroup(
                    value: selected,
                    disabled: true
                ) {
                    LSToggleGroupItem(value: "option1") { Text("Disabled 1") }
                    LSToggleGroupItem(value: "option2") { Text("Disabled 2") }
                    LSToggleGroupItem(value: "option3") { Text("Disabled 3") }
                }

                LSToggleGroup(
                    value: selected,
                    variant: .outline,
                    disabled: true
                ) {
                    LSToggleGroupItem(value: "option1") { Text("Disabled 1") }
                    LSToggleGroupItem(value: "option2") { Text("Disabled 2") }
                    LSToggleGroupItem(value: "option3") { Text("Disabled 3") }
                }
            }
            .padding()
            .laneShadowTheme()
        }
    }

    return DisabledDemo()
}

#Preview("Dark theme") {
    struct DarkThemeDemo: View {
        @State private var selected = "dark"

        var body: some View {
            VStack(spacing: 24) {
                Text("Selected: \(selected)")
                    .font(.caption)

                LSToggleGroup(
                    value: selected,
                    onValueChange: { selected = $0 }
                ) {
                    LSToggleGroupItem(value: "light") { Text("Light") }
                    LSToggleGroupItem(value: "dark") { Text("Dark") }
                    LSToggleGroupItem(value: "auto") { Text("Auto") }
                }

                LSToggleGroup(
                    value: selected,
                    variant: .outline
                ) {
                    LSToggleGroupItem(value: "light") { Text("Light") }
                    LSToggleGroupItem(value: "dark") { Text("Dark") }
                    LSToggleGroupItem(value: "auto") { Text("Auto") }
                }
            }
            .padding()
            .laneShadowTheme()
            .preferredColorScheme(.dark)
        }
    }

    return DarkThemeDemo()
}

#Preview("All examples") {
    struct AllExamplesDemo: View {
        @State private var singleValue = "option1"
        @State private var multipleValues: [String] = []

        var body: some View {
            ScrollView {
                VStack(spacing: 32) {
                    // Single selection
                    VStack(spacing: 12) {
                        Text("Single Selection")
                            .font(.headline)
                        LSToggleGroup(value: singleValue) {
                            LSToggleGroupItem(value: "option1") { Text("Option 1") }
                            LSToggleGroupItem(value: "option2") { Text("Option 2") }
                            LSToggleGroupItem(value: "option3") { Text("Option 3") }
                        }
                        Text("Selected: \(singleValue)")
                            .font(.caption)
                    }

                    // Multiple selection
                    VStack(spacing: 12) {
                        Text("Multiple Selection")
                            .font(.headline)
                        LSToggleGroup(type: .multiple, value: multipleValues) {
                            LSToggleGroupItem(value: "red") { Text("Red") }
                            LSToggleGroupItem(value: "green") { Text("Green") }
                            LSToggleGroupItem(value: "blue") { Text("Blue") }
                            LSToggleGroupItem(value: "yellow") { Text("Yellow") }
                        }
                        Text("Selected: \(multipleValues.sorted().joined(separator: ", "))")
                            .font(.caption)
                    }

                    // Outline variant
                    VStack(spacing: 12) {
                        Text("Outline Variant")
                            .font(.headline)
                        LSToggleGroup(value: singleValue, variant: .outline) {
                            LSToggleGroupItem(value: "option1") { Text("Option 1") }
                            LSToggleGroupItem(value: "option2") { Text("Option 2") }
                            LSToggleGroupItem(value: "option3") { Text("Option 3") }
                        }
                    }

                    // With icons
                    VStack(spacing: 12) {
                        Text("With Icons")
                            .font(.headline)
                        LSToggleGroup(value: singleValue) {
                            LSToggleGroupItem(value: "list", icon: AnyView(Image(systemName: "list.bullet"))) { Text("List") }
                            LSToggleGroupItem(value: "grid", icon: AnyView(Image(systemName: "square.grid.2x2"))) { Text("Grid") }
                            LSToggleGroupItem(value: "map", icon: AnyView(Image(systemName: "map"))) { Text("Map") }
                        }
                    }

                    // Sizes
                    VStack(spacing: 12) {
                        Text("Sizes")
                            .font(.headline)
                        LSToggleGroup(value: singleValue, size: .sm) {
                            LSToggleGroupItem(value: "option1") { Text("Small") }
                            LSToggleGroupItem(value: "option2") { Text("Small") }
                        }
                        LSToggleGroup(value: singleValue, size: .default) {
                            LSToggleGroupItem(value: "option1") { Text("Default") }
                            LSToggleGroupItem(value: "option2") { Text("Default") }
                        }
                        LSToggleGroup(value: singleValue, size: .lg) {
                            LSToggleGroupItem(value: "option1") { Text("Large") }
                            LSToggleGroupItem(value: "option2") { Text("Large") }
                        }
                    }
                }
                .padding()
            }
            .laneShadowTheme()
        }
    }

    return AllExamplesDemo()
}
