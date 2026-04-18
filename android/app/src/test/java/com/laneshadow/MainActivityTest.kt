package com.laneshadow

import org.junit.Assert.assertEquals
import org.junit.Test

class MainActivityTest {
    @Test
    fun normalizeDeploymentName_trimsAndStripsInlineComment() {
        val normalized = DeploymentConfigParser.normalizeDeploymentName("  dev:team#beta  # comment")

        assertEquals("dev:team", normalized)
    }

    @Test
    fun normalizeDeploymentName_returnsEmptyForCommentOnlyInput() {
        val normalized = DeploymentConfigParser.normalizeDeploymentName("   # no deployment")

        assertEquals("", normalized)
    }
}
