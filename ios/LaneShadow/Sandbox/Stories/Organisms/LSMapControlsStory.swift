import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSMapControlsStory {
    static let all: [Story] = [
        // Map mode, light theme
        Story(
            id: "organisms.map-controls.map-light",
            tier: .organism,
            component: "MapControls",
            name: "Map Mode (Light)",
            summary: "Vertical workbar in map mode with zoom cluster, recenter, layers, and mode-toggle. Light theme.",
            previewMode: .fullScreen
        ) { _ in
            ZStack {
                Color.black.ignoresSafeArea()
                LSMapControls(
                    mode: .map,
                    hasRouteToSave: false,
                    onZoomIn: {},
                    onZoomOut: {},
                    onRecenter: {},
                    onLayers: {},
                    onToggleView: {}
                )
                .padding()
            }
        },

        // Map mode with unsaved route, light theme
        Story(
            id: "organisms.map-controls.map-with-route-light",
            tier: .organism,
            component: "MapControls",
            name: "Map Mode with Route (Light)",
            summary: "Vertical workbar in map mode with save chip (unsaved, default styling). Light theme.",
            previewMode: .fullScreen
        ) { _ in
            ZStack {
                Color.black.ignoresSafeArea()
                LSMapControls(
                    mode: .map,
                    hasRouteToSave: true,
                    isSavedRoute: false,
                    onZoomIn: {},
                    onZoomOut: {},
                    onRecenter: {},
                    onLayers: {},
                    onSaveRoute: {},
                    onToggleView: {}
                )
                .padding()
            }
        },

        // Map mode with saved route, light theme
        Story(
            id: "organisms.map-controls.map-saved-light",
            tier: .organism,
            component: "MapControls",
            name: "Map Mode Saved Route (Light)",
            summary: "Vertical workbar in map mode with save chip (saved, copper signal fill). Light theme.",
            previewMode: .fullScreen
        ) { _ in
            ZStack {
                Color.black.ignoresSafeArea()
                LSMapControls(
                    mode: .map,
                    hasRouteToSave: true,
                    isSavedRoute: true,
                    onZoomIn: {},
                    onZoomOut: {},
                    onRecenter: {},
                    onLayers: {},
                    onSaveRoute: {},
                    onToggleView: {}
                )
                .padding()
            }
        },

        // Chat mode, light theme
        Story(
            id: "organisms.map-controls.chat-light",
            tier: .organism,
            component: "MapControls",
            name: "Chat Mode (Light)",
            summary: "Workbar collapsed to single mode-toggle chip showing map glyph. Light theme.",
            previewMode: .fullScreen
        ) { _ in
            ZStack {
                Color.black.ignoresSafeArea()
                LSMapControls(
                    mode: .chat,
                    hasRouteToSave: false,
                    onToggleView: {}
                )
                .padding()
            }
        },

        // Map mode, dark theme
        Story(
            id: "organisms.map-controls.map-dark",
            tier: .organism,
            component: "MapControls",
            name: "Map Mode (Dark)",
            summary: "Vertical workbar in map mode with zoom cluster, recenter, layers, and mode-toggle. Dark theme.",
            previewMode: .fullScreen
        ) { _ in
            ZStack {
                Color.black.ignoresSafeArea()
                LSMapControls(
                    mode: .map,
                    hasRouteToSave: false,
                    onZoomIn: {},
                    onZoomOut: {},
                    onRecenter: {},
                    onLayers: {},
                    onToggleView: {}
                )
                .environment(\.colorScheme, .dark)
                .padding()
            }
        },

        // Map mode with unsaved route, dark theme
        Story(
            id: "organisms.map-controls.map-with-route-dark",
            tier: .organism,
            component: "MapControls",
            name: "Map Mode with Route (Dark)",
            summary: "Vertical workbar in map mode with save chip (unsaved, default styling). Dark theme.",
            previewMode: .fullScreen
        ) { _ in
            ZStack {
                Color.black.ignoresSafeArea()
                LSMapControls(
                    mode: .map,
                    hasRouteToSave: true,
                    isSavedRoute: false,
                    onZoomIn: {},
                    onZoomOut: {},
                    onRecenter: {},
                    onLayers: {},
                    onSaveRoute: {},
                    onToggleView: {}
                )
                .environment(\.colorScheme, .dark)
                .padding()
            }
        },

        // Map mode with saved route, dark theme
        Story(
            id: "organisms.map-controls.map-saved-dark",
            tier: .organism,
            component: "MapControls",
            name: "Map Mode Saved Route (Dark)",
            summary: "Vertical workbar in map mode with save chip (saved, copper signal fill). Dark theme.",
            previewMode: .fullScreen
        ) { _ in
            ZStack {
                Color.black.ignoresSafeArea()
                LSMapControls(
                    mode: .map,
                    hasRouteToSave: true,
                    isSavedRoute: true,
                    onZoomIn: {},
                    onZoomOut: {},
                    onRecenter: {},
                    onLayers: {},
                    onSaveRoute: {},
                    onToggleView: {}
                )
                .environment(\.colorScheme, .dark)
                .padding()
            }
        },

        // Chat mode, dark theme
        Story(
            id: "organisms.map-controls.chat-dark",
            tier: .organism,
            component: "MapControls",
            name: "Chat Mode (Dark)",
            summary: "Workbar collapsed to single mode-toggle chip showing map glyph. Dark theme.",
            previewMode: .fullScreen
        ) { _ in
            ZStack {
                Color.black.ignoresSafeArea()
                LSMapControls(
                    mode: .chat,
                    hasRouteToSave: false,
                    onToggleView: {}
                )
                .environment(\.colorScheme, .dark)
                .padding()
            }
        }
    ]
}
