import { NextResponse } from "next/server";
import { getLetterboxdMovies } from "@/lib/syndication/letterboxd";

export async function GET() {
  try {
    const watched = await getLetterboxdMovies();
    return NextResponse.json(
      {
        watched: watched.map((movie) => ({
          title: movie.title,
          cover: movie.poster,
          link: "",
          rating: 0,
        })),
      },
      {
        headers: {
          "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch Letterboxd";
    return NextResponse.json(
      { error: message, watched: [] },
      { status: 500 },
    );
  }
}
