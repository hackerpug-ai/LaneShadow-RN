/**
 * Convex App Configuration
 *
 * Registers components and middleware for the Convex backend.
 */
import geospatial from '@convex-dev/geospatial/convex.config'
import { defineApp } from 'convex/server'

const app = defineApp()
app.use(geospatial)

export default app
