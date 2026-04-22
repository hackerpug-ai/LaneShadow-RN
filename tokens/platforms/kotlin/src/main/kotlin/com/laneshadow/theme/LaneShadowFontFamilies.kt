package com.laneshadow.theme

import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight

object LaneShadowFontFamilies {
    val newsreader: FontFamily = FontFamily(
        Font(R.font.newsreader_variable, FontWeight.Normal),
        Font(R.font.newsreader_variable, FontWeight.Medium),
        Font(R.font.newsreader_variable, FontWeight.SemiBold),
        Font(R.font.newsreader_variable, FontWeight.Bold),
    )

    val geist: FontFamily = FontFamily(
        Font(R.font.geist_regular, FontWeight.Normal),
        Font(R.font.geist_medium, FontWeight.Medium),
        Font(R.font.geist_semibold, FontWeight.SemiBold),
        Font(R.font.geist_bold, FontWeight.Bold),
    )

    val jetBrainsMono: FontFamily = FontFamily(
        Font(R.font.jetbrains_mono_regular, FontWeight.Normal),
        Font(R.font.jetbrains_mono_medium, FontWeight.Medium),
        Font(R.font.jetbrains_mono_semibold, FontWeight.SemiBold),
    )
}
