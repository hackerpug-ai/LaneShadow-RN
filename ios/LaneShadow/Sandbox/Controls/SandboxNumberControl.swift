// native-sandbox: configured
import NativeSandbox
import SwiftUI

/// Number control widget for sandbox inspector.
/// Renders a Stepper bound to an ArgValues number key.
public struct SandboxNumberControl: View {
    private let argType: ArgType
    private var argValues: ArgValues
    private let onUpdate: (ArgValues) -> Void

    public init(argType: ArgType, argValues: ArgValues, onUpdate: @escaping (ArgValues) -> Void) {
        self.argType = argType
        self.argValues = argValues
        self.onUpdate = onUpdate
    }

    public var body: some View {
        if case let .range(min, max, step) = argType.control {
            HStack {
                Text(argType.label)
                Spacer()
                Stepper(
                    value: Binding(
                        get: { argValues.double(argType.name) },
                        set: { newValue in
                            var updated = argValues
                            updated.set(argType.name, to: newValue)
                            onUpdate(updated)
                        }
                    ),
                    in: min ... max,
                    step: step
                ) {
                    Text("\(argValues.double(argType.name), specifier: "%.1f")")
                        .frame(minWidth: 50, alignment: .trailing)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }
}
