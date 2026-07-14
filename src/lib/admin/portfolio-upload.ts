import {
  preparePortfolioFileUpload,
  type PortfolioUploadFolder,
} from "@/lib/admin/actions";

export async function uploadPortfolioFile(
  file: File,
  folder: PortfolioUploadFolder,
) {
  const contentType =
    file.type || (folder === "music" ? "audio/mpeg" : "image/jpeg");

  const { signedUrl, publicUrl } = await preparePortfolioFileUpload({
    fileName: file.name,
    contentType,
    fileSize: file.size,
    folder,
  });

  const response = await fetch(signedUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": contentType,
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      detail
        ? `Upload failed (${response.status}): ${detail}`
        : `Upload failed (${response.status}).`,
    );
  }

  return publicUrl;
}
