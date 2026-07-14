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

const GALLERY_INDEX_PATH = "gallery/index.json";

export function getLegacyPhotosIndexCandidates() {
  const candidates: string[] = [];

  const r2Base = process.env.R2_PUBLIC_BASE_URL?.trim().replace(/\/$/, "");
  if (r2Base) {
    candidates.push(`${r2Base}/${GALLERY_INDEX_PATH}`);
  }

  const legacy = process.env.LEGACY_PHOTOS_INDEX_URL?.trim();
  const blob = process.env.BLOB_PHOTOS_INDEX_URL?.trim();
  if (legacy && !candidates.includes(legacy)) candidates.push(legacy);
  if (blob && !candidates.includes(blob)) candidates.push(blob);

  return candidates;
}

export function getLegacyPhotosIndexUrl() {
  return getLegacyPhotosIndexCandidates()[0] ?? null;
}

export function isR2PhotosConfigured() {
  return Boolean(
    process.env.R2_PUBLIC_BASE_URL?.trim() &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_ENDPOINT,
  );
}

function resolveLegacyPhotoUrl(src: string) {
  if (/^https?:\/\//i.test(src)) return src;

  const base =
    process.env.R2_PUBLIC_BASE_URL?.trim().replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://thegreaterengine.xyz";

  return new URL(src, `${base}/`).toString();
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

async function fetchLegacyIndex(indexUrl: string) {
  const response = await fetch(indexUrl, {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Legacy photo index failed (${response.status}) for ${indexUrl}`);
  }

  const photos = (await response.json()) as LegacyPhoto[];
  if (!Array.isArray(photos)) {
    throw new Error(`Legacy photo index at ${indexUrl} is not a JSON array.`);
  }

  return photos
    .map((photo, index) => mapLegacyPhotoToItem(photo, index))
    .filter((photo): photo is PhotoItem => photo !== null);
}

export async function getLegacyPhotos(): Promise<PhotoItem[]> {
  const candidates = getLegacyPhotosIndexCandidates();
  if (candidates.length === 0) return [];

  let lastError: Error | null = null;

  for (const indexUrl of candidates) {
    try {
      const photos = await fetchLegacyIndex(indexUrl);
      if (photos.length > 0) return photos;
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("Failed to load legacy photos");
    }
  }

  if (lastError) throw lastError;
  return [];
}
