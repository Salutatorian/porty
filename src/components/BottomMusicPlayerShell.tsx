import { BottomMusicPlayer } from "@/components/BottomMusicPlayer";
import { getPublishedMusicTracks } from "@/lib/content/music";

export async function BottomMusicPlayerShell() {
  const tracks = await getPublishedMusicTracks();
  return <BottomMusicPlayer tracks={tracks} />;
}
