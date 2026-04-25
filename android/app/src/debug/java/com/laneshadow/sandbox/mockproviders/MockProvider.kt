package com.laneshadow.sandbox.mockproviders

/**
 * Mock provider interface for pure, deterministic test data.
 *
 * Providers must be:
 * - Pure (no I/O, no network, no disk access)
 * - Deterministic (same input always returns same output)
 * - Synchronous (no coroutines, no suspend functions)
 *
 * @param T The type of data this provider produces
 */
interface MockProvider<T> {
    /**
     * Returns a deterministic value based on the variant.
     *
     * @param variant The variant name (e.g., "default", "empty", "overflow", "long-copy")
     * @return A deterministic instance of T
     */
    fun value(variant: String = "default"): T

    /**
     * List of supported variant names for this provider.
     */
    val variants: List<String>
        get() = listOf("default", "empty", "overflow", "long-copy")
}
