/** Asset download proxy — auth-gated redirect to the file's download URL. */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getAssetDownloadUrl } from "@/server/modules/storage/storage.service";

export async function GET(
  request: Request,
  context: { params: Promise<{ assetId: string }> },
) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { assetId } = await context.params;

  try {
    const downloadUrl = await getAssetDownloadUrl(prisma, assetId, {
      id: session.user.id,
      role: (session.user as { role?: string | null }).role ?? null,
    });
    return NextResponse.redirect(downloadUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Asset not found";
    const status =
      message === "Not authorized"
        ? 403
        : message === "Asset not found"
          ? 404
          : message === "Asset URL missing"
            ? 500
            : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
