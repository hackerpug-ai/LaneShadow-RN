// native-sandbox: configured
import LaneShadowTheme
import NativeSandbox
import NativeTheme
import SwiftUI

/// Infrastructure control stories demonstrating argType controls.
@MainActor
enum InfrastructureControlsStories {
    /// Story demonstrating all standard argType controls.
    static let demoControls = Story(
        id: "infrastructure.controls.demo",
        tier: .infrastructure,
        component: "argTypes",
        name: "Demo: All Controls",
        argTypes: [
            ArgType("username", label: "Username", control: .text, summary: "Text input field"),
            ArgType(
                "size",
                label: "Size",
                control: .select(options: ["Small", "Medium", "Large"]),
                summary: "Dropdown selector"
            ),
            ArgType("enabled", label: "Enabled", control: .boolean, summary: "Toggle switch"),
            ArgType(
                "quantity",
                label: "Quantity",
                control: .range(min: 0, max: 10, step: 1),
                summary: "Number stepper"
            ),
        ],
        render: { args in
            VStack(alignment: .leading, spacing: 16) {
                Text("Control Demo")
                    .font(.title)
                    .foregroundStyle(.primary)

                Text("Username: \(args.string("username"))")
                    .font(.body)

                Text("Size: \(args.string("size"))")
                    .font(.body)

                Text("Enabled: \(args.bool("enabled") ? "Yes" : "No")")
                    .font(.body)

                Text("Quantity: \(args.int("quantity"))")
                    .font(.body)
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(.ultraThinMaterial)
        }
    )

    /// Story demonstrating color token control.
    static let colorToken = Story(
        id: "infrastructure.controls.color-token",
        tier: .infrastructure,
        component: "colorToken",
        name: "Demo: Color Token",
        argTypes: [
            ArgType(
                "buttonColor",
                label: "Button Color",
                control: .color(swatches: []),
                summary: "Color token selector"
            ),
        ],
        render: { args in
            let colorGroupName = args.string("buttonColor")
            let theme = Theme.shared

            VStack(alignment: .leading, spacing: 16) {
                Text("Color Token Demo")
                    .font(.title)
                    .foregroundStyle(.primary)

                Text("Selected: \(colorGroupName)")
                    .font(.body)
                    .foregroundStyle(.secondary)

                Button {
                    // No action needed for demo
                } label: {
                    Text("Button with \(colorGroupName) color")
                        .padding()
                        .background(theme.colors.primary.default)
                        .foregroundStyle(.white)
                        .cornerRadius(8)
                }
                .buttonStyle(.plain)
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(.ultraThinMaterial)
        }
    )

    /// Story demonstrating theme controller integration.
    static let themeController = Story(
        id: "infrastructure.theme.controller",
        tier: .infrastructure,
        component: "themeController",
        name: "Demo: Theme Controller",
        argTypes: [],
        render: { _ in
            VStack(alignment: .leading, spacing: 16) {
                Text("Theme Controller Demo")
                    .font(.title)
                    .foregroundStyle(.primary)

                Text("Toggle the theme in the sandbox top bar to see this view re-render.")
                    .font(.body)
                    .foregroundStyle(.secondary)

                HStack(spacing: 16) {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(Color.red)
                        .frame(width: 60, height: 60)

                    RoundedRectangle(cornerRadius: 8)
                        .fill(Color.blue)
                        .frame(width: 60, height: 60)

                    RoundedRectangle(cornerRadius: 8)
                        .fill(Color.green)
                        .frame(width: 60, height: 60)
                }
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(.ultraThinMaterial)
        }
    )

    static let all: [Story] = [
        demoControls,
        colorToken,
        themeController,
    ]
}
