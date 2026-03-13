import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { isUploadsEnabled } from "@/lib/features";
import { router, protectedProcedure } from "@/server/api/trpc";
import {
  deleteAsset,
  getAssets,
} from "@/server/modules/storage/storage.service";

/**
 * Guard: throws PRECONDITION_FAILED when uploads are not configured.
 */
function requireUploads() {
  if (!isUploadsEnabled()) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Uploads are not enabled for this deployment",
    });
  }
}

/**
 * Storage router — asset listing and deletion for authenticated users.
 *
 * Upload creation is handled by the UploadThing endpoint at
 * `/api/uploadthing`. This router exposes the read/delete side.
 */
export const storageRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          purpose: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      requireUploads();
      return getAssets(ctx.db, ctx.session.user.id, input?.purpose, "user");
    }),

  delete: protectedProcedure
    .input(z.object({ assetId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireUploads();
      await deleteAsset(ctx.db, input.assetId, ctx.session.user.id);
      return { success: true };
    }),
});
