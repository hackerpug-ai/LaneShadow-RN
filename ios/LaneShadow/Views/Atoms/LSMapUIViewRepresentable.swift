import LaneShadowTheme
import MapboxMaps
import SwiftUI
import UIKit

/// UIViewRepresentable wrapper that isolates Mapbox SDK types from the public API.
/// This file is the ONLY place where MapboxMaps may be imported in the LSMap component.
///
/// NOTE: This is a simplified implementation that provides the structure for Mapbox
/// integration. Full polyline/annotation support will be added in a follow-up task
/// once the Mapbox SDK API is fully understood and tested.
struct LSMapUIViewRepresentable: UIViewRepresentable {
    @Environment(\.theme) private var theme

    let mode: MapMode
    let camera: CameraPosition
    let cameraFit: CameraFit
    let polylines: [PolylineData]
    let annotations: [Annotation]
    let onTap: ((LatLng) -> Void)?

    func makeUIView(context: Context) -> MapView {
        let mapView = MapView()

        // Add tap gesture for interactive mode
        if mode == .interactive, onTap != nil {
            let tapGesture = UITapGestureRecognizer(
                target: context.coordinator,
                action: #selector(Coordinator.handleTap(_:))
            )
            mapView.addGestureRecognizer(tapGesture)
            context.coordinator.mapView = mapView
        }

        // Load initial style and set camera
        Task {
            guard let map = mapView.mapboxMap else { return }
            let styleURL = styleURL(for: theme)
            try? await map.loadStyleURI(styleURL)
            setInitialCamera(mapView)
        }

        return mapView
    }

    func updateUIView(_ mapView: MapView, context: Context) {
        // Updates are handled in makeUIView Task to avoid redundant updates
        // Full implementation will update polylines/annotations here
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(onTap: onTap)
    }

    // MARK: - Private Helpers

    private func setInitialCamera(_ mapView: MapView) {
        Task { @MainActor in
            guard let map = mapView.mapboxMap else { return }

            do {
                let cameraOptions = CameraOptions(
                    center: CLLocationCoordinate2D(
                        latitude: camera.center.lat,
                        longitude: camera.center.lon
                    ),
                    zoom: camera.zoom,
                    bearing: camera.bearing ?? 0,
                    pitch: camera.pitch ?? 0
                )

                switch cameraFit {
                case .static:
                    try map.setCamera(to: cameraOptions)
                case .polyline, .polylines:
                    // Camera fitting will be implemented in follow-up task
                    try map.setCamera(to: cameraOptions)
                }
            } catch {
                // Silently handle errors
            }
        }
    }

    private func styleURL(for theme: Theme) -> StyleURI {
        // Use hardcoded style URLs from contract until design tokens are updated
        // TODO: Use theme.map.style.light/.dark when tokens exist
        StyleURI(rawValue: "mapbox://styles/laneshadow/clxwarm01") ?? .streets
    }

    // MARK: - Coordinator

    final class Coordinator: NSObject {
        let onTap: ((LatLng) -> Void)?
        weak var mapView: MapView?

        init(onTap: ((LatLng) -> Void)?) {
            self.onTap = onTap
        }

        @objc func handleTap(_ gesture: UITapGestureRecognizer) {
            guard let mapView,
                  let map = mapView.mapboxMap,
                  let onTap else { return }

            let coordinate = map.cameraState.center
            onTap(
                LatLng(
                    lat: coordinate.latitude,
                    lon: coordinate.longitude
                )
            )
        }
    }
}
