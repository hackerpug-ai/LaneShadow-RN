import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSMapStories {
    static let all: [Story] = [
        previewStory,
        interactiveStory,
        onePolylineStory,
        threeAltPolylinesStory,
        startEndMarkersStory,
        autoFitStory,
        darkStyleStory,
        errorNoTokenStory,
        errorNoNetworkStory,
    ]

    // MARK: - Stories

    private static var previewStory: Story {
        Story(
            id: "atoms.map.preview",
            tier: .atom,
            component: "LSMap",
            name: "Preview Mode",
            summary: "Map in preview mode with Copper Light theme, static viewport.",
            argTypes: [],
            initialArgs: ArgValues([:])
        ) { _ in
            LSMap(
                mode: .preview,
                camera: CameraPosition(
                    center: LatLng(lat: 37.7749, lon: -122.4194),
                    zoom: 12.0
                ),
                cameraFit: .static
            )
            .frame(height: 400)
        }
    }

    private static var interactiveStory: Story {
        Story(
            id: "atoms.map.interactive",
            tier: .atom,
            component: "LSMap",
            name: "Interactive Mode",
            summary: "Map in interactive mode with gestures enabled.",
            argTypes: [],
            initialArgs: ArgValues([:])
        ) { _ in
            LSMap(
                mode: .interactive,
                camera: CameraPosition(
                    center: LatLng(lat: 37.7749, lon: -122.4194),
                    zoom: 12.0
                ),
                cameraFit: .static,
                onTap: { coordinate in
                    print("Tapped map at: \(coordinate.lat), \(coordinate.lon)")
                }
            )
            .frame(height: 400)
        }
    }

    private static var onePolylineStory: Story {
        Story(
            id: "atoms.map.one-polyline",
            tier: .atom,
            component: "LSMap",
            name: "Single Polyline",
            summary: "Map with a single route polyline using Copper route colors.",
            argTypes: [],
            initialArgs: ArgValues([:])
        ) { _ in
            LSMap(
                mode: .preview,
                camera: CameraPosition(
                    center: LatLng(lat: 37.8104, lon: -122.4752),
                    zoom: 10.8
                ),
                cameraFit: .polyline(padding: .spacing4),
                polylines: [
                    PolylineData(
                        coordinates: [
                            LatLng(lat: 37.7749, lon: -122.4194),
                            LatLng(lat: 37.8078, lon: -122.4750),
                            LatLng(lat: 37.8324, lon: -122.4803),
                            LatLng(lat: 37.8626, lon: -122.4856),
                        ],
                        variant: .best
                    ),
                ]
            )
            .frame(height: 400)
        }
    }

    private static var threeAltPolylinesStory: Story {
        Story(
            id: "atoms.map.three-alt-polylines",
            tier: .atom,
            component: "LSMap",
            name: "Three Alternative Routes",
            summary: "Map with three alternative route polylines using distinct Copper colors.",
            argTypes: [],
            initialArgs: ArgValues([:])
        ) { _ in
            LSMap(
                mode: .preview,
                camera: CameraPosition(
                    center: LatLng(lat: 37.8205, lon: -122.4048),
                    zoom: 10.6
                ),
                cameraFit: .polylines(padding: .spacing4),
                polylines: [
                    PolylineData(
                        coordinates: [
                            LatLng(lat: 37.7749, lon: -122.4194),
                            LatLng(lat: 37.7927, lon: -122.3930),
                            LatLng(lat: 37.8070, lon: -122.4028),
                            LatLng(lat: 37.8267, lon: -122.4230),
                            LatLng(lat: 37.8715, lon: -122.2730),
                        ],
                        variant: .best
                    ),
                    PolylineData(
                        coordinates: [
                            LatLng(lat: 37.7749, lon: -122.4194),
                            LatLng(lat: 37.7897, lon: -122.3902),
                            LatLng(lat: 37.8068, lon: -122.3777),
                            LatLng(lat: 37.8354, lon: -122.2912),
                            LatLng(lat: 37.8715, lon: -122.2730),
                        ],
                        variant: .alt1
                    ),
                    PolylineData(
                        coordinates: [
                            LatLng(lat: 37.7749, lon: -122.4194),
                            LatLng(lat: 37.7818, lon: -122.4043),
                            LatLng(lat: 37.7989, lon: -122.3884),
                            LatLng(lat: 37.8165, lon: -122.3605),
                            LatLng(lat: 37.8715, lon: -122.2730),
                        ],
                        variant: .alt2
                    ),
                ]
            )
            .frame(height: 400)
        }
    }

    private static var startEndMarkersStory: Story {
        Story(
            id: "atoms.map.start-end-markers",
            tier: .atom,
            component: "LSMap",
            name: "Start + End Markers",
            summary: "Map with start (success) and end (recording) annotations using Copper status colors.",
            argTypes: [],
            initialArgs: ArgValues([:])
        ) { _ in
            LSMap(
                mode: .preview,
                camera: CameraPosition(
                    center: LatLng(lat: 37.8104, lon: -122.4752),
                    zoom: 10.8
                ),
                cameraFit: .polyline(padding: .spacing4),
                polylines: [
                    PolylineData(
                        coordinates: [
                            LatLng(lat: 37.7749, lon: -122.4194),
                            LatLng(lat: 37.8626, lon: -122.4856),
                        ],
                        variant: .best
                    ),
                ],
                annotations: [
                    Annotation(
                        kind: .start,
                        coordinate: LatLng(lat: 37.7749, lon: -122.4194),
                        label: "San Francisco"
                    ),
                    Annotation(
                        kind: .end,
                        coordinate: LatLng(lat: 37.8626, lon: -122.4856),
                        label: "Muir Beach"
                    ),
                ]
            )
            .frame(height: 400)
        }
    }

    private static var autoFitStory: Story {
        Story(
            id: "atoms.map.auto-fit",
            tier: .atom,
            component: "LSMap",
            name: "Camera Auto-Fit",
            summary: "Map with camera auto-fitted to polyline bounds using Copper spacing tokens.",
            argTypes: [],
            initialArgs: ArgValues([:])
        ) { _ in
            LSMap(
                mode: .preview,
                camera: CameraPosition(
                    center: LatLng(lat: 37.8104, lon: -122.4752),
                    zoom: 10.8
                ),
                cameraFit: .polyline(padding: .spacing4),
                polylines: [
                    PolylineData(
                        coordinates: [
                            LatLng(lat: 37.7749, lon: -122.4194),
                            LatLng(lat: 37.8078, lon: -122.4750),
                            LatLng(lat: 37.8324, lon: -122.4803),
                            LatLng(lat: 37.8626, lon: -122.4856),
                        ],
                        variant: .best
                    ),
                ]
            )
            .frame(height: 400)
        }
    }

    private static var darkStyleStory: Story {
        Story(
            id: "atoms.map.dark-style",
            tier: .atom,
            component: "LSMap",
            name: "Dark Theme",
            summary: "Map with Copper Dark theme style.",
            argTypes: [],
            initialArgs: ArgValues([:])
        ) { context in
            LSMap(
                mode: .preview,
                camera: CameraPosition(
                    center: LatLng(lat: 37.7749, lon: -122.4194),
                    zoom: 12.0
                ),
                cameraFit: .static
            )
            .frame(height: 400)
            .preferredColorScheme(.dark)
            .environment(\.theme, Theme.shared)
        }
    }

    private static var errorNoTokenStory: Story {
        Story(
            id: "atoms.map.error-no-token",
            tier: .atom,
            component: "LSMap",
            name: "Error: Missing Token",
            summary: "Fallback LSGlassPanel rendered when MAPBOX_ACCESS_TOKEN is missing.",
            argTypes: [],
            initialArgs: ArgValues([:])
        ) { _ in
            // This story demonstrates the error fallback
            // In a real scenario, this would show when MBXAccessToken is nil
            LSMap(
                mode: .preview,
                camera: CameraPosition(
                    center: LatLng(lat: 37.7749, lon: -122.4194),
                    zoom: 12.0
                ),
                cameraFit: .static
            )
            .frame(height: 400)
        }
    }

    private static var errorNoNetworkStory: Story {
        Story(
            id: "atoms.map.error-no-network",
            tier: .atom,
            component: "LSMap",
            name: "Error: Network Unavailable",
            summary: "Fallback state when device is offline or DNS fails (placeholder).",
            argTypes: [],
            initialArgs: ArgValues([:])
        ) { _ in
            // This is a placeholder for network error handling
            // Full implementation would show a network error state
            LSMap(
                mode: .preview,
                camera: CameraPosition(
                    center: LatLng(lat: 37.7749, lon: -122.4194),
                    zoom: 12.0
                ),
                cameraFit: .static
            )
            .frame(height: 400)
        }
    }
}
