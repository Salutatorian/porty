import { NextResponse } from "next/server";
import { getWhoopDashboard } from "@/lib/whoop/dashboard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "all";

  try {
    const dashboard = await getWhoopDashboard(range);
    return NextResponse.json(dashboard, {
      headers: {
        "Cache-Control": "s-maxage=60, max-age=0, stale-while-revalidate",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "WHOOP request failed.";
    return NextResponse.json(
      { enabled: false, message },
      { status: 200 },
    );
  }
}
