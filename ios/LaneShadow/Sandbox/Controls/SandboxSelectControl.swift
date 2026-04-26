// native-sandbox: configured
import NativeSandbox
import SwiftUI

/// Select control widget for sandbox inspector.
/// Renders a Picker with options bound to an ArgValues string key.
public struct SandboxSelectControl: View {
    private let argType: ArgType
    private var argValues: ArgValues
    private let onUpdate: (ArgValues) -> Void

    public init(argType: ArgType, argValues: ArgValues, onUpdate: @escaping (ArgValues) -> Void) {
        self.argType = argType
        self.argValues = argValues
        self.onUpdate = onUpdate
    }

    public var body: some View {
        if case let .select(options) = argType.control {
            Picker(argType.label, selection: Binding(
                get: { argValues.string(argType.name) },
                set: { newValue in
                    var updated = argValues
                    updated.set(argType.name, to: newValue)
                    onUpdate(updated)
                }
            )) {
                ForEach(options, id: \.self) {
                    Text($0).tag($0)
                }
            }
            .pickerStyle(.menu)
        }
    }
}
