export type MusicTrack = {
  src: string;
  title: string;
  artist: string;
  cover?: string;
};

/** Tracks in /public/audio/ — editable in admin after import. */
export const MUSIC_PLAYLIST: MusicTrack[] = [
  {
    src: "/audio/beyourself.mp3",
    title: "Be Yourself",
    artist: "Joshua",
  },
  {
    src: "/audio/vince-van-gogh.mp3",
    title: "Vince Van Gogh",
    artist: "Joshua",
  },
];

export function getLegacyTrackId(src: string) {
  const filename = src.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "track";
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
