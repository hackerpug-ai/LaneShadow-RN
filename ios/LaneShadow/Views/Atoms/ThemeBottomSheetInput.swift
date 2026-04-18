import SwiftUI

struct ThemeBottomSheetInput: View {
    let label: String?
    @Binding var text: String
    let placeholder: String
    let leftIconName: String?
    let rightIconName: String?
    let isError: Bool
    let isEditable: Bool

    init(
        label: String? = nil,
        text: Binding<String>,
        placeholder: String = "",
        leftIconName: String? = nil,
        rightIconName: String? = nil,
        isError: Bool = false,
        isEditable: Bool = true
    ) {
        self.label = label
        _text = text
        self.placeholder = placeholder
        self.leftIconName = leftIconName
        self.rightIconName = rightIconName
        self.isError = isError
        self.isEditable = isEditable
    }

    var body: some View {
        ThemeInput(
            label: label,
            text: $text,
            placeholder: placeholder,
            leftIconName: leftIconName,
            rightIconName: rightIconName,
            isError: isError,
            isEditable: isEditable
        )
        .submitLabel(.done)
    }
}
