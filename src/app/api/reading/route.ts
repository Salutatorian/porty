import { NextResponse } from "next/server";
import { getGoodreadsShelves } from "@/lib/syndication/goodreads";

export async function GET() {
  try {
    const data = await getGoodreadsShelves();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch Goodreads";
    return NextResponse.json(
      { error: message, read: [], currentlyReading: [], toRead: [] },
      { status: 500 },
    );
  }
}
