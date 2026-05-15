package com.laneshadow.ui.mapapp

import androidx.compose.runtime.Composable
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController

@Composable
fun MapAppRoute(navController: NavHostController) {
    val viewModel: MapAppViewModel = hiltViewModel()
    MapApp(viewModel = viewModel, navController = navController)
}
