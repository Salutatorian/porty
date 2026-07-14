import { NextResponse } from "next/server";
import { getTrainingDashboard, isStravaConfigured } from "@/lib/strava/training";

export async function GET(request: Request) {
  if (!isStravaConfigured()) {
    return NextResponse.json(
      {
        error:
          "Missing Strava env (STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN).",
      },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "all";

  try {
    const dashboard = await getTrainingDashboard(range);
    return NextResponse.json(dashboard, {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load Strava data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
