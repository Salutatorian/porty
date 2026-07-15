import type { MusicTrack } from "@/lib/music";
import { MUSIC_PLAYLIST } from "@/lib/music";
import { createClient } from "@/lib/supabase/server";

type MusicRow = {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  sort_order: number;
  published: boolean;
};

export type AdminMusicTrack = {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  sortOrder: number;
  published: boolean;
};

function mapTrack(row: MusicRow): MusicTrack {
  return {
    src: row.audio_url,
    title: row.title,
    artist: row.artist.trim() || "Unknown artist",
  };
}

function mapAdminTrack(row: MusicRow): AdminMusicTrack {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    audioUrl: row.audio_url,
    sortOrder: row.sort_order,
    published: row.published,
  };
}

export async function getAllMusicForAdmin(): Promise<AdminMusicTrack[]> {
  try {
    const { getAdminDb } = await import("@/lib/admin/auth");
    const supabase = await getAdminDb();
    const { data, error } = await supabase
      .from("portfolio_music")
      .select("id, title, artist, audio_url, sort_order, published")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row) => mapAdminTrack(row as MusicRow));
  } catch {
    return [];
  }
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
