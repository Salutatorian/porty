export type MusicTrack = {
  src: string;
  title: string;
  artist: string;
};

/** Tracks in /public/audio/ — replace files or edit this list anytime. */
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
