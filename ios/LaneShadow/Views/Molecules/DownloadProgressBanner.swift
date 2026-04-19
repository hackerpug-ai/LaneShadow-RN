import LaneShadowTheme
import SwiftUI

// MARK: - Download Progress Banner Component

/**
 * Download progress banner molecule component
 *
 * A compact, dismissible banner for showing download progress
 * when navigating away from the main download screen.
 * Following React Native component from react-native/components/model/download-progress-banner.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Background: `theme.colors.surface.default` with 95% opacity
 *   - Progress bar fill: `theme.colors.warning.default`
 *   - Progress bar background: `theme.colors.warning.default` with 20% opacity
 *   - Title text: `theme.colors.onSurface.default`
 *   - Subtitle text: `theme.colors.onSurface.muted`
 *   - Bottom border: `theme.colors.warning.default` with 30% opacity
 *   - Dismiss icon: `theme.colors.onSurface.muted`
 * - Layout:
 *   - Position: absolute at top
 *   - Corner radius: `theme.radius.md` (8pt)
 *   - Padding: horizontal `theme.space.md` (12pt), vertical `theme.space.sm` (8pt top, 12pt bottom)
 *   - Progress bar height: 2pt
 * - Typography:
 *   - Title: 14pt semibold (system font)
 *   - Subtitle: 12pt medium (system font)
 * - Animation:
 *   - Slide in/out: 300ms easeInOut
 *   - Progress width: 300ms easeInOut
 *
 * ## Parameters
 * - progress: Download progress percentage (0-100)
 * - downloadedBytes: Number of bytes downloaded
 * - totalBytes: Total file size in bytes
 * - isVisible: Whether the banner is visible (triggers slide animation)
 * - onDismiss: Optional callback when dismiss button tapped
 * - onPress: Optional callback when banner tapped
 *
 * ## Behavior
 * - Slides in from top when `isVisible` becomes true
 * - Slides out to top when `isVisible` becomes false
 * - Progress bar animates width changes smoothly
 * - Respects accessibilityReduceMotion for instant transitions
 *
 * ## Accessibility
 * - Screen reader announces "Download progress: {progress}% complete"
 * - Close button labeled "Dismiss"
 */
public struct LSDownloadProgressBanner: View {
    @Environment(\.theme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    @State private var offset: CGFloat = -100
    @State private var animatedProgress: Double = 0

    private let progress: Double
    private let downloadedBytes: Int64
    private let totalBytes: Int64
    private let isVisible: Bool
    private let onDismiss: (() -> Void)?
    private let onPress: (() -> Void)?

    private let slideDuration: Double = 0.3
    private let progressDuration: Double = 0.3

    public init(
        progress: Double,
        downloadedBytes: Int64,
        totalBytes: Int64,
        isVisible: Bool,
        onDismiss: (() -> Void)? = nil,
        onPress: (() -> Void)? = nil
    ) {
        self.progress = progress
        self.downloadedBytes = downloadedBytes
        self.totalBytes = totalBytes
        self.isVisible = isVisible
        self.onDismiss = onDismiss
        self.onPress = onPress
    }

    // MARK: - Body

    public var body: some View {
        if isVisible {
            VStack(spacing: 0) {
                // Progress bar background
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        // Background track
                        Rectangle()
                            .fill(theme.colors.warning.default.opacity(0.2))

                        // Animated fill
                        Rectangle()
                            .fill(theme.colors.warning.default)
                            .frame(width: geometry.size.width * clampedProgress / 100)
                    }
                }
                .frame(height: 2)

                // Content
                HStack(alignment: .center, spacing: theme.space.sm) {
                    // Text content
                    VStack(alignment: .leading, spacing: 2) {
                        // Title
                        Text("Setting up your AI Companion...")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(theme.colors.onSurface.default)

                        // Subtitle
                        Text("\(Int(clampedProgress))% complete · Keep WiFi connected")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(theme.colors.onSurface.muted)
                    }

                    Spacer()

                    // Dismiss button
                    if onDismiss != nil {
                        Button(action: {
                            onDismiss?()
                        }) {
                            Image(systemName: "xmark")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(theme.colors.onSurface.muted)
                                .frame(width: 20, height: 20)
                        }
                        .buttonStyle(PlainButtonStyle())
                        .accessibilityLabel("Dismiss")
                    }
                }
                .padding(.horizontal, theme.space.md)
                .padding(.top, theme.space.xs)
                .padding(.bottom, theme.space.md)
            }
            .background(
                theme.colors.surface.default.opacity(0.95)
            )
            .overlay(
                Rectangle()
                    .fill(theme.colors.warning.default.opacity(0.3))
                    .frame(height: 1),
                alignment: .bottom
            )
            .frame(maxWidth: .infinity)
            .offset(y: offset)
            .accessibilityElement(children: .combine)
            .accessibilityLabel("Download progress: \(Int(clampedProgress))% complete")
            .onAppear {
                if reduceMotion {
                    offset = 0
                } else {
                    withAnimation(.easeInOut(duration: slideDuration)) {
                        offset = 0
                    }
                }
                animatedProgress = clampedProgress
            }
            .onChange(of: clampedProgress) { _, newValue in
                if reduceMotion {
                    animatedProgress = newValue
                } else {
                    withAnimation(.easeInOut(duration: progressDuration)) {
                        animatedProgress = newValue
                    }
                }
            }
            .onChange(of: isVisible) { _, newValue in
                if newValue {
                    // Slide in
                    if reduceMotion {
                        offset = 0
                    } else {
                        withAnimation(.easeInOut(duration: slideDuration)) {
                            offset = 0
                        }
                    }
                } else {
                    // Slide out
                    if reduceMotion {
                        offset = -100
                    } else {
                        withAnimation(.easeInOut(duration: slideDuration)) {
                            offset = -100
                        }
                    }
                }
            }
            .onTapGesture {
                onPress?()
            }
        }
    }

    // MARK: - Computed Properties

    /// Clamp progress to 0-100 range
    private var clampedProgress: Double {
        min(max(progress, 0), 100)
    }
}

// MARK: - Preview

#Preview("DownloadProgressBanner - 0%") {
    VStack(spacing: 0) {
        LSDownloadProgressBanner(
            progress: 0,
            downloadedBytes: 0,
            totalBytes: 3_000_000_000,
            isVisible: true
        )

        Spacer()

        Text("App content goes here")
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.gray.opacity(0.1))
    }
    .laneShadowTheme()
}

#Preview("DownloadProgressBanner - 25%") {
    VStack(spacing: 0) {
        LSDownloadProgressBanner(
            progress: 25,
            downloadedBytes: 750_000_000,
            totalBytes: 3_000_000_000,
            isVisible: true
        )

        Spacer()

        Text("App content goes here")
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.gray.opacity(0.1))
    }
    .laneShadowTheme()
}

#Preview("DownloadProgressBanner - 50%") {
    VStack(spacing: 0) {
        LSDownloadProgressBanner(
            progress: 50,
            downloadedBytes: 1_500_000_000,
            totalBytes: 3_000_000_000,
            isVisible: true
        )

        Spacer()

        Text("App content goes here")
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.gray.opacity(0.1))
    }
    .laneShadowTheme()
}

#Preview("DownloadProgressBanner - 75%") {
    VStack(spacing: 0) {
        LSDownloadProgressBanner(
            progress: 75,
            downloadedBytes: 2_250_000_000,
            totalBytes: 3_000_000_000,
            isVisible: true
        )

        Spacer()

        Text("App content goes here")
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.gray.opacity(0.1))
    }
    .laneShadowTheme()
}

#Preview("DownloadProgressBanner - 100%") {
    VStack(spacing: 0) {
        LSDownloadProgressBanner(
            progress: 100,
            downloadedBytes: 3_000_000_000,
            totalBytes: 3_000_000_000,
            isVisible: true
        )

        Spacer()

        Text("App content goes here")
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.gray.opacity(0.1))
    }
    .laneShadowTheme()
}

#Preview("DownloadProgressBanner - With dismiss button") {
    VStack(spacing: 0) {
        LSDownloadProgressBanner(
            progress: 60,
            downloadedBytes: 1_800_000_000,
            totalBytes: 3_000_000_000,
            isVisible: true,
            onDismiss: {
                print("Dismissed")
            }
        )

        Spacer()

        Text("App content goes here")
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.gray.opacity(0.1))
    }
    .laneShadowTheme()
}

#Preview("DownloadProgressBanner - Animation") {
    struct AnimationDemo: View {
        @State private var progress: Double = 0
        @State private var isVisible = false

        var body: some View {
            VStack(spacing: 0) {
                if isVisible {
                    LSDownloadProgressBanner(
                        progress: progress,
                        downloadedBytes: Int64(3_000_000_000 * progress / 100),
                        totalBytes: 3_000_000_000,
                        isVisible: true,
                        onDismiss: {
                            isVisible = false
                        }
                    )
                }

                Spacer()

                VStack(spacing: 16) {
                    Button("Toggle Banner") {
                        withAnimation(.easeInOut(duration: 0.3)) {
                            isVisible.toggle()
                        }
                    }
                    .buttonStyle(.bordered)

                    Button("Increment Progress") {
                        if progress < 100 {
                            progress += 10
                        }
                    }
                    .buttonStyle(.bordered)

                    Button("Reset Progress") {
                        progress = 0
                    }
                    .buttonStyle(.bordered)

                    Text("Progress: \(Int(progress))%")
                        .font(.caption)
                }
                .padding()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.gray.opacity(0.1))
            }
        }
    }

    return AnimationDemo()
        .laneShadowTheme()
}

#Preview("DownloadProgressBanner - Dark mode") {
    VStack(spacing: 0) {
        LSDownloadProgressBanner(
            progress: 65,
            downloadedBytes: 1_950_000_000,
            totalBytes: 3_000_000_000,
            isVisible: true,
            onDismiss: {
                print("Dismissed")
            }
        )

        Spacer()

        Text("Dark mode content")
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.black)
    }
    .laneShadowTheme()
    .preferredColorScheme(.dark)
}

#Preview("DownloadProgressBanner - Reduce Motion") {
    VStack(spacing: 0) {
        LSDownloadProgressBanner(
            progress: 80,
            downloadedBytes: 2_400_000_000,
            totalBytes: 3_000_000_000,
            isVisible: true
        )

        Spacer()

        Text("Reduce motion enabled")
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.gray.opacity(0.1))
    }
    .laneShadowTheme()
    .accessibilityReduceMotion(true)
}
