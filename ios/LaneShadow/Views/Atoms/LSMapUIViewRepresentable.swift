import CoreLocation
import MapboxMaps
import SwiftUI
import UIKit

/// UIViewRepresentable wrapper that isolates Mapbox SDK types from the public API.
/// This file is the only LSMap implementation file that imports MapboxMaps.
struct LSMapUIViewRepresentable: UIViewRepresentable {
    let mode: MapMode
    let camera: CameraPosition
    let cameraFit: CameraFit
    let polylines: [PolylineData]
    let annotations: [Annotation]
    let onTap: ((LatLng) -> Void)?
    let renderModel: LSMapRenderModel

    func makeUIView(context: Context) -> MapView {
        let mapView = MapView(frame: .zero)
        context.coordinator.mapView = mapView
        configureGestures(on: mapView)
        applyStyleAndCamera(to: mapView, coordinator: context.coordinator)

        if mode == .interactive, onTap != nil {
            let tapGesture = UITapGestureRecognizer(
                target: context.coordinator,
                action: #selector(Coordinator.handleTap(_:))
            )
            mapView.addGestureRecognizer(tapGesture)
        }

        return mapView
    }

    func updateUIView(_ mapView: MapView, context: Context) {
        context.coordinator.mapView = mapView
        configureGestures(on: mapView)
        applyStyleAndCamera(to: mapView, coordinator: context.coordinator)
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(onTap: onTap)
    }

    private func configureGestures(on mapView: MapView) {
        mapView.gestures.options.panEnabled = renderModel.interaction.gesturesEnabled
        mapView.gestures.options.pinchEnabled = renderModel.interaction.gesturesEnabled
        mapView.gestures.options.rotateEnabled = renderModel.interaction.gesturesEnabled
        mapView.gestures.options.pitchEnabled = renderModel.interaction.gesturesEnabled
        mapView.gestures.options.doubleTapToZoomInEnabled = renderModel.interaction.gesturesEnabled
        mapView.gestures.options.doubleTouchToZoomOutEnabled = renderModel.interaction.gesturesEnabled
        mapView.gestures.options.quickZoomEnabled = renderModel.interaction.gesturesEnabled
    }

    private func applyStyleAndCamera(to mapView: MapView, coordinator: Coordinator) {
        if let styleURIString = renderModel.styleURI,
           coordinator.currentStyleURI != styleURIString,
           let styleURI = StyleURI(rawValue: styleURIString)
        {
            mapView.mapboxMap.loadStyle(styleURI)
            coordinator.currentStyleURI = styleURIString
        }

        let cameraOptions = CameraOptions(
            center: CLLocationCoordinate2D(
                latitude: camera.center.lat,
                longitude: camera.center.lon
            ),
            zoom: camera.zoom,
            bearing: camera.bearing ?? 0,
            pitch: camera.pitch ?? 0
        )

        mapView.mapboxMap.setCamera(to: cameraOptions)
    }

    final class Coordinator: NSObject {
        let onTap: ((LatLng) -> Void)?
        weak var mapView: MapView?
        var currentStyleURI: String?

        init(onTap: ((LatLng) -> Void)?) {
            self.onTap = onTap
        }

        @MainActor @objc func handleTap(_ gesture: UITapGestureRecognizer) {
            guard let mapView, let onTap else { return }
            let coordinate = mapView.mapboxMap.cameraState.center
            onTap(
                LatLng(
                    lat: coordinate.latitude,
                    lon: coordinate.longitude
                )
            )
        }
    }
}
