import XCTest
@testable import LaneShadow

@MainActor
final class LSTextFieldTests: XCTestCase {
    func test_error_state_renders_helper_text() throws {
        let source = try String(contentsOfFile: sourceFilePath, encoding: .utf8)

        XCTAssertTrue(source.contains("LSText(helperText"))
    }

    func test_disabled_state_suppresses_input() {
        XCTAssertEqual(LSTextField.commitChange(current: "locked", proposed: "edited", state: .disabled), "locked")
    }

    func test_leading_icon_slot_resolves_lsicon() throws {
        let source = try String(contentsOfFile: sourceFilePath, encoding: .utf8)

        XCTAssertTrue(source.contains("LSIcon(name: leadingIcon, size: .sm"))
    }

    func test_value_binding_reflects_typed_text_realtime() {
        XCTAssertEqual(LSTextField.commitChange(current: "", proposed: "a", state: .default), "a")
        XCTAssertEqual(LSTextField.commitChange(current: "a", proposed: "ab", state: .default), "ab")
        XCTAssertEqual(LSTextField.commitChange(current: "ab", proposed: "abc", state: .default), "abc")
    }

    private var sourceFilePath: String {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent("LaneShadow/Views/Atoms/LSTextField.swift")
            .path
    }
}
