import Foundation
import LaneShadowTheme
import Testing
import ViewInspector
@testable import LaneShadow

extension MapSketchAnimationLayer: Inspectable {}

@MainActor
final class MapSketchAnimationLayerTests {
    private var productionFilePath: String {
        let testsFileURL = URL(fileURLWithPath: #filePath)
        return testsFileURL
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

    // MARK: - AC-1: Path traversal in order + head dot at last point

    @Test("AC-1: path traverses pathPoints in order; head dot positioned at last point")
    func test_pathPoints_renderedInOrder() throws {
        let src = try source()
        #expect(src.contains("path.move(to: pathPoints[0])"), "Path must start at first point")
        let regex = #"for index in 1\s*\.\.<\s*pathPoints\.count"#
        #expect(src.range(of: regex, options: .regularExpression) != nil,
                "Path must traverse remaining points in order")
        let hasPositioning = src.contains("position(lastPoint)")
            || src.contains("position(x: lastPoint.x")
            || src.contains(".position(lastPoint)")
        #expect(hasPositioning, "Head dot must be positioned at last point of pathPoints")
    }

    // MARK: - AC-2: Color resolves through LaneShadowTheme.color.signal.default

    @Test("AC-2: polyline color resolves through LaneShadowTheme.color.signal.default")
    func test_polylineColor_resolvesSignalDefault() throws {
        let src = try source()
        let hasDefaultToken = src.contains("LaneShadowTheme.color.signal.default")
        #expect(hasDefaultToken, "Must use signal.default token")
        #expect(!src.contains("Color(red:"), "Must not hardcode RGB color")
        let hexPattern = #"#[0-9A-Fa-f]{6}"#
        #expect(src.range(of: hexPattern, options: .regularExpression) == nil,
                "Must not contain hex color literal")
    }

    // MARK: - AC-3: Animation timings from motion recipes; zero 1400 literals

    @Test("AC-3: animation timings read from theme.motion.recipes; zero 1400 literals")
    func test_animationTiming_readsFromMotionRecipes() throws {
        let src = try source()
        let hasPolylineLoop = src.contains("Animation.sketchPolylineLoop(theme:")
        #expect(hasPolylineLoop, "Must use Animation.sketchPolylineLoop helper")
        let hasBreathingDot = src.contains("Animation.breathingHeadDot(theme:")
        #expect(hasBreathingDot, "Must use Animation.breathingHeadDot helper")
        let count1400 = src.components(separatedBy: "1400").count - 1
        #expect(count1400 == 0,
                "Production file must contain zero hardcoded 1400 literals (found \(count1400))")
    }

    // MARK: - AC-4: Reduce-motion polyline static

    @Test("AC-4: reduce-motion collapses polyline to static dashPhase 0")
    func test_reduceMotion_polylineStatic() throws {
        let src = try source()
        let hasDashPhaseLogic = src.contains("dashPhase: reduceMotion ? 0")
            || src.contains("reduceMotion ? 0 :")
            || src.contains("if reduceMotion")
        #expect(hasDashPhaseLogic, "Must conditionally collapse dashPhase under reduce-motion")
        let hasReduceMotionGuard = src.contains("if(!reduceMotion)")
            || src.contains("if !reduceMotion")
            || src.contains("@Environment(\\.accessibilityReduceMotion)")
        #expect(hasReduceMotionGuard, "Must guard animation modifier with reduce-motion check")
    }

    // MARK: - AC-5: Reduce-motion head dot static

    @Test("AC-5: reduce-motion collapses head dot to static opacity")
    func test_reduceMotion_headDotStatic() throws {
        let src = try source()
        #expect(src.contains("Animation.breathingHeadDot(theme:"), "Must use breathing head dot animation")
        let hasReduceMotionCheck = src.contains("if(!reduceMotion)")
            || src.contains("if !reduceMotion")
            || src.contains("!reduceMotion")
        #expect(hasReduceMotionCheck, "Head dot animation must be guarded by reduce-motion check")
    }

    // MARK: - AC-6: Both animations active under default (non-reduce-motion)

    @Test("AC-6: default motion env activates both polyline + head dot animations")
    func test_normalMotion_animationsActive() throws {
        let src = try source()
        #expect(src.contains("Animation.sketchPolylineLoop"), "Polyline animation helper must be referenced")
        #expect(src.contains("Animation.breathingHeadDot"), "Head dot animation helper must be referenced")
    }

    // MARK: - AC-7: Geometry data-driven (no UIScreen.main.bounds)

    @Test("AC-7: geometry data-driven via pathPoints; no UIScreen.main.bounds")
    func test_geometry_dataDriven() throws {
        let src = try source()
        #expect(!src.contains("UIScreen.main.bounds"), "Must not reference UIScreen.main.bounds")
        #expect(src.contains("pathPoints"), "Must accept pathPoints parameter")
    }

    // MARK: - AC-8: Token purity

    @Test("AC-8: token purity — zero hex/RGB/duration/opacity hardcodes")
    func test_tokenPurity() throws {
        let src = try source()
        #expect(!src.contains("Color(red:"), "No hardcoded RGB colors")
        let hexPattern = #"#[0-9A-Fa-f]{6}"#
        #expect(src.range(of: hexPattern, options: .regularExpression) == nil, "No hex color literals")
        let fontSizePattern = #"\.font\(\.system\(size:\s*[0-9]"#
        #expect(src.range(of: fontSizePattern, options: .regularExpression) == nil,
                "No hardcoded font sizes")
        let count1400 = src.components(separatedBy: "1400").count - 1
        #expect(count1400 == 0, "No hardcoded 1400 duration literal")
        let opacity055Count = src.components(separatedBy: "0.55").count - 1
        let msg = "Must not hardcode 0.55 opacity literal — use theme.opacity.values lookup"
        #expect(opacity055Count == 0, "\(msg) or a true token-default")
    }

    // MARK: - TC-9: Production file exists and is non-empty

    @Test("TC-9: production file exists and is non-empty")
    func test_productionFileExists() throws {
        let src = try source()
        #expect(src.count > 100, "Production file must be non-trivial")
        #expect(src.contains("public struct MapSketchAnimationLayer"), "Must define the public struct")
    }
}
