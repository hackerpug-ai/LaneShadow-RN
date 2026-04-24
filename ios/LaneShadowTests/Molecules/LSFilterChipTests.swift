import XCTest
@testable import LaneShadow

@MainActor
final class LSFilterChipTests: XCTestCase {
    func test_selected_uses_signal_default_unselected_uses_card_surface() throws {
        let selected = LSFilterChip(label: "Scenic", selected: true, onToggle: {})
        let unselected = LSFilterChip(label: "Scenic", selected: false, onToggle: {})

        XCTAssertEqual(selected.resolvedStyle.backgroundToken, "color.signal.default")
        XCTAssertEqual(selected.resolvedStyle.borderToken, "color.signal.default")
        XCTAssertEqual(unselected.resolvedStyle.backgroundToken, "color.surface.card")
        XCTAssertEqual(unselected.resolvedStyle.borderToken, "color.border.default")

        let source = try moleculeSource(named: "LSFilterChip.swift")
        XCTAssertTrue(source.contains("LSPill("))
        XCTAssertTrue(source.contains("LSText("))
        assertPillSurfaceModifiersAttachToContainer(
            in: source,
            pillSignature: "LSPill(size: .md)"
        )
    }

    func test_ontoggle_fires_exactly_once() {
        var tapCount = 0
        LSFilterChip.dispatch { tapCount += 1 }
        XCTAssertEqual(tapCount, 1)
    }

    private func moleculeSource(named fileName: String) throws -> String {
        let root = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()

        let url = root
            .appendingPathComponent("ios")
            .appendingPathComponent("LaneShadow")
            .appendingPathComponent("Views")
            .appendingPathComponent("Molecules")
            .appendingPathComponent(fileName)

        return try String(contentsOf: url, encoding: .utf8)
    }

    private func assertPillSurfaceModifiersAttachToContainer(
        in source: String,
        pillSignature: String,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        let segments = pillSourceSegments(in: source, pillSignature: pillSignature)

        XCTAssertNotNil(segments, "Expected to find \(pillSignature)", file: file, line: line)
        guard let segments else { return }

        XCTAssertEqual(occurrences(of: ".background(", in: source), 1, file: file, line: line)
        XCTAssertEqual(occurrences(of: ".overlay(", in: source), 1, file: file, line: line)
        XCTAssertFalse(segments.closureBody.contains(".background("), file: file, line: line)
        XCTAssertFalse(segments.closureBody.contains(".overlay("), file: file, line: line)
        XCTAssertFalse(segments.closureBody.contains(".padding(.horizontal"), file: file, line: line)
        XCTAssertTrue(segments.trailingModifiers.contains(".background("), file: file, line: line)
        XCTAssertTrue(segments.trailingModifiers.contains(".overlay("), file: file, line: line)
        XCTAssertTrue(segments.trailingModifiers.contains(".fill(style.backgroundColor)"), file: file, line: line)
        XCTAssertTrue(segments.trailingModifiers.contains(".stroke(style.borderColor"), file: file, line: line)
    }

    private func pillSourceSegments(
        in source: String,
        pillSignature: String
    ) -> (closureBody: String, trailingModifiers: String)? {
        guard let pillRange = source.range(of: pillSignature),
              let openBrace = source[pillRange.upperBound...].firstIndex(of: "{")
        else {
            return nil
        }

        var depth = 0
        var closeBrace: String.Index?

        for index in source[openBrace...].indices {
            switch source[index] {
            case "{":
                depth += 1
            case "}":
                depth -= 1
                if depth == 0 {
                    closeBrace = index
                    break
                }
            default:
                break
            }
        }

        guard let closeBrace else {
            return nil
        }

        let closureBody = String(source[source.index(after: openBrace) ..< closeBrace])
        let trailingModifiers = String(source[closeBrace...])
        return (closureBody, trailingModifiers)
    }

    private func occurrences(of needle: String, in source: String) -> Int {
        source.components(separatedBy: needle).count - 1
    }
}
