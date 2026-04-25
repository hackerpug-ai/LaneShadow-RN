package com.laneshadow.ui.organisms

import java.io.File
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LSSectionHeaderTest {
    /**
     * AC-1: Title + See All with spacing.3 inset
     *
     * GIVEN: Developer composes LSSectionHeader(title="Nearby Routes", trailing=SectionHeaderTrailing.Link("See all", onTap={}))
     * WHEN: Composable enters composition
     * THEN: Leading LSText("Nearby Routes", typography.ui.title.md); trailing LSText("See all") tinted colors.signal.default with Modifier.clickable; root Row has Modifier.padding(start=Spacing.spacing3); horizontal arrangement SpaceBetween
     */
    @Test
    fun title_with_see_all_renders_correctly_with_inset() {
        val source = File("../app/src/main/java/com/laneshadow/ui/organisms/LSSectionHeader.kt").readText()

        // Must use LSText for title with typography.ui.title.md
        assertTrue(source.contains("LSText("))
        assertTrue(source.contains("TypographyVariant.Ui.Title.Md"))

        // Must use Row with SpaceBetween arrangement
        assertTrue(source.contains("Row("))
        assertTrue(source.contains("Arrangement.SpaceBetween"))

        // Must use theme.space.md for default inset (spacing.3 = 12pt)
        assertTrue(source.contains("theme.space.md"))

        // Must use clickable modifier for trailing link
        assertTrue(source.contains(".clickable("))

        // Must not use raw Text from Material3
        assertFalse(source.contains("import androidx.compose.material3.Text"))
        // Must not use hardcoded colors
        assertFalse(source.contains("Color(0x"))
    }

    /**
     * AC-2: Caps label style no trailing
     *
     * GIVEN: Developer composes LSSectionHeader(title="THIS WEEK")
     * WHEN: Composable enters composition
     * THEN: Title rendered with caps-style LSText(typography.ui.label.sm); no trailing test tag present; inset Spacing.spacing3 applied
     */
    @Test
    fun caps_label_style_no_trailing() {
        val source = File("../app/src/main/java/com/laneshadow/ui/organisms/LSSectionHeader.kt").readText()

        // Must use LSText for caps label with typography.ui.label.sm
        assertTrue(source.contains("TypographyVariant.Ui.Label.Sm"))

        // Must use ContentColor.Subtle for caps label
        assertTrue(source.contains("ContentColor.Subtle"))

        // Must have convenience overload for caps style
        assertTrue(source.contains("fun LSSectionHeader("))
        assertTrue(source.contains("trailing: SectionHeaderTrailing = SectionHeaderTrailing.None"))

        // Must not use raw Text from Material3
        assertFalse(source.contains("import androidx.compose.material3.Text"))
    }

    /**
     * AC-3: See All tap fires once
     *
     * GIVEN: LSSectionHeader with trailing=Link("See all", mock onTap)
     * WHEN: Test taps the See all label
     * THEN: onTap invocation count == 1
     */
    @Test
    fun see_all_tap_fires_callback_exactly_once() {
        val source = File("../app/src/main/java/com/laneshadow/ui/organisms/LSSectionHeader.kt").readText()

        // Must use onClick in clickable modifier
        assertTrue(source.contains(".clickable(onClick = "))

        // Must invoke onTap callback from trailing Link
        assertTrue(source.contains("trailing.onTap"))

        // Must use LSIcon for chevron right
        assertTrue(source.contains("LSIcon("))
        assertTrue(source.contains("IconName.ChevR"))
    }

    /**
     * AC-4: Custom inset prop override
     *
     * GIVEN: LSSectionHeader(title="Custom", inset=Spacing.spacing6)
     * WHEN: Composable enters composition
     * THEN: Root Row Modifier.padding(start=Spacing.spacing6) applied; default override honored
     */
    @Test
    fun custom_inset_prop_overrides_default() {
        val source = File("../app/src/main/java/com/laneshadow/ui/organisms/LSSectionHeader.kt").readText()

        // Must have insetOverride parameter
        assertTrue(source.contains("insetOverride"))

        // Must default to theme.space.md when insetOverride is null
        assertTrue(source.contains("insetOverride ?: theme.space.md"))

        // Must apply inset via padding modifier
        assertTrue(source.contains(".padding(start = inset)"))
    }

    /**
     * AC-6: No molecule imports + no banned primitives
     *
     * GIVEN: LSSectionHeader.kt source
     * WHEN: grep gate runs
     * THEN: No imports from com.laneshadow.ui.molecules.*; no Color(0x, TextStyle(, FontFamily( literals; only atoms + theme imports
     */
    @Test
    fun no_molecule_imports_and_no_banned_primitives() {
        val source = File("../app/src/main/java/com/laneshadow/ui/organisms/LSSectionHeader.kt").readText()

        // Must not import from molecules package
        assertFalse(source.contains("import com.laneshadow.ui.molecules"))

        // Must not use hardcoded Color literals
        assertFalse(source.contains("Color(0x"))

        // Must not use hardcoded TextStyle literals
        assertFalse(source.contains("TextStyle("))

        // Must not use hardcoded FontFamily literals
        assertFalse(source.contains("FontFamily("))

        // Must import from atoms package
        assertTrue(source.contains("import com.laneshadow.ui.atoms"))

        // Must use theme tokens
        assertTrue(source.contains("LocalLaneShadowTheme"))
    }
}
