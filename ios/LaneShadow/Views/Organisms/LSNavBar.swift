import LaneShadowTheme
import NativeTheme
import SwiftUI

/// Specification for a filter chip in the LSNavBar filter row.
public struct FilterChipSpec: Identifiable {
    public let id = UUID()
    public let label: String
    public var isSelected: Bool

    public init(label: String, isSelected: Bool = false) {
        self.label = label
        self.isSelected = isSelected
    }
}

/// Specification for the search slot in LSNavBar.
public struct SearchSlotSpec {
    public let placeholder: String

    public init(placeholder: String) {
        self.placeholder = placeholder
    }
}

public struct LSNavBar: View {
    @Environment(\.theme) private var theme
    @State private var searchText = ""

    private let title: String
    private let leading: LSToolbarLeading
    private let trailing: LSToolbarTrailing
    private let filterChips: [FilterChipSpec]?
    private let searchSlot: SearchSlotSpec?

    public init(
        title: String,
        leading: LSToolbarLeading = .none,
        trailing: LSToolbarTrailing = .none,
        filterChips: [FilterChipSpec]? = nil,
        searchSlot: SearchSlotSpec? = nil
    ) {
        self.title = title
        self.leading = leading
        self.trailing = trailing
        self.filterChips = filterChips
        self.searchSlot = searchSlot
    }

    public var body: some View {
        VStack(spacing: 0) {
            LSToolbar(
                leading: leading,
                title: title,
                trailing: trailing
            )
            .accessibilityIdentifier("lsnavbar")

            if let filterChips, !filterChips.isEmpty {
                filterChipRow(chips: filterChips)
            }

            if let searchSlot {
                searchField(spec: searchSlot)
            }
        }
    }

    private func filterChipRow(chips: [FilterChipSpec]) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: theme.space.sm) {
                ForEach(chips) { chip in
                    FilterChipWrapper(chip: chip)
                }
            }
            .padding(.horizontal, theme.space.md)
            .padding(.vertical, theme.space.sm)
        }
        .accessibilityIdentifier("lsnavbar-filterchips")
    }

    private func searchField(spec: SearchSlotSpec) -> some View {
        HStack(spacing: theme.space.sm) {
            Image(systemName: "magnifyingglass")
                .foregroundColor(LaneShadowTheme.color.content.tertiary)

            TextField(spec.placeholder, text: $searchText)
                .font(theme.type.body.md.font)
                .foregroundColor(LaneShadowTheme.color.content.primary)

            if !searchText.isEmpty {
                Button(action: { searchText = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(LaneShadowTheme.color.content.tertiary)
                }
                .accessibilityIdentifier("lsnavbar-search-clear")
            }
        }
        .padding(.horizontal, theme.space.md)
        .padding(.vertical, theme.space.sm)
        .background(
            RoundedRectangle(cornerRadius: theme.radius.lg, style: .continuous)
                .fill(LaneShadowTheme.color.surface.inset)
        )
        .overlay(
            RoundedRectangle(cornerRadius: theme.radius.lg, style: .continuous)
                .stroke(LaneShadowTheme.color.border.default, lineWidth: theme.borderWidth.hairline)
        )
        .padding(.horizontal, theme.space.md)
        .padding(.bottom, theme.space.md)
        .accessibilityIdentifier("lsnavbar-search")
        .accessibilityLabel("Search")
    }
}

/// Wrapper for filter chips to handle local state.
private struct FilterChipWrapper: View {
    @Environment(\.theme) private var theme
    @State private var isSelected: Bool

    private let label: String

    init(chip: FilterChipSpec) {
        label = chip.label
        _isSelected = State(initialValue: chip.isSelected)
    }

    var body: some View {
        LSFilterChip(
            label: label,
            selected: isSelected,
            onToggle: { isSelected.toggle() }
        )
        .accessibilityValue(isSelected ? "Selected" : "Not selected")
    }
}
