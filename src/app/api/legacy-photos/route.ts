import { NextResponse } from "next/server";
import {
  getLegacyPhotos,
  getLegacyPhotosIndexCandidates,
  isR2PhotosConfigured,
} from "@/lib/syndication/legacy-photos";

export async function GET() {
  const candidates = getLegacyPhotosIndexCandidates();

  if (candidates.length === 0) {
    return NextResponse.json({
      configured: false,
      message:
        "Set R2_PUBLIC_BASE_URL (Cloudflare R2) or LEGACY_PHOTOS_INDEX_URL, then redeploy.",
      r2Configured: isR2PhotosConfigured(),
    });
  }

  try {
    const photos = await getLegacyPhotos();
    return NextResponse.json({
      configured: true,
      r2Configured: isR2PhotosConfigured(),
      candidates,
      indexUrl: candidates[0],
      count: photos.length,
      sample: photos.slice(0, 3).map((photo) => ({
        id: photo.id,
        title: photo.title,
        image: photo.image,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load legacy photos";
    return NextResponse.json(
      {
        configured: true,
        r2Configured: isR2PhotosConfigured(),
        candidates,
        error: message,
        count: 0,
      },
      { status: 500 },
    );
  }
}
