import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slugify";

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    title?: string;
    artist?: string;
    audioUrl?: string;
    coverUrl?: string;
    published?: boolean;
    sortOrder?: number;
    id?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = body.title?.trim();
  const audioUrl = body.audioUrl?.trim();
  const artist = body.artist?.trim() ?? "";
  const coverUrl = body.coverUrl?.trim() || null;

  if (!title || !audioUrl) {
    return NextResponse.json(
      { error: "title and audioUrl are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createAdminClient();
    const id = body.id?.trim() || slugify(title);

    const { error } = await supabase.from("portfolio_music").upsert({
      id,
      title,
      artist,
      audio_url: audioUrl,
      cover_url: coverUrl,
      sort_order: body.sortOrder ?? 0,
      published: body.published ?? true,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath("/");
    revalidatePath("/admin/music");

    return NextResponse.json({ id, title, artist, audioUrl, coverUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save track";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
