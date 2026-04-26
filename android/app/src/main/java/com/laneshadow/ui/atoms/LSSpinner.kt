package com.laneshadow.ui.atoms

import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import com.laneshadow.theme.LocalLaneShadowTheme

val LSSpinnerSizeKey = SemanticsPropertyKey<Float>("LSSpinnerSize")
val LSSpinnerTintKey = SemanticsPropertyKey<Color>("LSSpinnerTint")

private var SemanticsPropertyReceiver.lsSpinnerSize by LSSpinnerSizeKey
private var SemanticsPropertyReceiver.lsSpinnerTint by LSSpinnerTintKey

@Composable
fun LSSpinner(
    size: SpinnerSize = SpinnerSize.Md,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    val resolvedSize = size.resolve(theme)
    val tint = theme.colors.primary.default

    CircularProgressIndicator(
        modifier = modifier
            .size(resolvedSize)
            .testTag("ls-spinner")
            .semantics {
                lsSpinnerSize = resolvedSize.value
                lsSpinnerTint = tint
                contentDescription = "Loading"
                progressBarRangeInfo = ProgressBarRangeInfo.Indeterminate
            },
        color = tint,
    )
}
