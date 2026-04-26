//
//  MockProvider.swift
//  LaneShadow
//
//  Mock provider protocol for pure, deterministic test data.
//
//  Providers must be:
//  - Pure (no I/O, no network, no disk access)
//  - Deterministic (same input always returns same output)
//  - Synchronous (no async/await, no throwing)
//

/// Mock provider interface for pure, deterministic test data.
///
/// Providers must be:
/// - Pure (no I/O, no network, no disk access)
/// - Deterministic (same input always returns same output)
/// - Synchronous (no async/await, no throwing)
public protocol MockProvider {
    /// Associated type representing the data this provider produces
    associatedtype Output

    /// Returns a deterministic value based on the variant.
    ///
    /// - Parameter variant: The variant name (e.g., "default", "empty", "overflow", "long-copy")
    /// - Returns: A deterministic instance of Output
    static func value(variant: String) -> Output

    /// List of supported variant names for this provider.
    static var variants: [String] { get }
}

/// Default implementation providing standard variants.
public extension MockProvider {
    static var variants: [String] {
        ["default", "empty", "overflow", "long-copy"]
    }
}
