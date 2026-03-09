"use client";

import { useState, useMemo, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Upload, ExternalLink, Search, X } from "lucide-react";
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
type FileFilter = "all" | "image" | "document" | "other";

function getFileCategory(fileType: string): FileFilter {
  if (fileType.startsWith("image/")) return "image";
  if (
    fileType.includes("pdf") ||
    fileType.includes("document") ||
    fileType.includes("text/") ||
    fileType.includes("sheet") ||
    fileType.includes("presentation")
  ) return "document";
  return "other";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilesClient() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { refetch: refetchSession } = useSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [purpose, setPurpose] = useState<UploadPurpose>("attachment");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FileFilter>("all");
  const [dragOver, setDragOver] = useState(false);

  const assetsQuery = useQuery(trpc.storage.list.queryOptions());
  const deleteMutation = useMutation(trpc.storage.delete.mutationOptions());
  const assets = (assetsQuery.data as AssetRecord[] | undefined) ?? [];

  const filteredAssets = useMemo(() => {
    let result = assets;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.fileName.toLowerCase().includes(q) ||
          a.fileType.toLowerCase().includes(q),
      );
    }

    if (filter !== "all") {
      result = result.filter((a) => getFileCategory(a.fileType) === filter);
    }

    return result;
  }, [assets, search, filter]);

  const refreshAssets = async () => {
    await Promise.all([
      assetsQuery.refetch(),
      queryClient.invalidateQueries({ queryKey: [["storage"]] }),
    ]);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] ?? null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
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

      if (!uploaded) throw new Error("Upload did not return a file.");

      const assetId = uploaded.serverData?.assetId;
      if (!assetId) throw new Error("Upload finished without an asset record.");

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

  const filters: { value: FileFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "image", label: "Images" },
    { value: "document", label: "Documents" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <p className="section-label">Files</p>
        <h1 className="mt-1 heading-page">File manager</h1>
      </div>

      {notice && <Banner tone="success">{notice}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}

      {/* Upload area */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="heading-section">Upload</h2>
        </div>
        <div className="panel-body space-y-4">
          <div
            className={`rounded-md border-2 border-dashed p-6 text-center transition-colors ${dragOver
              ? "border-white/[0.2] bg-white/[0.04]"
              : selectedFile
                ? "border-white/[0.15] bg-white/[0.03]"
                : "border-white/[0.08] hover:border-white/[0.14]"
              }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-2">
                <p className="text-[13px] text-white">{selectedFile.name}</p>
                <p className="text-[11px] text-zinc-500">{formatFileSize(selectedFile.size)}</p>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-[12px] text-zinc-500 hover:text-white transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="mx-auto size-5 text-zinc-600" />
                <p className="text-[13px] text-zinc-400">
                  Drop a file here or{" "}
                  <label className="text-zinc-300 hover:text-white transition-colors cursor-pointer">
                    browse
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </p>
                <p className="text-[11px] text-zinc-600">Up to 8 MB. Avatar images stay under 2 MB.</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 space-y-1.5">
              <span className="block text-[12px] text-zinc-500">Purpose</span>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as UploadPurpose)}
                className="w-full rounded-md border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none"
              >
                <option value="attachment">Attachment</option>
                <option value="avatar">Avatar</option>
              </select>
            </label>
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
              Upload
            </Button>
          </div>
        </div>
      </div>

      {/* Files list */}
      <div className="panel">
        <div className="panel-header space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="heading-section">
              Files
              {assets.length > 0 && (
                <span className="ml-2 text-[11px] font-normal text-zinc-500">
                  {filteredAssets.length}{filteredAssets.length !== assets.length && ` / ${assets.length}`}
                </span>
              )}
            </h2>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-600" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search files..."
                className="w-full sm:w-52 rounded-md border border-white/[0.06] bg-white/[0.02] py-1.5 pl-8 pr-8 text-[12px] text-white placeholder:text-zinc-600 outline-none transition-colors focus:border-white/25"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1">
            {filters.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors duration-150 ${filter === f.value
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-500 hover:text-zinc-300"
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {asset.fileType.startsWith("image/") && (
                    <div className="size-8 shrink-0 rounded border border-white/[0.06] overflow-hidden bg-white/[0.02]">
                      <img
                        src={`/api/storage/assets/${asset.id}`}
                        alt=""
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-white">{asset.fileName}</p>
                    <p className="text-[11px] text-zinc-600">
                      {formatFileSize(asset.fileSize)} · {formatDate(asset.createdAt)}
                      {asset.purpose && (
                        <span className="ml-1.5 text-zinc-500">{asset.purpose}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    window.open(`/api/storage/assets/${asset.id}`, "_blank", "noopener,noreferrer")
                  }
                  className="rounded-md border border-white/[0.06] p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-white"
                  title="Open"
                >
                  <ExternalLink className="size-3.5" />
                </button>
                {asset.fileType.startsWith("image/") && (
                  <button
                    type="button"
                    onClick={() => void handleUseAsAvatar(asset.id)}
                    disabled={busyKey === `avatar-${asset.id}`}
                    className="rounded-md border border-white/[0.06] px-2.5 py-1.5 text-[11px] text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
                  >
                    {busyKey === `avatar-${asset.id}` ? "Saving..." : "Use as avatar"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleDelete(asset)}
                  disabled={busyKey === `delete-${asset.id}`}
                  className="rounded-md border border-white/[0.06] p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
                  title="Delete"
                >
                  {busyKey === `delete-${asset.id}` ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}

          {!assetsQuery.isPending && filteredAssets.length === 0 && (
            <div className="px-5 py-10 text-center">
              {assets.length === 0 ? (
                <p className="text-[13px] text-zinc-500">No files uploaded yet.</p>
              ) : (
                <div>
                  <p className="text-[13px] text-zinc-500">No files match your search.</p>
                  <button
                    type="button"
                    onClick={() => { setSearch(""); setFilter("all"); }}
                    className="mt-2 text-[12px] text-zinc-600 hover:text-white transition-colors"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          )}

          {assetsQuery.isPending && (
            <div className="px-5 py-10 text-center text-[13px] text-zinc-500">
              Loading files...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
