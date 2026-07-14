import { NextResponse } from "next/server";
import {
  getLegacyPhotos,
  getLegacyPhotosIndexUrl,
} from "@/lib/syndication/legacy-photos";

export async function GET() {
  const indexUrl = getLegacyPhotosIndexUrl();

  if (!indexUrl) {
    return NextResponse.json({
      configured: false,
      message:
        "Set LEGACY_PHOTOS_INDEX_URL or BLOB_PHOTOS_INDEX_URL, then redeploy.",
    });
  }

  try {
    const photos = await getLegacyPhotos();
    return NextResponse.json({
      configured: true,
      indexUrl,
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
      { configured: true, indexUrl, error: message, count: 0 },
      { status: 500 },
    );
  }
}
