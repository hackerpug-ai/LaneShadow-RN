package com.laneshadow.ui.atoms

import com.laneshadow.ui.components.testTheme
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LSAvatarTest {
    @Test
    fun renders_image_variant_clipped_to_circle() {
        val source = File("../app/src/main/java/com/laneshadow/ui/atoms/LSAvatar.kt").readText()

        assertTrue(source.contains("Image("))
        assertTrue(source.contains(".clip(CircleShape)"))
        assertTrue(source.contains("contentScale = ContentScale.Crop"))
        assertEquals(testTheme.avatarSizing().md, AvatarSize.Md.resolve(testTheme))
    }

    @Test
    fun falls_back_to_initials_when_image_null() {
        val source = File("../app/src/main/java/com/laneshadow/ui/atoms/LSAvatar.kt").readText()

        assertTrue(source.contains("LSText("))
        assertEquals(AvatarSize.Md.initialsVariant(), TypographyVariant.Ui.Label.Md)
        assertEquals(testTheme.avatarSizing().md, AvatarSize.Md.resolve(testTheme))
    }

    @Test
    fun all_five_sizes_resolve_sizing_avatar_tokens() {
        assertEquals(testTheme.avatarSizing().xs, AvatarSize.Xs.resolve(testTheme))
        assertEquals(testTheme.avatarSizing().sm, AvatarSize.Sm.resolve(testTheme))
        assertEquals(testTheme.avatarSizing().md, AvatarSize.Md.resolve(testTheme))
        assertEquals(testTheme.avatarSizing().lg, AvatarSize.Lg.resolve(testTheme))
        assertEquals(testTheme.avatarSizing().xl, AvatarSize.Xl.resolve(testTheme))
    }

    @Test
    fun source_does_not_define_forbidden_color_font_or_icon_literals() {
        val source = File("../app/src/main/java/com/laneshadow/ui/atoms/LSAvatar.kt").readText()

        assertFalse(Regex("""Color\(0x""").containsMatchIn(source))
        assertFalse(Regex("""androidx\.compose\.material\.icons""").containsMatchIn(source))
        assertFalse(Regex("""Icons\.(Filled|Outlined)""").containsMatchIn(source))
        assertFalse(Regex("""FontFamily\.(Serif|SansSerif|Monospace|Default)""").containsMatchIn(source))
    }
}
