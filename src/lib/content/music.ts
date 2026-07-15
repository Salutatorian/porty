import type { MusicTrack } from "@/lib/music";
import { getLegacyTrackId, MUSIC_PLAYLIST } from "@/lib/music";
import { createClient } from "@/lib/supabase/server";

type MusicRow = {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_url: string | null;
  sort_order: number;
  published: boolean;
};

export type AdminMusicTrack = {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl?: string;
  sortOrder: number;
  published: boolean;
  isLegacy?: boolean;
};

function mapTrack(row: MusicRow): MusicTrack {
  return {
    src: row.audio_url,
    title: row.title,
    artist: row.artist.trim() || "Unknown artist",
    cover: row.cover_url ?? undefined,
  };
}

function mapAdminTrack(row: MusicRow, isLegacy = false): AdminMusicTrack {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    audioUrl: row.audio_url,
    coverUrl: row.cover_url ?? undefined,
    sortOrder: row.sort_order,
    published: row.published,
    isLegacy,
  };
}

function mergePublishedTracks(dbTracks: MusicTrack[], legacyTracks: MusicTrack[]) {
  const merged = new Map<string, MusicTrack>();

  for (const track of legacyTracks) {
    merged.set(track.src, track);
  }

  for (const track of dbTracks) {
    merged.set(track.src, track);
  }

  return Array.from(merged.values());
}

export async function getAllMusicForAdmin(): Promise<AdminMusicTrack[]> {
  try {
    const { getAdminDb } = await import("@/lib/admin/auth");
    const supabase = await getAdminDb();
    const { data, error } = await supabase
      .from("portfolio_music")
      .select(
        "id, title, artist, audio_url, cover_url, sort_order, published",
      )
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    const dbTracks = (data ?? []).map((row) => mapAdminTrack(row as MusicRow));
    const knownSources = new Set(dbTracks.map((track) => track.audioUrl));

    const legacyTracks = MUSIC_PLAYLIST.filter(
      (track) => !knownSources.has(track.src),
    ).map((track, index) => ({
      id: getLegacyTrackId(track.src),
      title: track.title,
      artist: track.artist,
      audioUrl: track.src,
      coverUrl: track.cover,
      sortOrder: -(MUSIC_PLAYLIST.length - index),
      published: true,
      isLegacy: true,
    }));

    return [...legacyTracks, ...dbTracks];
  } catch {
    return MUSIC_PLAYLIST.map((track, index) => ({
      id: getLegacyTrackId(track.src),
      title: track.title,
      artist: track.artist,
      audioUrl: track.src,
      coverUrl: track.cover,
      sortOrder: index,
      published: true,
      isLegacy: true,
    }));
  }
}

export async function getPublishedMusicTracks(): Promise<MusicTrack[]> {
  let dbRows: MusicRow[] = [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("portfolio_music")
      .select("id, title, artist, audio_url, cover_url, sort_order, published")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (!error && data?.length) {
      dbRows = data as MusicRow[];
    }
  } catch {
    // Fall back to legacy playlist.
  }

  const hiddenSources = new Set(
    dbRows.filter((row) => !row.published).map((row) => row.audio_url),
  );
  const publishedDb = dbRows
    .filter((row) => row.published)
    .map((row) => mapTrack(row));
  const legacy = MUSIC_PLAYLIST.filter((track) => !hiddenSources.has(track.src));
  const merged = mergePublishedTracks(publishedDb, legacy);

  if (merged.length > 0) return merged;

  return MUSIC_PLAYLIST;
}
