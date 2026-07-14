import type { MusicTrack } from "@/lib/music";
import { MUSIC_PLAYLIST } from "@/lib/music";
import { createClient } from "@/lib/supabase/server";

type MusicRow = {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  sort_order: number;
};

function mapTrack(row: MusicRow): MusicTrack {
  return {
    src: row.audio_url,
    title: row.title,
    artist: row.artist,
  };
}

export async function getPublishedMusicTracks(): Promise<MusicTrack[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("portfolio_music")
      .select("id, title, artist, audio_url, sort_order")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error || !data?.length) return MUSIC_PLAYLIST;
    return data.map((row) => mapTrack(row as MusicRow));
  } catch {
    return MUSIC_PLAYLIST;
  }
}
