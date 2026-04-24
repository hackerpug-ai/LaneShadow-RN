import LaneShadowTheme
import SwiftUI

// MARK: - Enrichment Status

/**
 * Enrichment status enum
 *
 * Defines the four semantic states for enrichment progress.
 * Each status maps to a theme color and icon for visual feedback.
 */
public enum LSEnrichmentStatus: Sendable, CaseIterable {
    case draft
    case partial
    case complete
    case failed

    /// Returns the configuration for this status
    var config: StatusConfig {
        switch self {
        case .draft:
            StatusConfig(
                label: "Draft",
                iconName: "clock",
                colorKeyPath: \.onSurface.subtle
            )
        case .partial:
            StatusConfig(
                label: "Partial",
                iconName: "checkmark.circle",
                colorKeyPath: nil // Use domain color
            )
        case .complete:
            StatusConfig(
                label: "Complete",
                iconName: "star",
                colorKeyPath: nil // Use domain color
            )
        case .failed:
            StatusConfig(
                label: "Failed",
                iconName: "exclamationmark.triangle",
                colorKeyPath: \.danger
            )
        }
    }

    /// Returns the theme color for this status
    func color(theme: Theme) -> Color {
        switch self {
        case .draft:
            theme.colors.onSurface.subtle
        case .partial:
            theme.domain.enrichmentFast.default
        case .complete:
            theme.domain.enrichmentExtended.default
        case .failed:
            theme.colors.danger.default
        }
    }
}

// MARK: - Enrichment Badge Size

/**
 * Badge size variant
 *
 * Defines two size variants for different contexts.
 * Small for card headers, medium for standard use.
 */
public enum LSEnrichmentBadgeSize: Sendable {
    case small
    case medium

    var verticalPadding: CGFloat {
        switch self {
        case .small: 4
        case .medium: 6
        }
    }

    var horizontalPadding: CGFloat {
        switch self {
        case .small: 8
        case .medium: 12
        }
    }

    var iconSize: CGFloat {
        switch self {
        case .small: 14
        case .medium: 16
        }
    }

    var typographyKeyPath: KeyPath<ThemeType, ThemeTypeScale> {
        switch self {
        case .small: \.label.sm
        case .medium: \.label.md
        }
    }
}

// MARK: - Status Configuration

/**
 * Status configuration model
 *
 * Contains display properties for each enrichment status.
 */
public struct StatusConfig: Sendable {
    let label: String
    let iconName: String
    let colorKeyPath: KeyPath<ThemeColors, ColorSet>?
}

// MARK: - Enrichment Status Badge Component

/**
 * Enrichment status badge molecule component
 *
 * Badge showing enrichment status with color-coded indicator.
 * Following React Native component from react-native/components/enrichment/enrichment-status-badge.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Background: status color at 10% opacity
 *   - Border: status color at 30% opacity (1pt stroke)
 *   - Draft: `theme.colors.onSurface.subtle`
 *   - Partial: `theme.domain.enrichmentFast.default`
 *   - Complete: `theme.domain.enrichmentExtended.default`
 *   - Failed: `theme.colors.danger.default`
 * - Layout:
 *   - Corner radius: `theme.radius.lg`
 *   - Small padding: vertical 4pt, horizontal 8pt
 *   - Medium padding: vertical 6pt, horizontal 12pt
 *   - Icon spacing: `theme.space.xs` (4pt)
 * - Typography:
 *   - Small: `theme.type.label.sm`
 *   - Medium: `theme.type.label.md`
 * - Icon sizes:
 *   - Small: 14pt
 *   - Medium: 16pt
 *
 * ## Parameters
 * - status: Current enrichment status (draft, partial, complete, failed)
 * - size: Badge size variant (small, medium) - default: small
 * - testID: Optional testing identifier for UI tests
 */
public struct LSEnrichmentStatusBadge: View {
    @Environment(\.theme) private var theme

    private let status: LSEnrichmentStatus
    private let size: LSEnrichmentBadgeSize
    private let testID: String

    public init(
        status: LSEnrichmentStatus,
        size: LSEnrichmentBadgeSize = .small,
        testID: String = "enrichment-status-badge"
    ) {
        self.status = status
        self.size = size
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        let config = status.config
        let statusColor = status.color(theme: theme)

        HStack(spacing: theme.space.xs) {
            // Status icon
            Image(systemName: config.iconName)
                .font(.system(size: size.iconSize))
                .foregroundStyle(statusColor)

            // Status label
            Text(config.label)
                .font(theme.type[keyPath: size.typographyKeyPath].font)
                .foregroundStyle(statusColor)
        }
        .padding(.vertical, size.verticalPadding)
        .padding(.horizontal, size.horizontalPadding)
        .background(statusColor.opacity(0.1))
        .overlay(
            RoundedRectangle(cornerRadius: theme.radius.lg)
                .stroke(statusColor.opacity(0.3), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.lg))
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Enrichment status: \(config.label)")
        .accessibilityIdentifier(testID)
    }
}

// MARK: - Preview

#Preview("Enrichment Status Badge - Draft") {
    VStack(alignment: .leading, spacing: 16) {
        LSEnrichmentStatusBadge(status: .draft)
        LSEnrichmentStatusBadge(status: .draft, size: .medium)
    }
    .padding()
    .laneShadowTheme()
}

#Preview("Enrichment Status Badge - Partial") {
    VStack(alignment: .leading, spacing: 16) {
        LSEnrichmentStatusBadge(status: .partial)
        LSEnrichmentStatusBadge(status: .partial, size: .medium)
    }
    .padding()
    .laneShadowTheme()
}

#Preview("Enrichment Status Badge - Complete") {
    VStack(alignment: .leading, spacing: 16) {
        LSEnrichmentStatusBadge(status: .complete)
        LSEnrichmentStatusBadge(status: .complete, size: .medium)
    }
    .padding()
    .laneShadowTheme()
}

#Preview("Enrichment Status Badge - Failed") {
    VStack(alignment: .leading, spacing: 16) {
        LSEnrichmentStatusBadge(status: .failed)
        LSEnrichmentStatusBadge(status: .failed, size: .medium)
    }
    .padding()
    .laneShadowTheme()
}

#Preview("Enrichment Status Badge - All Variants") {
    VStack(alignment: .leading, spacing: 16) {
        Text("Draft Status")
            .font(.headline)
        HStack(spacing: 8) {
            LSEnrichmentStatusBadge(status: .draft, size: .small)
            LSEnrichmentStatusBadge(status: .draft, size: .medium)
        }

        Text("Partial Status")
            .font(.headline)
        HStack(spacing: 8) {
            LSEnrichmentStatusBadge(status: .partial, size: .small)
            LSEnrichmentStatusBadge(status: .partial, size: .medium)
        }

        Text("Complete Status")
            .font(.headline)
        HStack(spacing: 8) {
            LSEnrichmentStatusBadge(status: .complete, size: .small)
            LSEnrichmentStatusBadge(status: .complete, size: .medium)
        }

        Text("Failed Status")
            .font(.headline)
        HStack(spacing: 8) {
            LSEnrichmentStatusBadge(status: .failed, size: .small)
            LSEnrichmentStatusBadge(status: .failed, size: .medium)
        }
    }
    .padding()
    .laneShadowTheme()
}

#Preview("Enrichment Status Badge - Complete") {
    VStack(alignment: .leading, spacing: 24) {
        Text("Enrichment Status Badge Showcase")
            .font(.title)
            .fontWeight(.bold)

        VStack(alignment: .leading, spacing: 8) {
            Text("Small Size")
                .font(.headline)
            HStack(spacing: 8) {
                LSEnrichmentStatusBadge(status: .draft, size: .small)
                LSEnrichmentStatusBadge(status: .partial, size: .small)
                LSEnrichmentStatusBadge(status: .complete, size: .small)
                LSEnrichmentStatusBadge(status: .failed, size: .small)
            }
        }

        VStack(alignment: .leading, spacing: 8) {
            Text("Medium Size")
                .font(.headline)
            HStack(spacing: 8) {
                LSEnrichmentStatusBadge(status: .draft, size: .medium)
                LSEnrichmentStatusBadge(status: .partial, size: .medium)
                LSEnrichmentStatusBadge(status: .complete, size: .medium)
                LSEnrichmentStatusBadge(status: .failed, size: .medium)
            }
        }
    }
    .padding()
    .laneShadowTheme()
}
