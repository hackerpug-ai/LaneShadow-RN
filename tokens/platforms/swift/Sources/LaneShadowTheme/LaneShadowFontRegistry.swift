import CoreText
import Foundation

public enum LaneShadowFontRegistry {
    private static let lock = NSLock()
    private static var didRegister = false

    public static let fontResources = [
        "Newsreader",
        "Geist-Regular",
        "Geist-Medium",
        "Geist-SemiBold",
        "Geist-Bold",
        "JetBrainsMono-Regular",
        "JetBrainsMono-Medium",
        "JetBrainsMono-SemiBold",
    ]

    @discardableResult
    public static func registerFonts() -> Bool {
        lock.lock()
        defer { lock.unlock() }

        guard !didRegister else { return true }

        for resource in fontResources {
            guard let url = Bundle.module.url(
                forResource: resource,
                withExtension: "ttf"
            ) else {
                return false
            }

            var error: Unmanaged<CFError>?
            let registered = CTFontManagerRegisterFontsForURL(url as CFURL, .process, &error)
            if !registered, let error = error?.takeRetainedValue() {
                guard CFErrorGetCode(error) == CTFontManagerError.alreadyRegistered.rawValue else {
                    return false
                }
            }
        }

        didRegister = true
        return true
    }
}
