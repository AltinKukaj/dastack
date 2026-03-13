/** Files settings gate — renders the files client when uploads are enabled, otherwise 404. */
import { notFound } from "next/navigation";
import { isUploadsEnabled } from "@/lib/features";
import FilesClientPage from "./files-client";

export default function FilesPage() {
  if (!isUploadsEnabled()) {
    notFound();
  }

  return <FilesClientPage />;
}
