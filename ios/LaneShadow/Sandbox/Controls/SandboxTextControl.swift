// native-sandbox: configured
import NativeSandbox
import SwiftUI

/// Text control widget for sandbox inspector.
/// Renders a TextField bound to an ArgValues string key.
public struct SandboxTextControl: View {
    private let argType: ArgType
    private var argValues: ArgValues
    private let onUpdate: (ArgValues) -> Void

    public init(argType: ArgType, argValues: ArgValues, onUpdate: @escaping (ArgValues) -> Void) {
        self.argType = argType
        self.argValues = argValues
        self.onUpdate = onUpdate
    }

    public var body: some View {
        TextField(argType.label, text: Binding(
            get: { argValues.string(argType.name) },
            set: { newValue in
                var updated = argValues
                updated.set(argType.name, to: newValue)
                onUpdate(updated)
            }
        ))
        .textFieldStyle(.roundedBorder)
        .autocorrectionDisabled()
    }
}
