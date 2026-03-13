/** Files client — upload, list, delete, and use-as-avatar for managed file assets. */
"use client";

import { useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, Trash2, Upload } from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";
import { uploadFiles } from "@/lib/uploadthing";
import { useTRPC } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Banner,
  extractError,
  formatDate,
  formatError,
} from "@/app/dashboard/_lib/settings-helpers";

interface AssetRecord {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  purpose: string | null;
  createdAt: string | Date;
  deletedAt: string | Date | null;
}

type UploadPurpose = "attachment" | "avatar";

export default function FilesClientPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { refetch: refetchSession } = useSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [purpose, setPurpose] = useState<UploadPurpose>("attachment");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const assetsQuery = useQuery(trpc.storage.list.queryOptions());
  const deleteMutation = useMutation(trpc.storage.delete.mutationOptions());
  const assets = (assetsQuery.data as AssetRecord[] | undefined) ?? [];

  const refreshAssets = async () => {
    await Promise.all([
      assetsQuery.refetch(),
      queryClient.invalidateQueries({ queryKey: [["storage"]] }),
    ]);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] ?? null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setBusyKey("upload");
    setError("");
    setNotice("");

    try {
      const [uploaded] = await uploadFiles(
        purpose === "avatar" ? "userAvatar" : "userAttachment",
        { files: [selectedFile] },
      );

      if (!uploaded) {
        throw new Error("Upload did not return a file.");
      }

      const assetId = uploaded.serverData?.assetId;
      if (!assetId) {
        throw new Error("Upload finished without an asset record.");
      }

      if (purpose === "avatar") {
        const result = await authClient.updateUser({
          image: `/api/storage/assets/${assetId}`,
        });

        if (extractError(result)) {
          setError(formatError(result, "Upload succeeded but avatar update failed."));
        } else {
          await refetchSession();
        }
      }

      setSelectedFile(null);
      setNotice(
        purpose === "avatar"
          ? "Avatar uploaded and linked to your profile."
          : "File uploaded successfully.",
      );
      await refreshAssets();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload the selected file.",
      );
    } finally {
      setBusyKey(null);
    }
  };

  const handleDelete = async (asset: AssetRecord) => {
    if (!confirm(`Delete ${asset.fileName}?`)) return;

    setBusyKey(`delete-${asset.id}`);
    setError("");
    setNotice("");

    try {
      await deleteMutation.mutateAsync({ assetId: asset.id });

      setNotice("File removed.");
      await refreshAssets();
    } catch {
      setError("Could not delete that file.");
    } finally {
      setBusyKey(null);
    }
  };

  const handleUseAsAvatar = async (assetId: string) => {
    setBusyKey(`avatar-${assetId}`);
    setError("");
    setNotice("");

    try {
      const result = await authClient.updateUser({
        image: `/api/storage/assets/${assetId}`,
      });
      if (extractError(result)) {
        setError(formatError(result, "Could not update your profile image."));
        return;
      }
      await refetchSession();
      setNotice("Profile image updated.");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      {notice && <Banner tone="success">{notice}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}

      <div className="panel">
        <div className="panel-header">
          <h2 className="heading-section">Upload files</h2>
          <p className="mt-0.5 text-[12px] text-zinc-500">
            Upload attachments or replace your profile image with a managed asset.
          </p>
        </div>
        <div className="panel-body space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
            <label className="rounded-md border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[13px] text-zinc-400">
              <span className="block text-white">Choose file</span>
              <span className="mt-1 block text-[12px] text-zinc-500">
                {selectedFile
                  ? `${selectedFile.name} (${Math.ceil(selectedFile.size / 1024)} KB)`
                  : "Up to 8 MB. Avatar images stay under 2 MB."}
              </span>
              <input
                type="file"
                onChange={handleFileChange}
                className="mt-3 block w-full text-[12px]"
              />
            </label>

            <label className="space-y-2">
              <span className="block text-[12px] text-zinc-400">Purpose</span>
              <select
                value={purpose}
                onChange={(event) => setPurpose(event.target.value as UploadPurpose)}
                className="w-full rounded-md border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none"
              >
                <option value="attachment">Attachment</option>
                <option value="avatar">Avatar</option>
              </select>
            </label>
          </div>

          <Button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || busyKey === "upload"}
            className="h-9 text-[13px]"
          >
            {busyKey === "upload" ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Upload className="mr-2 size-4" />
            )}
            Upload file
          </Button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2 className="heading-section">Stored assets</h2>
          <p className="mt-0.5 text-[12px] text-zinc-500">
            Managed files are owned by your account and served through the app.
          </p>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-white">{asset.fileName}</p>
                <p className="mt-0.5 text-[11px] text-zinc-600">
                  {asset.fileType} - {Math.ceil(asset.fileSize / 1024)} KB - uploaded{" "}
                  {formatDate(asset.createdAt)}
                </p>
                {asset.purpose && (
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {asset.purpose}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    window.open(`/api/storage/assets/${asset.id}`, "_blank", "noopener,noreferrer")
                  }
                  className="flex items-center gap-1 rounded-md border border-white/[0.06] px-3 py-1.5 text-[12px] text-zinc-400 transition-colors hover:bg-white/[0.03] hover:text-white"
                >
                  <ExternalLink className="size-3.5" />
                  Open
                </button>
                {asset.fileType.startsWith("image/") && (
                  <button
                    type="button"
                    onClick={() => void handleUseAsAvatar(asset.id)}
                    disabled={busyKey === `avatar-${asset.id}`}
                    className="rounded-md border border-white/[0.06] px-3 py-1.5 text-[12px] text-zinc-400 transition-colors hover:bg-white/[0.03] hover:text-white disabled:opacity-50"
                  >
                    {busyKey === `avatar-${asset.id}` ? "Saving..." : "Use as avatar"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleDelete(asset)}
                  disabled={busyKey === `delete-${asset.id}`}
                  className="flex items-center gap-1 rounded-md border border-white/[0.06] px-3 py-1.5 text-[12px] text-zinc-400 transition-colors hover:bg-white/[0.03] hover:text-white disabled:opacity-50"
                >
                  {busyKey === `delete-${asset.id}` ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          ))}

          {!assetsQuery.isPending && assets.length === 0 && (
            <div className="px-5 py-8 text-center text-[13px] text-zinc-500">
              No stored assets yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
