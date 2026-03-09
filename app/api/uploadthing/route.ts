/** UploadThing route handler — exposes GET and POST endpoints for file uploads. */
import { createRouteHandler } from "uploadthing/next";
import { uploadRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
});
