import * as SQLite from 'expo-sqlite';

// Discovery database singleton
let dbInstance: SQLite.SQLiteDatabase | null = null;

export interface DiscoveryDB extends SQLite.SQLiteDatabase {
  // Type alias for clarity
}

/**
 * Open or create the discovery database.
 * Returns a singleton instance.
 */
export async function openDiscoveryDB(): Promise<DiscoveryDB> {
  if (dbInstance) {
    return dbInstance as DiscoveryDB;
  }

  // Get the documents directory for the app
  // Use a hardcoded path that will work in React Native
  const documentsDir = '.';
  const dbPath = `${documentsDir}discovery.db`;

  const db = await SQLite.openDatabaseAsync(dbPath);

  // Create schema
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      centroid_lat REAL NOT NULL,
      centroid_lng REAL NOT NULL,
      state TEXT NOT NULL,
      archetype TEXT NOT NULL,
      composite_score REAL NOT NULL,
      content_version INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS route_grades (
      route_id TEXT PRIMARY KEY,
      road_class_score REAL,
      curvature_score REAL,
      elevation_score REAL,
      FOREIGN KEY (route_id) REFERENCES routes(id)
    );

    CREATE TABLE IF NOT EXISTS route_enrichment (
      route_id TEXT PRIMARY KEY,
      enrichment_version INTEGER NOT NULL,
      data TEXT NOT NULL,
      last_accessed INTEGER NOT NULL,
      FOREIGN KEY (route_id) REFERENCES routes(id)
    );

    CREATE INDEX IF NOT EXISTS idx_routes_state ON routes(state);
    CREATE INDEX IF NOT EXISTS idx_routes_archetype ON routes(archetype);
    CREATE INDEX IF NOT EXISTS idx_routes_composite_score ON routes(composite_score DESC);
    CREATE INDEX IF NOT EXISTS idx_routes_centroid ON routes(centroid_lat, centroid_lng);
    CREATE INDEX IF NOT EXISTS idx_routes_content_version ON routes(content_version);
    CREATE INDEX IF NOT EXISTS idx_enrichment_last_accessed ON route_enrichment(last_accessed);
  `);

  dbInstance = db;
  return db as DiscoveryDB;
}

/**
 * Close the database connection (mainly for testing).
 */
export async function closeDiscoveryDB(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}
