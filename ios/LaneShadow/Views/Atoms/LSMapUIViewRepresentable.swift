import CoreLocation
import LaneShadowTheme
import MapboxCommon
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
    let accessToken: String
    let renderModel: LSMapRenderModel

    func makeUIView(context: Context) -> MapView {
        configureAccessToken()
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
        configureAccessToken()
        context.coordinator.mapView = mapView
        configureGestures(on: mapView)
        applyStyleAndCamera(to: mapView, coordinator: context.coordinator)
        renderPolylines(polylines, on: mapView, coordinator: context.coordinator)
        applyCameraFitIfNeeded(to: mapView, polylines: polylines)
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(onTap: onTap)
    }

    private func configureAccessToken() {
        guard !accessToken.isEmpty else { return }
        MapboxOptions.accessToken = accessToken
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

    private func renderPolylines(_ polylines: [PolylineData], on mapView: MapView, coordinator: Coordinator) {
        // Calculate new polyline IDs
        let newPolylineIds = Set(polylines.indices.map { "polyline-\($0)" })

        // Remove polyline managers that are no longer present
        let toRemove = coordinator.currentPolylineIds.subtracting(newPolylineIds)
        if !toRemove.isEmpty {
            for id in toRemove {
                mapView.annotations.removeAnnotationManager(withId: id)
                coordinator.polylineAnnotationManagers.removeValue(forKey: id)
            }
        }

        // Update or create one annotation manager per route polyline so each route can style independently.
        for (index, polyline) in polylines.enumerated() {
            let id = "polyline-\(index)"
            let lineCoordinates = polyline.coordinates.map { coord in
                CLLocationCoordinate2D(latitude: coord.lat, longitude: coord.lon)
            }

            let manager: PolylineAnnotationManager
            if let existingManager = coordinator.polylineAnnotationManagers[id] {
                manager = existingManager
            } else {
                manager = mapView.annotations.makePolylineAnnotationManager(id: id)
                coordinator.polylineAnnotationManagers[id] = manager
            }

            // Get color from renderModel polylines
            let style: LSMapPolylineStyle = if index < renderModel.polylines.count {
                renderModel.polylines[index]
            } else {
                // Fallback colors if not in renderModel
                LSMapPolylineStyle(
                    colorTokenPath: lsMapSignalTouringColorTokenPath,
                    color: lsMapSignalTouringColor,
                    lineWidth: lsMapStrokeWidthMd,
                    lineDasharray: nil
                )
            }

            manager.lineColor = StyleColor(style.color)
            manager.lineWidth = style.lineWidth
            manager.lineDasharray = style.lineDasharray
            manager.annotations = [
                PolylineAnnotation(id: id, lineCoordinates: lineCoordinates),
            ]
        }

        coordinator.currentPolylineIds = newPolylineIds
    }

    private func applyCameraFitIfNeeded(to mapView: MapView, polylines: [PolylineData]) {
        guard mapView.bounds.width > 0, mapView.bounds.height > 0 else {
            return
        }

        guard let fitCoordinates = resolveLSMapCameraFitCoordinates(for: cameraFit, polylines: polylines) else {
            return
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

        let coordinates = fitCoordinates.map { coordinate in
            CLLocationCoordinate2D(latitude: coordinate.lat, longitude: coordinate.lon)
        }
        let padding = renderModel.cameraFit.padding ?? 0
        let coordinatesPadding = UIEdgeInsets(
            top: padding,
            left: padding,
            bottom: padding,
            right: padding
        )
        guard let fittedCamera = try? mapView.mapboxMap.camera(
            for: coordinates,
            camera: cameraOptions,
            coordinatesPadding: coordinatesPadding,
            maxZoom: nil,
            offset: nil
        ) else {
            return
        }

        mapView.mapboxMap.setCamera(to: fittedCamera)
    }

    final class Coordinator: NSObject {
        let onTap: ((LatLng) -> Void)?
        weak var mapView: MapView?
        var currentStyleURI: String?
        var polylineAnnotationManagers: [String: PolylineAnnotationManager] = [:]
        var currentPolylineIds: Set<String> = []

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
