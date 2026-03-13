import "server-only";

/**
 * Storage service module.
 *
 * Manages uploaded file assets stored via UploadThing. Handles
 * recording new uploads, retrieving download URLs, listing assets,
 * and soft-deleting files (both from UploadThing and the database).
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { UTApi } from "uploadthing/server";

/** Discriminator for asset ownership (user vs organization). */
type AssetOwnerType = "user" | "organization";

/** Shape of metadata stored as JSON in the `Asset.metadata` column. */
interface StoredAssetMetadata {
  appUrl?: string;
  fileHash: string;
  ufsUrl: string;
  url?: string;
}

/** Input shape expected from the UploadThing callback. */
interface UploadedAssetInput {
  fileHash: string;
  key: string;
  name: string;
  size: number;
  type: string;
  ufsUrl: string;
}

interface AssetAccessActor {
  id: string;
  role?: string | null;
}

const utapi = new UTApi();

function parseAssetMetadata(metadata: string | null): StoredAssetMetadata | null {
  if (!metadata) return null;

  try {
    return JSON.parse(metadata) as StoredAssetMetadata;
  } catch {
    return null;
  }
}

function getAssetUrlFromMetadata(metadata: string | null): string | null {
  const parsed = parseAssetMetadata(metadata);
  return parsed?.ufsUrl ?? parsed?.url ?? null;
}

async function isSharedProfileAsset(db: PrismaClient, assetId: string): Promise<boolean> {
  const assetPath = `/api/storage/assets/${assetId}`;

  const [userAvatar, orgLogo] = await Promise.all([
    db.user.findFirst({
      where: { image: assetPath },
      select: { id: true },
    }),
    db.organization.findFirst({
      where: { logo: assetPath },
      select: { id: true },
    }),
  ]);

  return Boolean(userAvatar || orgLogo);
}

/**
 * Record a newly uploaded file as an asset in the database.
 */
export async function recordUploadedAsset(
  db: PrismaClient,
  ownerId: string,
  ownerType: AssetOwnerType,
  file: UploadedAssetInput,
  purpose?: string,
) {
  return db.asset.create({
    data: {
      ownerId,
      ownerType,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      storageKey: file.key,
      purpose,
      metadata: JSON.stringify({
        fileHash: file.fileHash,
        ufsUrl: file.ufsUrl,
      } satisfies StoredAssetMetadata),
    },
  });
}

/**
 * Resolve the download URL for an asset, verifying ownership.
 *
 * @throws If the asset doesn't exist, was deleted, or the actor is not the owner.
 */
export async function getAssetDownloadUrl(
  db: PrismaClient,
  assetId: string,
  actor: AssetAccessActor,
): Promise<string> {
  const asset = await db.asset.findUnique({
    where: { id: assetId },
    select: { ownerId: true, metadata: true, deletedAt: true },
  });

  if (!asset || asset.deletedAt) throw new Error("Asset not found");

  const isOwner = asset.ownerId === actor.id;
  const canBypassOwnership = actor.role === "admin";
  const sharedProfileAsset =
    !isOwner && !canBypassOwnership ? await isSharedProfileAsset(db, assetId) : false;

  if (!isOwner && !canBypassOwnership && !sharedProfileAsset) {
    throw new Error("Not authorized");
  }

  const url = getAssetUrlFromMetadata(asset.metadata);
  if (!url) throw new Error("Asset URL missing");

  return url;
}

/**
 * Soft-delete an asset: removes the file from UploadThing and sets
 * `deletedAt` in the database. The row is preserved for audit.
 *
 * @throws If the asset doesn't exist, was already deleted, or the actor is not the owner.
 */
export async function deleteAsset(
  db: PrismaClient,
  assetId: string,
  actorId: string,
): Promise<void> {
  const asset = await db.asset.findUnique({
    where: { id: assetId },
    select: { deletedAt: true, id: true, ownerId: true, storageKey: true },
  });

  if (!asset || asset.deletedAt) throw new Error("Asset not found");
  if (asset.ownerId !== actorId) throw new Error("Not authorized");

  await utapi.deleteFiles(asset.storageKey);

  await db.asset.update({
    where: { id: assetId },
    data: { deletedAt: new Date() },
  });
}

/**
 * List assets for an owner, optionally filtered by purpose.
 * Only returns non-deleted assets, newest first.
 */
export async function getAssets(
  db: PrismaClient,
  ownerId: string,
  purpose?: string,
  ownerType: AssetOwnerType = "user",
) {
  const where: Record<string, unknown> = { ownerId, ownerType, deletedAt: null };
  if (purpose) where.purpose = purpose;

  const assets = await db.asset.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return assets.map((asset) => ({
    ...asset,
    url: getAssetUrlFromMetadata(asset.metadata),
  }));
}
