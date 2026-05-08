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
    private let autocompleteSuggestions: [LSChatAutocompleteSuggestion]
    private let onAutocompleteSuggestionTap: (LSChatAutocompleteSuggestion) -> Void
    private let isAutocompleteLoading: Bool
    private let autocompleteErrorMessage: String?
    private let locationBadge: LocationContext?
    private let showsSendAction: Bool
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
        autocompleteSuggestions: [LSChatAutocompleteSuggestion] = [],
        onAutocompleteSuggestionTap: @escaping (LSChatAutocompleteSuggestion) -> Void = { _ in },
        isAutocompleteLoading: Bool = false,
        autocompleteErrorMessage: String? = nil,
        locationBadge: LocationContext? = nil,
        showsSendAction: Bool = false,
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
        self.autocompleteSuggestions = autocompleteSuggestions
        self.onAutocompleteSuggestionTap = onAutocompleteSuggestionTap
        self.isAutocompleteLoading = isAutocompleteLoading
        self.autocompleteErrorMessage = autocompleteErrorMessage
        self.locationBadge = locationBadge
        self.showsSendAction = showsSendAction
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

            if showsAutocompleteDropdown {
                autocompleteDropdownView
            }
        }
        .opacity(isEnabled ? 1 : theme.opacity.disabled)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("lschatinput")
    }

    // MARK: - Location Bar

    private func locationBarView(for location: LocationContext) -> some View {
        LSLocationContextBar(
            location: location.label,
            mode: location.mode,
            onModeChange: {}
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
                    .fixedSize(horizontal: true, vertical: false)
                    .accessibilityIdentifier(
                        "lschatinput-chip-\(chip.label.lowercased().replacingOccurrences(of: " ", with: "-"))"
                    )
                }
            }
            .padding(.horizontal, theme.space.xs)
        }
        .padding(.bottom, suggestionInputGap)
        .accessibilityIdentifier("lschatinput-suggestions")
    }

    private var suggestionInputGap: CGFloat {
        theme.space.sm
    }

    // MARK: - Place Autocomplete

    @ViewBuilder
    private var autocompleteDropdownView: some View {
        VStack(spacing: 0) {
            if isAutocompleteLoading {
                autocompleteLoadingRow
            } else if let autocompleteErrorMessage {
                autocompleteErrorRow(message: autocompleteErrorMessage)
            } else {
                ForEach(Array(autocompleteSuggestions.prefix(3).enumerated()), id: \.offset) { index, suggestion in
                    autocompleteSuggestionRow(suggestion, index: index)
                }
            }
        }
        .background(theme.colors.surface.default)
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.lg))
        .overlay {
            RoundedRectangle(cornerRadius: theme.radius.lg)
                .stroke(theme.colors.border.default, lineWidth: theme.borderWidth.thin)
        }
        .accessibilityIdentifier("lschatinput-autocomplete")
    }

    private func autocompleteSuggestionRow(_ suggestion: LSChatAutocompleteSuggestion, index: Int) -> some View {
        Button(action: { handleAutocompleteSuggestionTap(suggestion) }) {
            HStack(alignment: .top, spacing: theme.space.sm) {
                Image(systemName: "location")
                    .font(theme.type.label.sm.font)
                    .foregroundStyle(ContentColor.secondary.resolved(in: theme))

                VStack(alignment: .leading, spacing: theme.space.xs) {
                    Text(suggestion.placeSuggestion.name)
                        .font(theme.type.body.sm.font)
                        .foregroundStyle(ContentColor.primary.resolved(in: theme))
                        .frame(maxWidth: .infinity, alignment: .leading)

                    Text(suggestion.placeSuggestion.label)
                        .font(theme.type.label.sm.font)
                        .foregroundStyle(ContentColor.secondary.resolved(in: theme))
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .padding(.horizontal, theme.space.md)
            .padding(.vertical, theme.space.sm)
            .background(theme.colors.surfaceVariant.pressed.opacity(0.5))
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled)
        .accessibilityLabel(suggestion.accessibilityLabel)
        .accessibilityIdentifier("lschatinput-autocomplete-row-\(index)")
    }

    private var autocompleteLoadingRow: some View {
        HStack(spacing: theme.space.sm) {
            LSSpinner()
                .frame(width: 20, height: 20)

            Text("Searching places...")
                .font(theme.type.body.sm.font)
                .foregroundStyle(ContentColor.secondary.resolved(in: theme))
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, theme.space.md)
        .padding(.vertical, theme.space.sm)
        .accessibilityLabel("Searching places")
        .accessibilityIdentifier("lschatinput-autocomplete-loading")
    }

    private func autocompleteErrorRow(message: String) -> some View {
        HStack(alignment: .top, spacing: theme.space.sm) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(theme.type.label.sm.font)
                .foregroundStyle(LaneShadowTheme.color.status.warning.default)

            Text(message)
                .font(theme.type.body.sm.font)
                .foregroundStyle(ContentColor.primary.resolved(in: theme))
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, theme.space.md)
        .padding(.vertical, theme.space.sm)
        .background(LaneShadowTheme.color.surface.card)
        .accessibilityLabel(message)
        .accessibilityIdentifier("lschatinput-autocomplete-error")
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
        } else if value.isEmpty && !showsSendAction {
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
                .accessibilityIdentifier("lschatinput-filter-icon-sliders")
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
                .accessibilityIdentifier("lschatinput-send-icon")
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

    private func handleAutocompleteSuggestionTap(_ suggestion: LSChatAutocompleteSuggestion) {
        guard isEnabled else { return }
        onAutocompleteSuggestionTap(suggestion)
    }

    private var showsAutocompleteDropdown: Bool {
        isAutocompleteLoading || autocompleteErrorMessage != nil || !autocompleteSuggestions.isEmpty
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

public struct LSChatAutocompleteSuggestion: Equatable, Sendable {
    public let placeSuggestion: LaneShadowPlaceSuggestion
    public let accessibilityLabel: String

    public init(placeSuggestion: LaneShadowPlaceSuggestion, accessibilityLabel: String) {
        self.placeSuggestion = placeSuggestion
        self.accessibilityLabel = accessibilityLabel
    }
}
