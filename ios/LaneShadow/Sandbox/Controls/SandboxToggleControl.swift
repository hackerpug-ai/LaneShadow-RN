// native-sandbox: configured
import NativeSandbox
import SwiftUI

/// Toggle control widget for sandbox inspector.
/// Renders a Toggle bound to an ArgValues bool key.
public struct SandboxToggleControl: View {
    private let argType: ArgType
    private var argValues: ArgValues
    private let onUpdate: (ArgValues) -> Void

    public init(argType: ArgType, argValues: ArgValues, onUpdate: @escaping (ArgValues) -> Void) {
        self.argType = argType
        self.argValues = argValues
        self.onUpdate = onUpdate
    }

    public var body: some View {
        Toggle(argType.label, isOn: Binding(
            get: { argValues.bool(argType.name) },
            set: { newValue in
                var updated = argValues
                updated.set(argType.name, to: newValue)
                onUpdate(updated)
            }
        ))
    }
}
