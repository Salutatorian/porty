"use client";

import {
  CheckIcon,
  FileTextIcon,
  FileWarningIcon,
  Music2Icon,
  RefreshCwIcon,
  XIcon,
} from "lucide-react";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { Spinner } from "@/components/ui/spinner";
import { useAdminUploads, type AdminUploadItem } from "@/components/admin/AdminUploadProvider";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function descriptionFor(item: AdminUploadItem) {
  const isDelete = item.operation === "delete";

  if (isDelete) {
    if (item.state === "processing") {
      return "Deleting photo…";
    }
    if (item.state === "error") {
      return item.error ?? "Delete failed. Try again.";
    }
    if (item.state === "done") {
      return "Deleted";
    }
    return "Ready to delete";
  }

  if (item.state === "idle") {
    return "Ready to upload";
  }
  if (item.state === "uploading") {
    return `Uploading · ${Math.round(item.progress)}%`;
  }
  if (item.state === "processing") {
    return item.kind === "audio" ? "Processing audio" : "Processing…";
  }
  if (item.state === "error") {
    return item.error ?? "Upload failed. Try again.";
  }
  return `Uploaded · ${formatFileSize(item.fileSize)}`;
}

function mediaFor(item: AdminUploadItem) {
  if (item.state === "uploading" || (item.operation === "delete" && item.state === "processing")) {
    return <Spinner />;
  }

  if (item.state === "processing") {
    return item.kind === "audio" ? <Music2Icon /> : <FileTextIcon />;
  }

  if (item.state === "error") {
    return <FileWarningIcon />;
  }

  if (item.state === "done") {
    return <CheckIcon />;
  }

  if (item.kind === "image" && item.previewUrl) {
    return <img src={item.previewUrl} alt="" />;
  }

  if (item.kind === "audio") {
    return <Music2Icon />;
  }

  return <FileTextIcon />;
}

export function AdminUploadAttachmentStack() {
  const { items, removeUpload } = useAdminUploads();

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed top-[4.75rem] right-4 z-[100] flex w-[min(calc(100vw-2rem),20rem)] flex-col gap-2"
      aria-live="polite"
    >
      {items.map((item) => (
        <Attachment
          key={item.id}
          state={item.state}
          className="pointer-events-auto w-full border border-neutral-200 bg-white text-neutral-900 shadow-lg dark:border-neutral-800 dark:bg-[#161616] dark:text-neutral-100"
        >
          <AttachmentMedia
            variant={item.kind === "image" ? "image" : "icon"}
            className="bg-neutral-100 dark:bg-neutral-800"
          >
            {mediaFor(item)}
          </AttachmentMedia>

          <AttachmentContent>
            <AttachmentTitle>{item.fileName}</AttachmentTitle>
            <AttachmentDescription>{descriptionFor(item)}</AttachmentDescription>
          </AttachmentContent>

          <AttachmentActions>
            {item.state === "error" && item.onRetry ? (
              <AttachmentAction
                aria-label={`Retry ${item.operation === "delete" ? "delete" : "upload"} for ${item.fileName}`}
                onClick={item.onRetry}
              >
                <RefreshCwIcon />
              </AttachmentAction>
            ) : null}
            <AttachmentAction
              aria-label={`Remove ${item.fileName}`}
              onClick={() => removeUpload(item.id)}
            >
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      ))}
    </div>
  );
}
