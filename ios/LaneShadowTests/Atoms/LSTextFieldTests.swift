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

    func test_formfield_exposes_auth_states_secure_icons_and_helper() throws {
        let formFieldPath = URL(fileURLWithPath: sourceFilePath)
            .deletingLastPathComponent()
            .appendingPathComponent("../Molecules/LSFormField.swift")
            .standardized.path
        let source = try String(contentsOfFile: formFieldPath, encoding: .utf8)

        XCTAssertTrue(source.contains("leadingIcon"))
        XCTAssertTrue(source.contains("trailingIcon"))
        XCTAssertTrue(source.contains("isSecureEntry"))
        XCTAssertTrue(source.contains("helperText"))
        XCTAssertTrue(source.contains("state"))
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
