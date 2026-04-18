// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "LaneShadowTheme",
    platforms: [
        .iOS(.v17),
        .macOS(.v13),
    ],
    products: [
        .library(name: "LaneShadowTheme", targets: ["LaneShadowTheme"]),
    ],
    targets: [
        .target(
            name: "LaneShadowTheme",
            path: "Sources/LaneShadowTheme"
        ),
        .testTarget(
            name: "LaneShadowThemeTests",
            dependencies: ["LaneShadowTheme"],
            path: "Tests/LaneShadowThemeTests"
        ),
    ]
)
