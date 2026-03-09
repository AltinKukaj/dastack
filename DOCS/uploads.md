# Uploads and Storage

Uploads are **optional** and only active when `UPLOADTHING_TOKEN` is set.

The app uses:

- UploadThing for file transfer and storage
- Prisma `Asset` records for metadata
- an auth-gated download proxy at `/api/storage/assets/[assetId]`

## Main files

| File | Responsibility |
| --- | --- |
| `app/api/uploadthing/core.ts` | upload router definitions and auth middleware |
| `app/api/uploadthing/route.ts` | UploadThing route handler |
| `lib/uploadthing.ts` | client uploader helper |
| `server/modules/storage/storage.service.ts` | record, list, delete, and authorize asset access |
| `server/api/routers/storage.ts` | authenticated list/delete tRPC routes |
| `app/api/storage/assets/[assetId]/route.ts` | redirects authorized users to the stored file URL |

## Upload routes

Two UploadThing routes are defined today:

- `userAttachment`
  - accepts `blob`
  - max file size `8MB`
  - purpose `attachment`
- `userAvatar`
  - accepts `image`
  - max file size `2MB`
  - purpose `avatar`

Both require an authenticated session.

## How the flow works

1. A signed-in user uploads through UploadThing.
2. The UploadThing middleware resolves the current user from the Better Auth session.
3. `onUploadComplete` writes an `Asset` row to the database.
4. The UI later lists assets through the storage tRPC router.
5. Downloads go through `/api/storage/assets/[assetId]`, which re-checks authorization before redirecting to the real file URL.

## Asset model

The `Asset` table stores:

- owner ID
- owner type
- file name
- file type
- file size
- UploadThing storage key
- optional purpose
- JSON metadata
- soft-delete timestamp

Deletes are soft in the database and hard on UploadThing itself.

## Authorization rules

`getAssetDownloadUrl(...)` allows access when:

- the signed-in user owns the asset
- the signed-in user is an admin
- the asset is being used as a shared profile image or org logo

Everything else is rejected.

## UI behavior

When uploads are disabled:

- `/dashboard/files` returns `404`
- `/dashboard/settings/files` returns `404`
- the Files settings tab is hidden

That makes uploads easy to keep out of a simpler template deployment.

## How to extend it

If you want more upload types:

1. add another UploadThing route in `app/api/uploadthing/core.ts`
2. store a clear `purpose`
3. expose it from the UI through `lib/uploadthing.ts`
4. decide whether it should appear in the existing storage list or a new page

If you want organization-owned files, the database and storage service already understand `ownerType = "organization"`, but the current UI only exposes user-owned uploads.
