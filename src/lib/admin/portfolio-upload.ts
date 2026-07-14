"use client";

export type PortfolioUploadFolder = "photos" | "music";

type PrepareUploadResponse = {
  signedUrl: string;
  publicUrl: string;
  error?: string;
};

async function readApiError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    if (body.error) return body.error;
  } catch {
    // Ignore JSON parse failures.
  }

  return `${fallback} (${response.status})`;
}

export async function uploadPortfolioFile(
  file: File,
  folder: PortfolioUploadFolder,
) {
  const contentType =
    file.type || (folder === "music" ? "audio/mpeg" : "image/jpeg");

  const prepareResponse = await fetch("/api/admin/upload/prepare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      folder,
    }),
  });

  if (!prepareResponse.ok) {
    throw new Error(
      await readApiError(prepareResponse, "Could not start upload"),
    );
  }

  const { signedUrl, publicUrl } =
    (await prepareResponse.json()) as PrepareUploadResponse;

  const uploadResponse = await fetch(signedUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": contentType,
    },
  });

  if (!uploadResponse.ok) {
    const detail = await uploadResponse.text().catch(() => "");
    throw new Error(
      detail
        ? `Upload failed (${uploadResponse.status}): ${detail}`
        : `Upload failed (${uploadResponse.status}).`,
    );
  }

  return publicUrl;
}

export async function saveMusicTrackViaApi(input: {
  title: string;
  artist: string;
  audioUrl: string;
  published?: boolean;
  sortOrder?: number;
}) {
  const response = await fetch("/api/admin/music", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to save track"));
  }

  return response.json();
}
