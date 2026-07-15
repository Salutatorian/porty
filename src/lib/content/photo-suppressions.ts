import { createAdminClient } from "@/lib/supabase/admin";

export type SuppressedPhotoKeys = {
  ids: Set<string>;
  images: Set<string>;
};

export async function getSuppressedPhotoKeys(): Promise<SuppressedPhotoKeys> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("portfolio_photo_suppressions")
      .select("id, image_url");

    if (error) {
      console.warn("[photos] Failed to load suppressions:", error.message);
      return { ids: new Set(), images: new Set() };
    }

    const ids = new Set<string>();
    const images = new Set<string>();

    for (const row of data ?? []) {
      if (row.id) ids.add(row.id);
      if (row.image_url) images.add(row.image_url);
    }

    return { ids, images };
  } catch (error) {
    console.warn("[photos] Failed to load suppressions:", error);
    return { ids: new Set(), images: new Set() };
  }
}

export async function suppressPhotoId(id: string, imageUrl?: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("portfolio_photo_suppressions").upsert({
    id,
    image_url: imageUrl?.trim() || null,
    created_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
}

export function filterSuppressedPhotos<T extends { id: string; image?: string }>(
  photos: T[],
  suppressed: SuppressedPhotoKeys,
) {
  if (suppressed.ids.size === 0 && suppressed.images.size === 0) {
    return photos;
  }

  return photos.filter(
    (photo) =>
      !suppressed.ids.has(photo.id) &&
      !(photo.image && suppressed.images.has(photo.image)),
  );
}
