package com.laneshadow

object DeploymentConfigParser {
    fun normalizeDeploymentName(rawValue: String): String {
        val withoutComment = rawValue.substringBefore("#")
        val firstToken = withoutComment.trim().substringBefore(' ')
        return firstToken.trim()
    }
}
