import SwiftUI

struct ThemePrimaryButton: View {
    let title: String
    let iconName: String?
    let isEnabled: Bool
    let isLoading: Bool
    let action: () -> Void

    init(
        _ title: String,
        iconName: String? = nil,
        isEnabled: Bool = true,
        isLoading: Bool = false,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.iconName = iconName
        self.isEnabled = isEnabled
        self.isLoading = isLoading
        self.action = action
    }

    var body: some View {
        ThemeButton(
            title,
            variant: .default,
            size: .xxl,
            iconName: iconName,
            isEnabled: isEnabled,
            isLoading: isLoading,
            action: action
        )
    }
}
