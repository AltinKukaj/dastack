import { notFound } from "next/navigation";
import { isUploadsEnabled } from "@/lib/features";
import FilesClient from "./files-client";

export default function FilesPage() {
  if (!isUploadsEnabled()) {
    notFound();
  }

  return <FilesClient />;
}
