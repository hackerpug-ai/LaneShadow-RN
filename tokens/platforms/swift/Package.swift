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
    dependencies: [
        .package(path: "../../../../native-theme/platforms/NativeTheme"),
    ],
    targets: [
        .target(
            name: "LaneShadowTheme",
            dependencies: [
                .product(name: "NativeTheme", package: "NativeTheme"),
            ],
            path: "Sources/LaneShadowTheme",
            resources: [.process("Resources")]
        ),
        .testTarget(
            name: "LaneShadowThemeTests",
            dependencies: ["LaneShadowTheme"],
            path: "Tests/LaneShadowThemeTests"
        ),
    ]
)
