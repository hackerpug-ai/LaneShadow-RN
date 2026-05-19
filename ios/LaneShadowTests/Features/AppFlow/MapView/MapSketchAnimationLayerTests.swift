import Foundation
import LaneShadowTheme
import SwiftUI
import Testing
@testable import LaneShadow

@Suite("Map Sketch Animation Layer Tests")
@MainActor
struct MapSketchAnimationLayerTests {
    private let pathPoints = [
        CGPoint(x: 0, y: 50),
        CGPoint(x: 50, y: 30),
        CGPoint(x: 100, y: 60),
        CGPoint(x: 150, y: 40),
    ]

    private var productionFilePath: String {
        let testsFileURL = URL(fileURLWithPath: #filePath)
        return testsFileURL
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent("LaneShadow/AppFlow/MapView/MapSketchAnimationLayer.swift")
            .path
    }

    private func source() throws -> String {
        try String(contentsOfFile: productionFilePath, encoding: .utf8)
    }

    @Test("AC-1: path traverses pathPoints in order; head dot positioned at last point")
    func test_pathPoints_renderedInOrder() throws {
        let resolved = MapSketchAnimationLayer(pathPoints: pathPoints)
            .resolvedState(theme: Theme.shared, reduceMotion: false)

        #expect(resolved.pathPoints == pathPoints)
        #expect(resolved.headDotPoint == pathPoints.last)
    }

    @Test("AC-2: polyline color resolves through LaneShadowTheme.color.signal.default")
    func test_polylineColor_resolvesSignalDefault() throws {
        let resolved = MapSketchAnimationLayer(pathPoints: pathPoints)
            .resolvedState(theme: Theme.shared, reduceMotion: false)

        #expect(resolved.polylineColorToken == "color.signal.default")

        let src = try source()
        #expect(!src.contains("Color(red:"), "Must not hardcode RGB color")
        let hexPattern = #"#[0-9A-Fa-f]{6}"#
        #expect(
            src.range(of: hexPattern, options: .regularExpression) == nil,
            "Must not contain hex color literal"
        )
    }

    @Test("AC-3: animation timings read from theme.motion.recipes; zero 1400 literals")
    func test_animationTiming_readsFromMotionRecipes() throws {
        let resolved = MapSketchAnimationLayer(pathPoints: pathPoints)
            .resolvedState(theme: Theme.shared, reduceMotion: false)

        let polylineMotion = try #require(resolved.polylineMotion)
        let headDotMotion = try #require(resolved.headDotMotion)
        let polylineRecipe = try #require(Theme.shared.motion.recipes["sketchPolylineLoop"])
        let headDotRecipe = try #require(Theme.shared.motion.recipes["breathingHeadDot"])

        #expect(polylineMotion.duration == TimeInterval(polylineRecipe.duration) / 1000)
        #expect(polylineMotion.easing == polylineRecipe.easing)
        #expect(polylineMotion.autoreverses == false)

        #expect(headDotMotion.duration == TimeInterval(headDotRecipe.duration) / 1000)
        #expect(headDotMotion.easing == headDotRecipe.easing)
        #expect(headDotMotion.autoreverses == true)

        let src = try source()
        let count1400 = src.components(separatedBy: "1400").count - 1
        #expect(count1400 == 0, "Production file must contain zero hardcoded 1400 literals")
    }

    @Test("AC-4: reduce-motion collapses polyline to static dashPhase 0")
    func test_reduceMotion_polylineStatic() throws {
        let resolved = MapSketchAnimationLayer(pathPoints: pathPoints)
            .resolvedState(theme: Theme.shared, reduceMotion: true)

        #expect(resolved.strokeStyle.dashPhase == 0)
        #expect(resolved.polylineMotion == nil)
    }

    @Test("AC-5: reduce-motion collapses head dot to static opacity")
    func test_reduceMotion_headDotStatic() throws {
        let resolved = MapSketchAnimationLayer(pathPoints: pathPoints)
            .resolvedState(theme: Theme.shared, reduceMotion: true)

        #expect(resolved.headDotOpacity == resolved.fullOpacity)
        #expect(resolved.headDotMotion == nil)
    }

    @Test("AC-6: default motion env activates both polyline + head dot animations")
    func test_normalMotion_animationsActive() throws {
        let resolved = MapSketchAnimationLayer(pathPoints: pathPoints)
            .resolvedState(theme: Theme.shared, reduceMotion: false)

        #expect(resolved.polylineMotion != nil)
        #expect(resolved.headDotMotion != nil)
        #expect(resolved.strokeStyle.dashPhase == resolved.animatedDashPhase)
        #expect(resolved.headDotOpacity == resolved.animatedHeadDotOpacity)
    }

    @Test("AC-7: geometry data-driven via pathPoints; no UIScreen.main.bounds")
    func test_geometry_dataDriven() throws {
        let src = try source()

        #expect(!src.contains("UIScreen.main.bounds"))
        #expect(src.contains("pathPoints"))
    }

    @Test("AC-8: token purity — zero hex/RGB/duration/opacity hardcodes")
    func test_tokenPurity() throws {
        let src = try source()

        #expect(!src.contains("Color(red:"))
        let hexPattern = #"#[0-9A-Fa-f]{6}"#
        #expect(src.range(of: hexPattern, options: .regularExpression) == nil)
        #expect(!src.contains("0.55"))
        #expect(!src.contains("0.85"))
        #expect(!src.contains("1400"))
    }
}
