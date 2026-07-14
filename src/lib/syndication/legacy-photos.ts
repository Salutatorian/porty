import type { PhotoItem } from "@/lib/media-items";
import { slugify } from "@/lib/slugify";

export type LegacyPhoto = {
  id: string;
  src: string;
  alt?: string;
  title?: string;
  meta?: string;
  caption?: string;
  category?: string;
  date?: string;
  time?: string;
  createdAt?: string;
};

export function getLegacyPhotosIndexUrl() {
  return (
    process.env.LEGACY_PHOTOS_INDEX_URL ||
    process.env.BLOB_PHOTOS_INDEX_URL ||
    null
  );
}

function resolveLegacyPhotoUrl(src: string) {
  if (/^https?:\/\//i.test(src)) return src;

  const base =
    process.env.R2_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://thegreaterengine.xyz";

  return new URL(src, base.endsWith("/") ? base : `${base}/`).toString();
}

export function mapLegacyPhotoToItem(
  photo: LegacyPhoto,
  index: number,
): PhotoItem | null {
  if (!photo.src?.trim()) return null;

  const title = photo.title?.trim() || photo.alt?.trim() || "Untitled";
  const created = photo.createdAt ? new Date(photo.createdAt) : null;
  const year = photo.date
    ? String(new Date(photo.date).getFullYear())
    : created && !Number.isNaN(created.getTime())
      ? String(created.getFullYear())
      : String(new Date().getFullYear());

  return {
    id: `${slugify(title)}-${photo.id || index}`,
    title,
    location: "",
    year,
    image: resolveLegacyPhotoUrl(photo.src),
    dateTaken: photo.date || photo.meta || undefined,
    locationDetail: photo.meta || undefined,
    description: photo.caption || undefined,
    collection: photo.category || undefined,
  };
}

export async function getLegacyPhotos(): Promise<PhotoItem[]> {
  const indexUrl = getLegacyPhotosIndexUrl();
  if (!indexUrl) return [];

  const response = await fetch(indexUrl, {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Legacy photo index failed: ${response.status}`);
  }

  const photos = (await response.json()) as LegacyPhoto[];
  if (!Array.isArray(photos)) return [];

  return photos
    .map((photo, index) => mapLegacyPhotoToItem(photo, index))
    .filter((photo): photo is PhotoItem => photo !== null);
}
