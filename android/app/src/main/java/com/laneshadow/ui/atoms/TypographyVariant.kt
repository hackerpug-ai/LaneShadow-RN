package com.laneshadow.ui.atoms

import androidx.compose.ui.text.TextStyle
import com.laneshadow.theme.LaneShadowThemeValues

enum class TypographyFamily {
    Opinion,
    Ui,
    Instrument,
}

sealed interface TypographyVariant {
    val family: TypographyFamily

    fun resolveTextStyle(theme: LaneShadowThemeValues): TextStyle

    object Opinion {
        data object Xl : TypographyVariant {
            override val family = TypographyFamily.Opinion
            override fun resolveTextStyle(theme: LaneShadowThemeValues): TextStyle = theme.typography.opinion.xl
        }

        data object Lg : TypographyVariant {
            override val family = TypographyFamily.Opinion
            override fun resolveTextStyle(theme: LaneShadowThemeValues): TextStyle = theme.typography.opinion.lg
        }

        data object Md : TypographyVariant {
            override val family = TypographyFamily.Opinion
            override fun resolveTextStyle(theme: LaneShadowThemeValues): TextStyle = theme.typography.opinion.md
        }

        data object Sm : TypographyVariant {
            override val family = TypographyFamily.Opinion
            override fun resolveTextStyle(theme: LaneShadowThemeValues): TextStyle = theme.typography.opinion.sm
        }
    }

    object Ui {
        object Title {
            data object Lg : TypographyVariant {
                override val family = TypographyFamily.Ui
                override fun resolveTextStyle(theme: LaneShadowThemeValues): TextStyle = theme.typography.ui.title.lg
            }

            data object Md : TypographyVariant {
                override val family = TypographyFamily.Ui
                override fun resolveTextStyle(theme: LaneShadowThemeValues): TextStyle = theme.typography.ui.title.md
            }

            data object Sm : TypographyVariant {
                override val family = TypographyFamily.Ui
                override fun resolveTextStyle(theme: LaneShadowThemeValues): TextStyle = theme.typography.ui.title.sm
            }
        }

        object Body {
            data object Lg : TypographyVariant {
                override val family = TypographyFamily.Ui
                override fun resolveTextStyle(theme: LaneShadowThemeValues): TextStyle = theme.typography.ui.body.lg
            }

            data object Md : TypographyVariant {
                override val family = TypographyFamily.Ui
                override fun resolveTextStyle(theme: LaneShadowThemeValues): TextStyle = theme.typography.ui.body.md
            }

            data object Sm : TypographyVariant {
                override val family = TypographyFamily.Ui
                override fun resolveTextStyle(theme: LaneShadowThemeValues): TextStyle = theme.typography.ui.body.sm
            }
        }

        object Label {
            data object Lg : TypographyVariant {
                override val family = TypographyFamily.Ui
                override fun resolveTextStyle(theme: LaneShadowThemeValues): TextStyle = theme.typography.ui.label.lg
            }

            data object Md : TypographyVariant {
                override val family = TypographyFamily.Ui
                override fun resolveTextStyle(theme: LaneShadowThemeValues): TextStyle = theme.typography.ui.label.md
            }

            data object Sm : TypographyVariant {
                override val family = TypographyFamily.Ui
                override fun resolveTextStyle(theme: LaneShadowThemeValues): TextStyle = theme.typography.ui.label.sm
            }
        }
    }

    object Instrument {
        data object Lg : TypographyVariant {
            override val family = TypographyFamily.Instrument
            override fun resolveTextStyle(theme: LaneShadowThemeValues): TextStyle = theme.typography.instrument.lg
        }

        data object Md : TypographyVariant {
            override val family = TypographyFamily.Instrument
            override fun resolveTextStyle(theme: LaneShadowThemeValues): TextStyle = theme.typography.instrument.md
        }

        data object Sm : TypographyVariant {
            override val family = TypographyFamily.Instrument
            override fun resolveTextStyle(theme: LaneShadowThemeValues): TextStyle = theme.typography.instrument.sm
        }

        data object Xs : TypographyVariant {
            override val family = TypographyFamily.Instrument
            override fun resolveTextStyle(theme: LaneShadowThemeValues): TextStyle = theme.typography.instrument.xs
        }
    }
}
