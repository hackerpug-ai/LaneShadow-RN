package com.laneshadow.data.favorites

import com.laneshadow.services.ConvexClientProvider
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow

/**
 * Repository interface for favorite locations from Convex
 */
interface FavoritesRepository {
    /**
     * Subscribe to favorite locations from Convex query `favorites.listFavoriteLocations`
     */
    fun subscribeToFavoriteLocations(): Flow<List<FavoriteLocation>>
}

@Singleton
class FavoritesRepositoryImpl @Inject constructor(
    private val convexClientProvider: ConvexClientProvider,
) : FavoritesRepository {
    override fun subscribeToFavoriteLocations(): Flow<List<FavoriteLocation>> {
        return convexClientProvider.observeFavoriteLocations()
    }
}
