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
