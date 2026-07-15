"use client";

import * as React from "react";
import { ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  deletePhoto,
  importLegacyPhotos,
  savePhoto,
  type PhotoDraft,
} from "@/lib/admin/actions";
import { uploadPortfolioFile, discardPhotoUpload } from "@/lib/admin/portfolio-upload";
import { slugify } from "@/lib/slugify";
import {
  adminUploadLimitError,
  ADMIN_MAX_UPLOAD_LABEL,
  isWithinAdminUploadLimit,
} from "@/lib/admin/upload-limits";
import type { PhotoItem } from "@/lib/media-items";
import { AdminUploadEmpty } from "@/components/admin/AdminUploadEmpty";
import { useAdminConfirmDelete } from "@/components/admin/AdminConfirmDeleteDialog";
import { useAdminUploads } from "@/components/admin/AdminUploadProvider";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { cn } from "@/lib/utils";

const emptyDraft: PhotoDraft = {
  id: "",
  title: "",
  location: "",
  year: String(new Date().getFullYear()),
  imageUrl: "",
  published: true,
};

type PhotoAdminFormProps = {
  photos: PhotoItem[];
};

function photoToDraft(photo: PhotoItem): PhotoDraft {
  return {
    id: photo.id,
    title: photo.title,
    location: photo.location,
    year: photo.year,
    imageUrl: photo.image,
    dateTaken: photo.dateTaken,
    locationDetail: photo.locationDetail,
    description: photo.description,
    collection: photo.collection,
    published: true,
  };
}

export function PhotoAdminForm({ photos }: PhotoAdminFormProps) {
  const router = useRouter();
  const { requestDelete, dialog } = useAdminConfirmDelete();
  const [photoList, setPhotoList] = React.useState(photos);
  const { addUpload, updateUpload, removeUpload } = useAdminUploads();
  const [draft, setDraft] = React.useState<PhotoDraft>(emptyDraft);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [importing, setImporting] = React.useState(false);
  const progressRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingUploadRef = React.useRef<{ publicUrl: string; storagePath: string } | null>(
    null,
  );

  React.useEffect(() => {
    setPhotoList(photos);
  }, [photos]);

  const clearPendingUpload = React.useCallback(async () => {
    const pending = pendingUploadRef.current;
    pendingUploadRef.current = null;
    if (!pending) return;

    try {
      await discardPhotoUpload(pending.storagePath);
    } catch {
      // Best-effort cleanup for abandoned uploads.
    }
  }, []);

  const update = (patch: Partial<PhotoDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const clearProgressTimer = () => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  };

  const startNewPhoto = () => {
    void clearPendingUpload();
    setSelectedId(null);
    setDraft(emptyDraft);
    setMessage(null);
  };

  const selectPhoto = (photo: PhotoItem) => {
    void clearPendingUpload();
    setSelectedId(photo.id);
    setDraft(photoToDraft(photo));
    setMessage(null);
  };

  const uploadFile = async (file: File) => {
    if (!isWithinAdminUploadLimit(file.size)) {
      setMessage(adminUploadLimitError(file.name));
      return;
    }

    const uploadId = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(file);

    addUpload({
      id: uploadId,
      fileName: file.name,
      previewUrl,
      fileSize: file.size,
      mimeType: file.type || "image/jpeg",
      kind: "image",
      state: "uploading",
      progress: 0,
    });

    setLoading(true);
    setMessage(null);
    clearProgressTimer();
    setSelectedId(null);

    let progress = 0;
    progressRef.current = setInterval(() => {
      progress = Math.min(92, progress + Math.random() * 14 + 4);
      updateUpload(uploadId, { progress });
    }, 220);

    try {
      await clearPendingUpload();

      const { publicUrl, storagePath } = await uploadPortfolioFile(file, "photos");
      pendingUploadRef.current = { publicUrl, storagePath };

      clearProgressTimer();
      updateUpload(uploadId, { state: "processing", progress: 100 });

      setDraft({ ...emptyDraft, imageUrl: publicUrl });
      setMessage("Photo uploaded. Add a title and description, then save.");

      window.setTimeout(() => {
        updateUpload(uploadId, { state: "done", progress: 100 });
      }, 350);
    } catch (error) {
      clearProgressTimer();
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      updateUpload(uploadId, {
        state: "error",
        progress: 0,
        error: errorMessage,
        onRetry: () => {
          removeUpload(uploadId);
          void uploadFile(file);
        },
      });
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    return () => {
      clearProgressTimer();
      void clearPendingUpload();
    };
  }, [clearPendingUpload]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const savedId = draft.id || slugify(draft.title);
      await savePhoto({
        ...draft,
        id: savedId,
      });
      pendingUploadRef.current = null;
      setSelectedId(savedId);
      setMessage("Photo saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const performDeletePhoto = async (photoId?: string) => {
    const id = photoId ?? selectedId;
    if (!id) return;

    const photo = photos.find((item) => item.id === id);
    const label = photo?.title?.trim() || "this photo";

    const attachmentId = crypto.randomUUID();

    addUpload({
      id: attachmentId,
      fileName: label,
      previewUrl: photo?.image,
      fileSize: 0,
      mimeType: "image/jpeg",
      kind: "image",
      operation: "delete",
      state: "processing",
      progress: 100,
    });

    setLoading(true);
    setMessage(null);

    try {
      if (selectedId === id) {
        await clearPendingUpload();
      }
      await deletePhoto(id, photo?.image);
      setPhotoList((current) => current.filter((item) => item.id !== id));
      updateUpload(attachmentId, { state: "done" });
      if (selectedId === id) {
        setSelectedId(null);
        setDraft(emptyDraft);
      }
      router.refresh();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Delete failed";
      updateUpload(attachmentId, {
        state: "error",
        error: errorMessage,
        onRetry: () => {
          removeUpload(attachmentId);
          void onDeletePhoto(id);
        },
      });
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onDeletePhoto = (photoId?: string) => {
    const id = photoId ?? selectedId;
    if (!id) return;

    const photo = photos.find((item) => item.id === id);
    const label = photo?.title?.trim() || "this photo";

    requestDelete({
      title: "Delete photo?",
      itemName: label,
      hasAttachments: Boolean(photo?.image),
      attachmentLabel: "photo file",
      description: `This will permanently delete "${label}", remove it from the database, and delete the image from storage.`,
      onConfirm: () => performDeletePhoto(id),
    });
  };

  const fieldClass =
    "mt-1 w-full rounded-lg border border-foreground/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/25";

  return (
    <>
      {dialog}
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div>
        {!draft.imageUrl ? (
          <AdminUploadEmpty
            icon={<ImageIcon />}
            title="No photo selected"
            description={`Upload an image to add it to your public gallery. You can set title, location, date, and description after. Max file size: ${ADMIN_MAX_UPLOAD_LABEL}.`}
            actionLabel="Upload photo"
            accept="image/*"
            disabled={loading}
            onFileSelect={(files) => {
              const file = files[0];
              if (file) {
                void uploadFile(file);
              }
            }}
          />
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          {draft.imageUrl ? (
            <>
              <img
                src={draft.imageUrl}
                alt="Preview"
                className="h-40 w-auto rounded-lg border border-foreground/10 object-cover"
              />

              <label className="block text-[12px] text-foreground/50">
                Title
                <input
                  className={fieldClass}
                  value={draft.title}
                  onChange={(event) => update({ title: event.target.value })}
                  required
                />
              </label>
              <label className="block text-[12px] text-foreground/50">
                Description
                <textarea
                  className={`${fieldClass} min-h-[120px] resize-y`}
                  value={draft.description ?? ""}
                  placeholder="What was happening in this photo?"
                  onChange={(event) =>
                    update({ description: event.target.value })
                  }
                />
              </label>
              <label className="block text-[12px] text-foreground/50">
                Location
                <input
                  className={fieldClass}
                  value={draft.location}
                  onChange={(event) => update({ location: event.target.value })}
                />
              </label>
              <label className="block text-[12px] text-foreground/50">
                Year
                <input
                  className={fieldClass}
                  value={draft.year}
                  onChange={(event) => update({ year: event.target.value })}
                />
              </label>
              <DatePickerInput
                id="admin-photo-date"
                label="Date taken"
                value={draft.dateTaken ?? ""}
                placeholder="June 01, 2025"
                onChange={(value, date) => {
                  update({
                    dateTaken: value,
                    year: date ? String(date.getFullYear()) : draft.year,
                  });
                }}
              />
              <label className="block text-[12px] text-foreground/50">
                Location detail
                <textarea
                  className={`${fieldClass} min-h-[56px]`}
                  value={draft.locationDetail ?? ""}
                  onChange={(event) =>
                    update({ locationDetail: event.target.value })
                  }
                />
              </label>
              <label className="block text-[12px] text-foreground/50">
                Collection
                <input
                  className={fieldClass}
                  value={draft.collection ?? ""}
                  onChange={(event) =>
                    update({ collection: event.target.value })
                  }
                />
              </label>

              <ButtonGroup>
                <Button type="submit" disabled={loading || !draft.imageUrl}>
                  Save photo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={startNewPhoto}
                >
                  Upload another
                </Button>
                {selectedId ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      void onDeletePhoto();
                    }}
                  >
                    Delete photo
                  </Button>
                ) : null}
              </ButtonGroup>

              {message ? (
                <p className="text-[13px] text-foreground/55">{message}</p>
              ) : null}
            </>
          ) : null}
        </form>
      </div>

      <aside className="rounded-[12px] border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#161616]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[12px] font-medium tracking-wide text-neutral-500 uppercase">
            Saved photos
          </h2>
          {photos.length > 0 ? (
            <button
              type="button"
              onClick={startNewPhoto}
              className="text-[11px] text-neutral-500 underline-offset-2 hover:underline"
            >
              New
            </button>
          ) : null}
        </div>

        {photos.length === 0 ? (
          <p className="mt-3 text-[12px] text-neutral-500">
            Saved photos and their descriptions will appear here.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {photoList.map((photo) => (
              <li key={photo.id}>
                <div
                  className={cn(
                    "flex items-start gap-2 rounded-lg border px-2 py-2 transition-colors",
                    selectedId === photo.id
                      ? "border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900"
                      : "border-transparent hover:border-neutral-200 hover:bg-neutral-50 dark:hover:border-neutral-800 dark:hover:bg-neutral-900/60",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => selectPhoto(photo)}
                    className="min-w-0 flex-1 px-1 py-0.5 text-left"
                  >
                    <p className="truncate text-[12px] font-medium text-neutral-800 dark:text-neutral-200">
                      {photo.title || "Untitled"}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-neutral-500">
                      {photo.description?.trim() || "No description yet"}
                    </p>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${photo.title || "photo"}`}
                    disabled={loading}
                    onClick={() => {
                      void onDeletePhoto(photo.id);
                    }}
                    className="shrink-0 rounded-md px-2 py-1 text-[11px] text-neutral-400 hover:bg-neutral-100 hover:text-destructive dark:hover:bg-neutral-800"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <p className="text-[11px] leading-relaxed text-neutral-500">
            Includes R2 legacy photos and Supabase uploads — same set as the
            public gallery. Import copies legacy photos into Supabase for editing.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            disabled={importing || loading}
            onClick={() => {
              setImporting(true);
              setMessage(null);
              void importLegacyPhotos()
                .then((result) => {
                  setMessage(`Imported ${result.imported} photos from legacy storage.`);
                  router.refresh();
                })
                .catch((error) => {
                  setMessage(
                    error instanceof Error
                      ? error.message
                      : "Legacy import failed.",
                  );
                })
                .finally(() => {
                  setImporting(false);
                });
            }}
          >
            {importing ? "Importing…" : "Import legacy photos"}
          </Button>
        </div>
      </aside>
    </div>
    </>
  );
}
