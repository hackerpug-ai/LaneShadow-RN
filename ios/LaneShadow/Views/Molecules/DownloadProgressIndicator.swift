import LaneShadowTheme
import SwiftUI

// MARK: - Download State Enum

/**
 * Download state enum
 *
 * Defines the five possible states for a download operation.
 * Following RN wrapper API from react-native/components/offline/download-progress-indicator.tsx
 */
public enum LSDownloadState: Sendable {
    case idle
    case downloading
    case paused
    case complete
    case failed
}

// MARK: - Download Progress Indicator Component

/**
 * Download progress indicator molecule component
 *
 * Displays download progress with a progress bar, percentage text,
 * downloaded/total MB, and estimated time remaining.
 * Following RN wrapper API from react-native/components/offline/download-progress-indicator.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Title: `theme.colors.onSurface.default`
 *   - Percentage: `theme.colors.primary.default`
 *   - MB text & status: `theme.colors.onSurface.muted`
 * - Typography:
 *   - Title: `theme.type.title.md` (16pt, semibold)
 *   - Percentage: `theme.type.label.md` (12pt, medium)
 *   - MB text & status: `theme.type.body.sm` (12pt, regular)
 * - Spacing:
 *   - Gap between elements: `theme.space.sm` (8pt)
 *
 * ## Parameters
 * - packName: Name of the pack being downloaded
 * - bytesDownloaded: Downloaded bytes so far
 * - totalBytes: Total bytes expected
 * - percentage: Download percentage 0-100
 * - eta: Estimated seconds remaining (nil if not applicable)
 * - state: Download state (idle, downloading, paused, complete, failed)
 * - onCancel: Optional cancel handler (only shown when downloading)
 * - testID: Test identifier for UI testing
 */
public struct LSDownloadProgressIndicator: View {
    @Environment(\.theme) private var theme

    private let packName: String
    private let bytesDownloaded: Int64
    private let totalBytes: Int64
    private let percentage: Int
    private let eta: TimeInterval?
    private let state: LSDownloadState
    private let onCancel: (() -> Void)?
    private let testID: String?

    public init(
        packName: String,
        bytesDownloaded: Int64,
        totalBytes: Int64,
        percentage: Int,
        eta: TimeInterval?,
        state: LSDownloadState,
        onCancel: (() -> Void)? = nil,
        testID: String? = nil
    ) {
        self.packName = packName
        self.bytesDownloaded = bytesDownloaded
        self.totalBytes = totalBytes
        self.percentage = percentage
        self.eta = eta
        self.state = state
        self.onCancel = onCancel
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        VStack(alignment: .leading, spacing: theme.space.sm) {
            // Title row
            titleRow

            // Progress bar
            progressBar

            // MB and status row
            infoRow

            // Cancel button (only when downloading)
            if state == .downloading, let onCancel = onCancel {
                cancelButton(onCancel)
            }
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Download progress: \(percentage)%")
        .accessibilityIdentifier(testID ?? "download-progress")
    }

    // MARK: - Subviews

    private var titleRow: some View {
        HStack {
            Text(state == .complete ? "Complete" : "Downloading...")
                .font(.system(size: theme.type.title.md.fontSize, weight: .semibold))
                .foregroundStyle(theme.colors.onSurface.default)

            Spacer()

            Text("\(percentage)%")
                .font(.system(size: theme.type.label.md.fontSize, weight: .medium))
                .foregroundStyle(theme.colors.primary.default)
        }
    }

    private var progressBar: some View {
        LSProgress(value: CGFloat(percentage), max: 100)
            .accessibilityLabel("Download progress: \(percentage)%")
    }

    private var infoRow: some View {
        HStack {
            Text("\(Self.formatMB(bytes: bytesDownloaded)) / \(Self.formatMB(bytes: totalBytes))")
                .font(.system(size: theme.type.body.sm.fontSize, weight: .regular))
                .foregroundStyle(theme.colors.onSurface.muted)

            Spacer()

            Text(statusText)
                .font(.system(size: theme.type.body.sm.fontSize, weight: .regular))
                .foregroundStyle(theme.colors.onSurface.muted)
        }
    }

    private func cancelButton(_ onCancel: @escaping () -> Void) -> some View {
        LSButton(
            "Cancel Download",
            variant: .ghost,
            size: .sm,
            onPress: onCancel,
            testID: testID.map { "\($0)-cancel" }
        )
    }

    // MARK: - Computed Properties

    private var statusText: String {
        switch state {
        case .complete:
            return "Download complete"
        case .failed:
            return "Download failed"
        case .paused:
            return "Paused"
        default:
            return Self.formatETA(seconds: eta)
        }
    }

    // MARK: - Helper Functions

    /// Formats bytes to MB string
    /// - Parameter bytes: Bytes to format
    /// - Returns: String in format "< 1 MB" or "X MB"
    public static func formatMB(bytes: Int64) -> String {
        let megabytes = Double(bytes) / (1024.0 * 1024.0)
        if megabytes < 1.0 {
            return "< 1 MB"
        }
        return "\(Int(megabytes)) MB"
    }

    /// Formats seconds to ETA string
    /// - Parameter seconds: Seconds to format (nil if not applicable)
    /// - Returns: String in format "X sec left" or "X min left" or empty string
    public static func formatETA(seconds: TimeInterval?) -> String {
        guard let seconds = seconds, seconds > 0 else {
            return ""
        }

        if seconds < 60 {
            return "\(Int(ceil(seconds))) sec left"
        }

        let mins = Int(ceil(seconds / 60.0))
        return "\(mins) min left"
    }
}

// MARK: - Preview

#Preview("Downloading - 0%") {
    LSDownloadProgressIndicator(
        packName: "Colorado Rockies",
        bytesDownloaded: 0,
        totalBytes: 3_000_000_000,
        percentage: 0,
        eta: 300,
        state: .downloading
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Downloading - 50%") {
    LSDownloadProgressIndicator(
        packName: "Colorado Rockies",
        bytesDownloaded: 1_500_000_000,
        totalBytes: 3_000_000_000,
        percentage: 50,
        eta: 120,
        state: .downloading
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Downloading - 75%") {
    LSDownloadProgressIndicator(
        packName: "Colorado Rockies",
        bytesDownloaded: 2_250_000_000,
        totalBytes: 3_000_000_000,
        percentage: 75,
        eta: 45,
        state: .downloading
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Paused") {
    LSDownloadProgressIndicator(
        packName: "Colorado Rockies",
        bytesDownloaded: 1_500_000_000,
        totalBytes: 3_000_000_000,
        percentage: 50,
        eta: nil,
        state: .paused
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Complete") {
    LSDownloadProgressIndicator(
        packName: "Colorado Rockies",
        bytesDownloaded: 3_000_000_000,
        totalBytes: 3_000_000_000,
        percentage: 100,
        eta: nil,
        state: .complete
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Failed") {
    LSDownloadProgressIndicator(
        packName: "Colorado Rockies",
        bytesDownloaded: 1_500_000_000,
        totalBytes: 3_000_000_000,
        percentage: 50,
        eta: nil,
        state: .failed
    )
    .laneShadowTheme()
    .padding()
}

#Preview("With cancel button") {
    LSDownloadProgressIndicator(
        packName: "Colorado Rockies",
        bytesDownloaded: 1_500_000_000,
        totalBytes: 3_000_000_000,
        percentage: 50,
        eta: 120,
        state: .downloading,
        onCancel: {
            print("Cancel tapped")
        }
    )
    .laneShadowTheme()
    .padding()
}

#Preview("All states") {
    VStack(spacing: 24) {
        LSDownloadProgressIndicator(
            packName: "Colorado Rockies",
            bytesDownloaded: 0,
            totalBytes: 3_000_000_000,
            percentage: 0,
            eta: 300,
            state: .idle
        )

        LSDownloadProgressIndicator(
            packName: "Colorado Rockies",
            bytesDownloaded: 1_500_000_000,
            totalBytes: 3_000_000_000,
            percentage: 50,
            eta: 120,
            state: .downloading
        )

        LSDownloadProgressIndicator(
            packName: "Colorado Rockies",
            bytesDownloaded: 1_500_000_000,
            totalBytes: 3_000_000_000,
            percentage: 50,
            eta: nil,
            state: .paused
        )

        LSDownloadProgressIndicator(
            packName: "Colorado Rockies",
            bytesDownloaded: 3_000_000_000,
            totalBytes: 3_000_000_000,
            percentage: 100,
            eta: nil,
            state: .complete
        )

        LSDownloadProgressIndicator(
            packName: "Colorado Rockies",
            bytesDownloaded: 1_500_000_000,
            totalBytes: 3_000_000_000,
            percentage: 50,
            eta: nil,
            state: .failed
        )
    }
    .laneShadowTheme()
    .padding()
}
