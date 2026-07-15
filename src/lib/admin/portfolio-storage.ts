import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slugify";
import {
  adminUploadLimitError,
  isWithinAdminUploadLimit,
} from "@/lib/admin/upload-limits";

export type PortfolioUploadFolder = "photos" | "music";

export function createPortfolioUploadPath(
  folder: PortfolioUploadFolder,
  fileName: string,
) {
  const defaultExt = folder === "music" ? "mp3" : "jpg";
  const ext = fileName.split(".").pop() ?? defaultExt;
  return `${folder}/${Date.now()}-${slugify(fileName.replace(/\.[^.]+$/, ""))}.${ext}`;
}

export async function createPortfolioSignedUpload(input: {
  fileName: string;
  fileSize: number;
  folder: PortfolioUploadFolder;
}) {
  if (!isWithinAdminUploadLimit(input.fileSize)) {
    throw new Error(adminUploadLimitError(input.fileName));
  }

  const supabase = createAdminClient();
  const path = createPortfolioUploadPath(input.folder, input.fileName);

  const { data, error } = await supabase.storage
    .from("portfolio")
    .createSignedUploadUrl(path);

  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from("portfolio").getPublicUrl(path);

  return {
    signedUrl: data.signedUrl,
    path,
    publicUrl,
  };
}

export function getPortfolioStoragePathFromPublicUrl(
  publicUrl: string,
): string | null {
  try {
    const url = new URL(publicUrl);
    const marker = "/storage/v1/object/public/portfolio/";
    const index = url.pathname.indexOf(marker);
    if (index === -1) return null;
    return decodeURIComponent(url.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

export async function deletePortfolioStoragePath(path: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.storage.from("portfolio").remove([path]);
  if (error) throw new Error(error.message);
}

export async function deletePortfolioStorageObject(publicUrl: string) {
  const path = getPortfolioStoragePathFromPublicUrl(publicUrl);
  if (!path) return;
  await deletePortfolioStoragePath(path);
}

export async function deletePhotoRecord(id: string, imageUrl?: string) {
  const supabase = createAdminClient();

  const { data: photo, error: readError } = await supabase
    .from("portfolio_photos")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();

  if (readError) throw new Error(readError.message);

  const resolvedImageUrl = photo?.image_url ?? imageUrl?.trim() ?? undefined;

  if (photo) {
    const { error } = await supabase.from("portfolio_photos").delete().eq("id", id);
    if (error) throw new Error(error.message);

    if (photo.image_url) {
      try {
        await deletePortfolioStorageObject(photo.image_url);
      } catch {
        // Legacy or external URLs are left untouched.
      }
    }
  }

  const { suppressPhotoId } = await import("@/lib/content/photo-suppressions");
  await suppressPhotoId(id, resolvedImageUrl);
}
