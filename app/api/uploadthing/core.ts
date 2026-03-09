import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
/** UploadThing file routers — userAttachment (8 MB) and userAvatar (2 MB) with auth middleware. */
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { recordUploadedAsset } from "@/server/modules/storage/storage.service";

const f = createUploadthing();

async function requireUser(headers: Headers): Promise<string> {
  const session = await auth.api.getSession({ headers });

  if (!session) {
    throw new UploadThingError("Unauthorized");
  }

  return session.user.id;
}

export const uploadRouter = {
  userAttachment: f(
    {
      blob: {
        maxFileCount: 1,
        maxFileSize: "8MB",
      },
    },
    {
      awaitServerData: true,
    },
  )
    .middleware(async ({ req }) => {
      return {
        purpose: "attachment" as const,
        userId: await requireUser(req.headers),
      };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      const asset = await recordUploadedAsset(
        prisma,
        metadata.userId,
        "user",
        {
          fileHash: file.fileHash,
          key: file.key,
          name: file.name,
          size: file.size,
          type: file.type,
          ufsUrl: file.ufsUrl,
        },
        metadata.purpose,
      );

      return { assetId: asset.id };
    }),

  userAvatar: f(
    {
      image: {
        maxFileCount: 1,
        maxFileSize: "2MB",
      },
    },
    {
      awaitServerData: true,
    },
  )
    .middleware(async ({ req }) => {
      return {
        purpose: "avatar" as const,
        userId: await requireUser(req.headers),
      };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      const asset = await recordUploadedAsset(
        prisma,
        metadata.userId,
        "user",
        {
          fileHash: file.fileHash,
          key: file.key,
          name: file.name,
          size: file.size,
          type: file.type,
          ufsUrl: file.ufsUrl,
        },
        metadata.purpose,
      );

      return { assetId: asset.id };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
