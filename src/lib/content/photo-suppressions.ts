import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function getSuppressedPhotoIds(): Promise<Set<string>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("portfolio_photo_suppressions")
      .select("id");

    if (error) return new Set();
    return new Set((data ?? []).map((row) => row.id));
  } catch {
    return new Set();
  }
}

export async function suppressPhotoId(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("portfolio_photo_suppressions").upsert({
    id,
    created_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
}

export function filterSuppressedPhotos<T extends { id: string; image?: string }>(
  photos: T[],
  suppressedIds: Set<string>,
) {
  if (suppressedIds.size === 0) return photos;
  return photos.filter((photo) => !suppressedIds.has(photo.id));
}
