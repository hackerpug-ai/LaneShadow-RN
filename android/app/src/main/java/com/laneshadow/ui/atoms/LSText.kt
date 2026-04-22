package com.laneshadow.ui.atoms

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LocalLaneShadowTheme

@Composable
fun LSText(
    text: String,
    variant: TypographyVariant,
    color: ContentColor = ContentColor.Primary,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Text(
        text = text,
        modifier = modifier,
        style = variant.resolveTextStyle(theme),
        color = color.resolve(theme),
    )
}
