import Combine
import LaneShadowTheme
import SwiftUI

// MARK: - Keyboard Behavior

/**
 * Keyboard behavior enum
 *
 * Defines how the keyboard avoidance should behave.
 * - padding: Adds padding to bottom of container (default iOS behavior)
 * - position: Repositions the container (useful for fixed positioning)
 * - height: Adjusts container height
 */
public enum LSKeyboardBehavior: String, Sendable, CaseIterable {
    case padding
    case position
    case height
}

// MARK: - KeyboardAvoidingInput Component

/**
 * KeyboardAvoidingInput molecule component
 *
 * Wrapper view that provides keyboard avoidance for its children.
 * Observes keyboard notifications and adjusts layout accordingly.
 * Following React Native component from react-native/components/ui/keyboard-avoiding-input.tsx
 *
 * ## Design Tokens Used
 * - Layout:
 *   - Safe area insets: Uses UIApplication.shared.windows for bottom safe area
 *   - Keyboard height: Observed from NotificationCenter notifications
 *   - Animation duration: Matches keyboard animation duration
 *   - Animation curve: Matches keyboard animation curve
 *
 * ## Parameters
 * - behavior: How keyboard avoidance should behave (padding, position, height)
 * - offset: Extra vertical offset beyond keyboard avoidance (default: 0)
 * - includeSafeAreaBottom: Whether to add safe area bottom padding (default: true)
 * - content: Child view content
 *
 * ## Usage
 * ```swift
 * LSKeyboardAvoidingInput {
 *     TextField("Enter text...", text: $text)
 * }
 *
 * LSKeyboardAvoidingInput(
 *     behavior: .position,
 *     offset: 20,
 *     includeSafeAreaBottom: true
 * ) {
 *     VStack {
 *         Text("Fixed content")
 *         TextField("Input", text: $text)
 *     }
 * }
 * ```
 */
public struct LSKeyboardAvoidingInput<Content: View>: View {
    @State private var keyboardHeight: CGFloat = 0
    @State private var safeAreaBottom: CGFloat = 0

    private let behavior: LSKeyboardBehavior
    private let offset: CGFloat
    private let includeSafeAreaBottom: Bool
    private let content: () -> Content

    /// Creates a KeyboardAvoidingInput
    /// - Parameters:
    ///   - behavior: How keyboard avoidance should behave (default: padding)
    ///   - offset: Extra vertical offset beyond keyboard avoidance (default: 0)
    ///   - includeSafeAreaBottom: Whether to add safe area bottom padding (default: true)
    ///   - content: Child view content
    public init(
        behavior: LSKeyboardBehavior = .padding,
        offset: CGFloat = 0,
        includeSafeAreaBottom: Bool = true,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.behavior = behavior
        self.offset = offset
        self.includeSafeAreaBottom = includeSafeAreaBottom
        self.content = content
    }

    public var body: some View {
        GeometryReader { geometry in
            content()
                .frame(maxWidth: .infinity)
                .applyKeyboardBehavior(
                    behavior: behavior,
                    keyboardHeight: keyboardHeight,
                    offset: offset,
                    safeAreaBottom: includeSafeAreaBottom ? safeAreaBottom : 0,
                    geometryHeight: geometry.size.height
                )
                .onAppear {
                    safeAreaBottom = geometry.safeAreaInsets.bottom
                }
                .onChange(of: geometry.safeAreaInsets.bottom) { newBottom in
                    safeAreaBottom = newBottom
                }
        }
        .frame(maxWidth: .infinity)
        .onReceive(keyboardPublisher) { data in
            withAnimation(data.animation) {
                keyboardHeight = data.isKeyboardShowing ? data.height : 0
            }
        }
    }

    // MARK: - Keyboard Publisher

    private var keyboardPublisher: AnyPublisher<KeyboardData, Never> {
        Publishers.Merge(
            NotificationCenter.default.publisher(for: UIResponder.keyboardWillShowNotification)
                .map { notification in
                    KeyboardData(
                        isKeyboardShowing: true,
                        height: (notification.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect)?
                            .height ?? 0,
                        animation: animationCurve(from: notification)
                    )
                },
            NotificationCenter.default.publisher(for: UIResponder.keyboardWillHideNotification)
                .map { notification in
                    KeyboardData(
                        isKeyboardShowing: false,
                        height: 0,
                        animation: animationCurve(from: notification)
                    )
                }
        )
        .eraseToAnyPublisher()
    }

    private func animationCurve(from notification: Notification) -> Animation? {
        guard let duration = notification.userInfo?[UIResponder.keyboardAnimationDurationUserInfoKey] as? Double,
              let curve = notification.userInfo?[UIResponder.keyboardAnimationCurveUserInfoKey] as? UInt
        else {
            return nil
        }

        let options = UIView.AnimationOptions(rawValue: curve << 16)
        return Animation.timingCurve(0.25, 0.1, 0.25, 1, duration: duration)
    }
}

// MARK: - Keyboard Data

private struct KeyboardData {
    let isKeyboardShowing: Bool
    let height: CGFloat
    let animation: Animation?
}

// MARK: - View Extension

private extension View {
    @ViewBuilder
    func applyKeyboardBehavior(
        behavior: LSKeyboardBehavior,
        keyboardHeight: CGFloat,
        offset: CGFloat,
        safeAreaBottom: CGFloat,
        geometryHeight: CGFloat
    ) -> some View {
        let totalPadding = keyboardHeight + offset + safeAreaBottom

        switch behavior {
        case .padding:
            padding(.bottom, keyboardHeight > 0 ? totalPadding : safeAreaBottom)
        case .position:
            self
                .offset(y: keyboardHeight > 0 ? -keyboardHeight - offset : 0)
                .padding(.bottom, safeAreaBottom)
        case .height:
            frame(height: keyboardHeight > 0 ? max(0, geometryHeight - totalPadding) : nil)
        }
    }
}

// MARK: - Preview

#Preview("Default - Padding Behavior") {
    LSKeyboardAvoidingInput {
        VStack(spacing: 16) {
            Text("KeyboardAvoidingInput - Padding")
                .font(.headline)
            TextField("Enter text...", text: .constant(""))
                .textFieldStyle(.roundedBorder)
                .padding()
            Text("Uses padding-based avoidance (default iOS behavior)")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
    }
    .laneShadowTheme()
}

#Preview("Position Behavior") {
    LSKeyboardAvoidingInput(behavior: .position) {
        VStack(spacing: 16) {
            Text("KeyboardAvoidingInput - Position")
                .font(.headline)
            TextField("Enter text...", text: .constant(""))
                .textFieldStyle(.roundedBorder)
                .padding()
            Text("Uses position-based avoidance")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
    }
    .laneShadowTheme()
}

#Preview("Height Behavior") {
    LSKeyboardAvoidingInput(behavior: .height) {
        VStack(spacing: 16) {
            Text("KeyboardAvoidingInput - Height")
                .font(.headline)
            TextField("Enter text...", text: .constant(""))
                .textFieldStyle(.roundedBorder)
                .padding()
            Text("Adjusts container height")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
    }
    .laneShadowTheme()
    .frame(height: 400)
}

#Preview("With Offset") {
    LSKeyboardAvoidingInput(offset: 20) {
        VStack(spacing: 16) {
            Text("With 20pt Offset")
                .font(.headline)
            TextField("Enter text...", text: .constant(""))
                .textFieldStyle(.roundedBorder)
                .padding()
            Text("Extra spacing above keyboard")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
    }
    .laneShadowTheme()
}

#Preview("Without Safe Area Bottom") {
    LSKeyboardAvoidingInput(includeSafeAreaBottom: false) {
        VStack(spacing: 16) {
            Text("Without Safe Area Bottom")
                .font(.headline)
            TextField("Enter text...", text: .constant(""))
                .textFieldStyle(.roundedBorder)
                .padding()
            Text("No additional safe area padding")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
    }
    .laneShadowTheme()
}

#Preview("Multiple Inputs") {
    LSKeyboardAvoidingInput {
        VStack(spacing: 16) {
            Text("Multiple Inputs")
                .font(.headline)
            TextField("First input", text: .constant(""))
                .textFieldStyle(.roundedBorder)
            TextField("Second input", text: .constant(""))
                .textFieldStyle(.roundedBorder)
            TextField("Third input", text: .constant(""))
                .textFieldStyle(.roundedBorder)
            Text("All inputs avoid keyboard")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
    }
    .laneShadowTheme()
}
