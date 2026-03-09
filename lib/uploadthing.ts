/**
 * Client-side UploadThing file uploader.
 *
 * Pre-configured with the app's `UploadRouter` type for end-to-end
 * type safety. Only active when `UPLOADTHING_TOKEN` is set.
 *
 * @module
 */
"use client";

import { genUploader } from "uploadthing/client";
import type { UploadRouter } from "@/app/api/uploadthing/core";

export const { uploadFiles } = genUploader<UploadRouter>({
  package: "@uploadthing/react",
});
