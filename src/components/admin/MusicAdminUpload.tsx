"use client";

import * as React from "react";
import { Music2Icon } from "lucide-react";
import { AdminUploadEmpty } from "@/components/admin/AdminUploadEmpty";
import { useAdminUploads } from "@/components/admin/AdminUploadProvider";
import {
  saveMusicTrack,
} from "@/lib/admin/actions";
import { uploadPortfolioFile } from "@/lib/admin/portfolio-upload";
import {
  adminUploadLimitError,
  ADMIN_MAX_UPLOAD_LABEL,
  isWithinAdminUploadLimit,
} from "@/lib/admin/upload-limits";

function titleFromFilename(name: string) {
  const base = name.replace(/\.[^.]+$/, "");
  return base
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function MusicAdminUpload() {
  const { addUpload, updateUpload } = useAdminUploads();
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const progressRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const clearProgressTimer = () => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  };

  const uploadFile = async (file: File) => {
    if (!isWithinAdminUploadLimit(file.size)) {
      setMessage(adminUploadLimitError(file.name));
      return;
    }

    const uploadId = crypto.randomUUID();

    addUpload({
      id: uploadId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "audio/mpeg",
      kind: "audio",
      state: "uploading",
      progress: 0,
    });

    setLoading(true);
    setMessage(null);
    clearProgressTimer();

    let progress = 0;
    progressRef.current = setInterval(() => {
      progress = Math.min(92, progress + Math.random() * 14 + 4);
      updateUpload(uploadId, { progress });
    }, 220);

    try {
      const audioUrl = await uploadPortfolioFile(file, "music");

      clearProgressTimer();
      updateUpload(uploadId, { state: "processing", progress: 100 });

      const title = titleFromFilename(file.name);
      await saveMusicTrack({
        title,
        artist: "Joshua",
        audioUrl,
        published: true,
      });

      setMessage(`"${title}" added to the music player.`);

      window.setTimeout(() => {
        updateUpload(uploadId, { state: "done", progress: 100 });
      }, 350);
    } catch (error) {
      clearProgressTimer();
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed. Try again.";
      setMessage(errorMessage);
      updateUpload(uploadId, {
        state: "error",
        progress: 0,
        error: errorMessage,
        onRetry: () => {
          void uploadFile(file);
        },
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    return () => {
      clearProgressTimer();
    };
  }, []);

  return (
    <div className="space-y-4">
      <AdminUploadEmpty
        icon={<Music2Icon />}
        title="No tracks yet"
        description={`Upload audio files for the bottom music player. Title is set from the filename; artist defaults to Joshua. Max file size: ${ADMIN_MAX_UPLOAD_LABEL}.`}
        actionLabel="Upload audio"
        accept="audio/*"
        disabled={loading}
        onFileSelect={(files) => {
          const file = files[0];
          if (file) {
            void uploadFile(file);
          }
        }}
      />
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}
