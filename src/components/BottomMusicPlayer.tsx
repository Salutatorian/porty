"use client";

import { HoverMusicPlayer } from "@/components/HoverMusicPlayer";
import { usePhotoLightboxOpen } from "@/hooks/usePhotoLightboxOpen";
import type { MusicTrack } from "@/lib/music";

type BottomMusicPlayerProps = {
  tracks: MusicTrack[];
};

export function BottomMusicPlayer({ tracks }: BottomMusicPlayerProps) {
  const lightboxOpen = usePhotoLightboxOpen();

  if (tracks.length === 0 || lightboxOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-[#fdfcf9]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:bg-[#111111]/95">
      <HoverMusicPlayer tracks={tracks} />
    </div>
  );
}
