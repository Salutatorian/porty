"use client";

import * as React from "react";
import { Music2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  deleteMusicTrack,
  saveMusicTrack,
  type MusicTrackDraft,
} from "@/lib/admin/actions";
import { uploadPortfolioFile, saveMusicTrackViaApi } from "@/lib/admin/portfolio-upload";
import type { AdminMusicTrack } from "@/lib/content/music";
import { AdminUploadEmpty } from "@/components/admin/AdminUploadEmpty";
import { useAdminUploads } from "@/components/admin/AdminUploadProvider";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  adminUploadLimitError,
  ADMIN_MAX_UPLOAD_LABEL,
  isWithinAdminUploadLimit,
} from "@/lib/admin/upload-limits";
import { cn } from "@/lib/utils";

function titleFromFilename(name: string) {
  const base = name.replace(/\.[^.]+$/, "");
  return base
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const emptyDraft: MusicTrackDraft = {
  id: "",
  title: "",
  artist: "",
  audioUrl: "",
  coverUrl: "",
  published: true,
};

type MusicAdminFormProps = {
  tracks: AdminMusicTrack[];
};

function trackToDraft(track: AdminMusicTrack): MusicTrackDraft {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    audioUrl: track.audioUrl,
    coverUrl: track.coverUrl ?? "",
    sortOrder: track.sortOrder,
    published: track.published,
  };
}

export function MusicAdminForm({ tracks }: MusicAdminFormProps) {
  const router = useRouter();
  const { addUpload, updateUpload } = useAdminUploads();
  const [draft, setDraft] = React.useState<MusicTrackDraft>(emptyDraft);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const progressRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const clearProgressTimer = () => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  };

  const update = (patch: Partial<MusicTrackDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const selectTrack = (track: AdminMusicTrack) => {
    setSelectedId(track.id);
    setDraft(trackToDraft(track));
    setMessage(null);
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
      const { publicUrl: audioUrl } = await uploadPortfolioFile(file, "music");

      clearProgressTimer();
      updateUpload(uploadId, { state: "processing", progress: 100 });

      const title = titleFromFilename(file.name);
      const result = await saveMusicTrackViaApi({
        title,
        artist: "",
        audioUrl,
        published: true,
      });

      setSelectedId(result.id);
      setDraft({
        id: result.id,
        title: result.title,
        artist: "",
        audioUrl,
        coverUrl: "",
        published: true,
      });
      setMessage(`"${title}" uploaded. Set the artist name and save.`);

      window.setTimeout(() => {
        updateUpload(uploadId, { state: "done", progress: 100 });
      }, 350);

      router.refresh();
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

  const uploadCover = async (file: File) => {
    if (!isWithinAdminUploadLimit(file.size)) {
      setMessage(adminUploadLimitError(file.name));
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { publicUrl } = await uploadPortfolioFile(file, "photos");
      update({ coverUrl: publicUrl });
      setMessage("Cover art uploaded. Save track to apply.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Cover upload failed");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.id || !draft.audioUrl) return;

    setLoading(true);
    setMessage(null);

    try {
      await saveMusicTrack({
        ...draft,
        title: draft.title.trim(),
        artist: draft.artist.trim(),
        coverUrl: draft.coverUrl?.trim() || undefined,
      });
      setMessage("Track saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const onDeleteTrack = async (trackId?: string) => {
    const id = trackId ?? selectedId;
    if (!id) return;

    const track = tracks.find((item) => item.id === id);
    const label = track?.title?.trim() || "this track";

    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (track?.isLegacy) {
        await saveMusicTrack({
          ...trackToDraft(track),
          published: false,
        });
      } else {
        await deleteMusicTrack(id);
      }
      if (selectedId === id) {
        setSelectedId(null);
        setDraft(emptyDraft);
      }
      setMessage("Track deleted.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    return () => {
      clearProgressTimer();
    };
  }, []);

  const fieldClass =
    "mt-1 w-full rounded-lg border border-foreground/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/25";

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div>
        {!selectedId ? (
          <AdminUploadEmpty
            icon={<Music2Icon />}
            title="Upload a track"
            description={`Add audio to the bottom music player. The title starts from the filename — set the artist after upload. Max file size: ${ADMIN_MAX_UPLOAD_LABEL}.`}
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
        ) : null}

        {selectedId && draft.audioUrl ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <audio
              controls
              src={draft.audioUrl}
              className="w-full max-w-md"
              preload="metadata"
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
              Artist
              <input
                className={fieldClass}
                value={draft.artist}
                onChange={(event) => update({ artist: event.target.value })}
                placeholder="Who performed or produced this track?"
              />
            </label>

            <div className="space-y-2">
              <p className="text-[12px] text-foreground/50">Cover art</p>
              <div className="flex items-center gap-3">
                {draft.coverUrl ? (
                  <img
                    src={draft.coverUrl}
                    alt=""
                    className="size-16 rounded-lg border border-foreground/10 object-cover"
                  />
                ) : (
                  <div className="flex size-16 items-center justify-center rounded-lg border border-dashed border-foreground/15 bg-foreground/[0.03] text-foreground/30">
                    <Music2Icon className="size-5" />
                  </div>
                )}
                <label className="inline-flex">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={loading}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadCover(file);
                      event.currentTarget.value = "";
                    }}
                  />
                  <span className="cursor-pointer rounded-lg border border-foreground/10 px-3 py-2 text-[12px] text-foreground/70 hover:bg-foreground/[0.03]">
                    {draft.coverUrl ? "Replace cover" : "Upload cover"}
                  </span>
                </label>
                {draft.coverUrl ? (
                  <button
                    type="button"
                    className="text-[12px] text-foreground/45 underline-offset-2 hover:underline"
                    onClick={() => update({ coverUrl: "" })}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <p className="text-[11px] text-foreground/40">
                Shown in the music player when you hover, Spotify-style.
              </p>
            </div>

            <ButtonGroup>
              <Button type="submit" disabled={loading || !draft.title.trim()}>
                Save track
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "audio/*";
                  input.onchange = () => {
                    const file = input.files?.[0];
                    if (file) void uploadFile(file);
                  };
                  input.click();
                }}
              >
                Upload another
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  void onDeleteTrack();
                }}
              >
                Delete track
              </Button>
            </ButtonGroup>

            {message ? (
              <p className="text-[13px] text-foreground/55">{message}</p>
            ) : null}
          </form>
        ) : null}

        {!selectedId && message ? (
          <p className="mt-4 text-[13px] text-foreground/55">{message}</p>
        ) : null}
      </div>

      <aside className="rounded-[12px] border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#161616]">
        <h2 className="text-[12px] font-medium tracking-wide text-neutral-500 uppercase">
          Saved tracks
        </h2>

        {tracks.length === 0 ? (
          <p className="mt-3 text-[12px] text-neutral-500">
            Uploaded tracks will appear here for editing.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {tracks.map((track) => (
              <li key={track.id}>
                <div
                  className={cn(
                    "flex items-start gap-2 rounded-lg border px-2 py-2 transition-colors",
                    selectedId === track.id
                      ? "border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900"
                      : "border-transparent hover:border-neutral-200 hover:bg-neutral-50 dark:hover:border-neutral-800 dark:hover:bg-neutral-900/60",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => selectTrack(track)}
                    className="flex min-w-0 flex-1 items-center gap-2 px-1 py-0.5 text-left"
                  >
                    {track.coverUrl ? (
                      <img
                        src={track.coverUrl}
                        alt=""
                        className="size-8 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="flex size-8 shrink-0 items-center justify-center rounded bg-neutral-100 text-neutral-400 dark:bg-neutral-800">
                        <Music2Icon className="size-3.5" />
                      </div>
                    )}
                    <span className="min-w-0">
                      <p className="truncate text-[12px] font-medium text-neutral-800 dark:text-neutral-200">
                        {track.title || "Untitled"}
                        {track.isLegacy ? (
                          <span className="ml-1.5 text-[10px] font-normal text-neutral-400">
                            legacy
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-neutral-500">
                        {track.artist.trim() || "No artist set"}
                      </p>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${track.title || "track"}`}
                    disabled={loading}
                    onClick={() => {
                      void onDeleteTrack(track.id);
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
      </aside>
    </div>
  );
}
