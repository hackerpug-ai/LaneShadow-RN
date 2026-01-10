# File Storage Strategy

## Overview

Convex Storage is flat blob storage - there are no folders or hierarchies. Organization happens via database tables that reference storage IDs.

## Storage Patterns

### 1. Ephemeral Audio Files (Voice Assistant)

**Purpose**: Temporary voice recordings for transcription

**Flow** (Optimized - No Storage Step):
1. Record audio → Convert to base64 → Send directly to `ingestVoiceOrText`
2. Backend transcribes → Never persisted → Returns `audioStorageIdCleared: true` (always true now)
3. No database record created, no storage used

**Why**: Privacy-first + performance - voice recordings never touch storage, sent directly in action call

**Function**: `audioToBase64(uri)` → `string | null` (base64-encoded audio)

**Note**: Legacy `audioStorageId` flow still supported but deprecated. Use `audioBase64` for new code.

### 2. Persistent Media Assets (Images/Videos)

**Purpose**: Photos and videos attached to posts

**Flow**:
1. Capture/select image → Upload to Convex Storage → Get `storageId`
2. Call `createMediaAssetFromStorage` mutation with metadata
3. Backend creates `mediaAssets` record with:
   - Storage ID reference
   - Organization, scope, uploader tracking
   - Dimensions, MIME type, timestamps
   - Policy flags, domains, etc.
4. Media asset ID attached to posts/care logs

**Why**: Full metadata tracking for organization, search, and policy enforcement

**Function**: `uploadImage(uri, mimeType, scopeType, scopeId, convex, options?)` → `{ storageId, mediaAssetId } | null`

## Storage Organization

### Database-Driven Organization

Files are organized via `mediaAssets` table with indexes:
- `by_org_scope_time` - Filter by organization + scope + posted time (feed queries)
- `by_uploader_workos_user_id` - Find user's uploads
- `by_scope` - Find all media for a scope
- `by_storage_id` - Lookup by storage ID

### Metadata Tracking

**Required Fields**:
- `organizationId` - Tenant isolation
- `uploaderWorkosUserId` - Who uploaded
- `scopeType`, `scopeId` - Where it belongs (classroom/campus/school)
- `storageId` - Convex Storage reference
- `mime` - Content type

**Optional Fields**:
- `width`, `height` - Image dimensions
- `caption` - Teacher-written description
- `domains` - Montessori curriculum areas
- `policyFlags` - Download/comment permissions
- `deletedAt` - Soft delete timestamp

## Upload Size Limits

Managed by `getUploadUrl` action:
- **Audio**: 10MB max (voice recordings)
- **Images**: 5MB max (photos)
- **Videos**: 100MB max (future)

## Usage Examples

### Voice Assistant Audio Upload (New Flow)
```typescript
const audioBase64 = await audioToBase64(audioUri)
if (!audioBase64) {
  // Handle error
}
await ingestVoiceOrText({ 
  audioBase64, 
  userWorkosId: session.user.workosId,
  context: { scopeType: 'classroom', scopeId: classroomId }
})
```

**Benefits**:
- One less round trip (no storage upload)
- No storage deletion step needed
- Simpler flow
- Better privacy (never persisted)

### Camera Image Upload
```typescript
const result = await uploadImage(
  imageUri,
  'image/jpeg',
  'classroom',
  classroomId,
  convex,
  { width: 1920, height: 1080 }
)
if (!result) {
  // Handle error
}
// Use result.mediaAssetId in post creation
```

## Backend Actions

- **`api.actions.storage.getUploadUrl`** - Generate signed upload URL for any file type
- **`api.db.fileAssets.createMediaAssetFromStorage`** - Register uploaded file as media asset

## Future Enhancements

- Image optimization/compression before upload
- Video thumbnail generation
- Batch upload support
- Progress tracking for large files
- CDN integration for faster delivery

