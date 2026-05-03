import ConvexMobile
import Foundation
import Testing
@testable import LaneShadow

@Suite("LaneShadow Error Mapping Tests")
@MainActor
struct LaneShadowErrorMappingTests {
    @Test("test_forbidden_case_exists")
    func forbidden_case_exists() {
        // This test verifies the .forbidden case exists in the enum
        let error: LaneShadowError = .forbidden
        #expect(error.errorDescription?.isEmpty == false)
    }

    @Test("test_forbidden_rawMessage")
    func forbidden_rawMessage() {
        let error: LaneShadowError = .forbidden
        #expect(error.rawMessage == "FORBIDDEN")
    }

    @Test("test_forbidden_userFacingCopy")
    func forbidden_userFacingCopy() {
        let error: LaneShadowError = .forbidden
        #expect(error.errorDescription?.isEmpty == false)
        #expect(error.bodyText.isEmpty == false)
    }

    @Test("test_forbidden_allowsRetry")
    func forbidden_allowsRetry() {
        let error: LaneShadowError = .forbidden
        #expect(error.allowsRetry == false)
    }

    @Test("test_forbidden_requiresAuthentication")
    func forbidden_requiresAuthentication() {
        let error: LaneShadowError = .forbidden
        #expect(error.requiresAuthenticationRecovery == true)
    }

    @Test("test_codeMap_has_unauthenticated_entry")
    func codeMap_has_unauthenticated_entry() {
        // Test that UNAUTHENTICATED code maps to .unauthenticated
        let error = ClientError.ConvexError(data: #"{"code":"UNAUTHENTICATED"}"#)
        let mapped = LaneShadowError.map(error)
        #expect(mapped == .unauthenticated)
        #expect(mapped.rawMessage == "UNAUTHENTICATED")
    }

    @Test("test_codeMap_has_forbidden_entry")
    func codeMap_has_forbidden_entry() {
        // Test that FORBIDDEN code maps to .forbidden
        let error = ClientError.ConvexError(data: #"{"code":"FORBIDDEN"}"#)
        let mapped = LaneShadowError.map(error)
        #expect(mapped == .forbidden)
        #expect(mapped.rawMessage == "FORBIDDEN")
    }

    @Test("test_legacy_phrase_mapping_removed")
    func legacy_phrase_mapping_removed() {
        // Test that the legacy "authentication required" phrase mapping
        // no longer overrides the new UNAUTHENTICATED code mapping
        let error = ClientError.ServerError(msg: "authentication required")
        let mapped = LaneShadowError.map(error)

        // Should NOT map to .authRequired (legacy behavior)
        // Should fall through to unknown since we removed the phrase mapping
        #expect(mapped != .authRequired)
        #expect(mapped == .unknown("authentication required"))
    }
}
