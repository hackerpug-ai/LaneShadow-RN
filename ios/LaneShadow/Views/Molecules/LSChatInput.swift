import LaneShadowTheme
import SwiftUI

public struct LSChatInput: View {
    @Environment(\.theme) private var theme
    @FocusState private var isFocused: Bool

    @Binding private var value: String
    private let placeholder: String
    private let onSend: (String) -> Void
    private let onCollapse: () -> Void
    private let onFilter: () -> Void
    private let suggestions: [SuggestionChip]
    private let onSuggestionTap: (SuggestionChip) -> Void
    private let locationBadge: LocationContext?
    private let isThinking: Bool
    private let isEnabled: Bool

    public init(
        value: Binding<String>,
        placeholder: String,
        onSend: @escaping (String) -> Void,
        onCollapse: @escaping () -> Void,
        onFilter: @escaping () -> Void,
        suggestions: [SuggestionChip] = [],
        onSuggestionTap: @escaping (SuggestionChip) -> Void = { _ in },
        locationBadge: LocationContext? = nil,
        isThinking: Bool = false,
        isEnabled: Bool = true
    ) {
        _value = value
        self.placeholder = placeholder
        self.onSend = onSend
        self.onCollapse = onCollapse
        self.onFilter = onFilter
        self.suggestions = suggestions
        self.onSuggestionTap = onSuggestionTap
        self.locationBadge = locationBadge
        self.isThinking = isThinking
        self.isEnabled = isEnabled
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: theme.space.xs) {
            // Location context bar (optional)
            if let locationBadge {
                locationBarView(for: locationBadge)
            }

            // Suggestion chip row (optional)
            if !suggestions.isEmpty {
                suggestionChipsView
            }

            // Input bar
            inputBarView
        }
        .opacity(isEnabled ? 1 : theme.opacity.disabled)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("lschatinput")
    }

    // MARK: - Location Bar

    @ViewBuilder
    private func locationBarView(for location: LocationContext) -> some View {
        LSLocationContextBar(
            location: location.label,
            mode: location.mode,
            onModeChange: { }
        )
        .accessibilityIdentifier("lschatinput-location-bar")
    }

    // MARK: - Suggestion Chips

    private var suggestionChipsView: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: theme.space.sm) {
                ForEach(suggestions) { chip in
                    LSSuggestionChip(
                        label: chip.label,
                        onTap: { handleSuggestionTap(chip) }
                    )
                }
            }
            .padding(.horizontal, theme.space.xs)
        }
        .accessibilityIdentifier("lschatinput-suggestions")
    }

    // MARK: - Input Bar

    private var inputBarView: some View {
        LSGlassPanel(variant: .chrome, padding: .spacing4) {
            HStack(spacing: theme.space.sm) {
                // Leading collapse button
                leadingButton

                // Text field
                textField

                // Trailing slot (send/sliders/spinner)
                trailingSlot
            }
        }
        .frame(height: theme.control.minHeight)
        .accessibilityIdentifier("lschatinput-bar")
    }

    // MARK: - Leading Button

    private var leadingButton: some View {
        Button(action: handleCollapse) {
            LSIcon(name: .collapse, size: .md)
                .foregroundStyle(ContentColor.secondary.resolved(in: theme))
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled || isThinking)
        .accessibilityLabel("Collapse chat")
        .accessibilityIdentifier("lschatinput-collapse")
    }

    // MARK: - Text Field

    private var textField: some View {
        LSTextField(
            value: $value,
            placeholder: isThinking ? "Planning your ride…" : placeholder,
            state: isThinking || !isEnabled ? .disabled : .default
        )
        .frame(maxWidth: .infinity)
        .accessibilityIdentifier("lschatinput-field")
    }

    // MARK: - Trailing Slot

    @ViewBuilder
    private var trailingSlot: some View {
        if isThinking {
            spinnerView
        } else if value.isEmpty {
            filterButton
        } else {
            sendButton
        }
    }

    // MARK: - Filter Button

    private var filterButton: some View {
        Button(action: handleFilter) {
            LSIcon(name: .sliders, size: .md)
                .foregroundStyle(ContentColor.secondary.resolved(in: theme))
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled)
        .accessibilityLabel("Filter rides")
        .accessibilityIdentifier("lschatinput-filter")
    }

    // MARK: - Send Button

    private var sendButton: some View {
        Button(action: handleSend) {
            LSIcon(name: .send, size: .md)
                .foregroundStyle(theme.colors.primary.default)
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled)
        .accessibilityLabel("Send message")
        .accessibilityIdentifier("lschatinput-send")
    }

    // MARK: - Spinner

    private var spinnerView: some View {
        LSSpinner()
            .frame(width: 24, height: 24)
            .accessibilityLabel("Planning your ride")
            .accessibilityIdentifier("lschatinput-spinner")
    }

    // MARK: - Event Handlers

    private func handleSend() {
        guard isEnabled else { return }
        let textToSend = value
        value = ""
        onSend(textToSend)
    }

    private func handleCollapse() {
        guard isEnabled else { return }
        onCollapse()
    }

    private func handleFilter() {
        guard isEnabled else { return }
        onFilter()
    }

    private func handleSuggestionTap(_ chip: SuggestionChip) {
        guard isEnabled else { return }
        onSuggestionTap(chip)
    }
}

// MARK: - Public Types

public struct SuggestionChip: Identifiable, Equatable, Sendable {
    public let id: String = UUID().uuidString
    public let label: String

    public init(label: String) {
        self.label = label
    }
}

public struct LocationContext: Equatable, Sendable {
    public let label: String
    public let mode: LSLocationContextMode

    public init(label: String, mode: LSLocationContextMode) {
        self.label = label
        self.mode = mode
    }
}
