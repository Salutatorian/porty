"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX, Music2 } from "lucide-react";
import type { MusicTrack } from "@/lib/music";

interface HoverMusicPlayerProps {
  tracks: MusicTrack[];
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "00:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

const DEFAULT_VOLUME = 0.05;

export function HoverMusicPlayer({ tracks }: HoverMusicPlayerProps) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const sliderRef = React.useRef<HTMLDivElement>(null);
  const volumeSliderRef = React.useRef<HTMLDivElement>(null);
  const isDraggingRef = React.useRef(false);
  const isDraggingVolumeRef = React.useRef(false);
  const volumeBeforeMuteRef = React.useRef(DEFAULT_VOLUME);
  const resumeAfterTrackChange = React.useRef(false);
  const reduceMotion = useReducedMotion();

  const [trackIndex, setTrackIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(DEFAULT_VOLUME);

  const track = tracks[trackIndex] ?? tracks[0];
  const progress = duration > 0 ? currentTime / duration : 0;
  const expanded = isHovered && !reduceMotion;

  const playAudio = React.useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      await audio.play();
    } catch {
      /* blocked or missing file */
    }
  }, []);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      await playAudio();
    } else {
      audio.pause();
    }
  };

  const changeTrack = React.useCallback(
    (nextIndex: number, resume = false) => {
      if (tracks.length === 0) return;

      const audio = audioRef.current;
      resumeAfterTrackChange.current =
        resume || (audio ? !audio.paused : isPlaying);

      const wrapped =
        ((nextIndex % tracks.length) + tracks.length) % tracks.length;
      setTrackIndex(wrapped);
      setCurrentTime(0);
      setDuration(0);
    },
    [isPlaying, tracks.length],
  );

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;

    audio.load();

    if (resumeAfterTrackChange.current) {
      resumeAfterTrackChange.current = false;
      void playAudio();
    }
  }, [track?.src, playAudio, track]);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  const toggleMute = () => {
    if (volume > 0) {
      volumeBeforeMuteRef.current = volume;
      setVolume(0);
      return;
    }

    setVolume(volumeBeforeMuteRef.current || DEFAULT_VOLUME);
  };

  const goPrevious = () => changeTrack(trackIndex - 1);
  const goNext = () => changeTrack(trackIndex + 1, true);

  const seekToClientX = React.useCallback(
    (clientX: number) => {
      const audio = audioRef.current;
      const slider = sliderRef.current;
      if (!audio || !slider || duration <= 0) return;

      const rect = slider.getBoundingClientRect();
      const percentage = Math.min(
        1,
        Math.max(0, (clientX - rect.left) / rect.width),
      );

      audio.currentTime = percentage * duration;
      setCurrentTime(audio.currentTime);
    },
    [duration],
  );

  const onSliderPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    isDraggingRef.current = true;
    seekToClientX(event.clientX);
  };

  const onSliderPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    seekToClientX(event.clientX);
  };

  const onSliderPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const seekVolumeToClientX = React.useCallback((clientX: number) => {
    const slider = volumeSliderRef.current;
    if (!slider) return;

    const rect = slider.getBoundingClientRect();
    const nextVolume = Math.min(
      1,
      Math.max(0, (clientX - rect.left) / rect.width),
    );

    if (nextVolume > 0) {
      volumeBeforeMuteRef.current = nextVolume;
    }

    setVolume(nextVolume);
  }, []);

  const onVolumePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    isDraggingVolumeRef.current = true;
    seekVolumeToClientX(event.clientX);
  };

  const onVolumePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingVolumeRef.current) return;
    seekVolumeToClientX(event.clientX);
  };

  const onVolumePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    isDraggingVolumeRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  if (!track) return null;

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      animate={{
        height: expanded ? 80 : 48,
      }}
      transition={{
        type: "spring",
        stiffness: 320,
        damping: 30,
        mass: 0.75,
      }}
      className="
        w-full overflow-hidden
        border-t border-black/[0.06]
        bg-[#fdfcf9]/95
        text-foreground
        shadow-[0_-8px_30px_rgba(0,0,0,0.06)]
        backdrop-blur-xl
        dark:border-white/[0.08]
        dark:bg-[#111111]/95
        dark:text-white
        dark:shadow-[0_-10px_35px_rgba(0,0,0,0.22)]
      "
    >
      <audio
        ref={audioRef}
        src={track.src}
        preload="metadata"
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration || 0);
        }}
        onTimeUpdate={(event) => {
          if (!isDraggingRef.current) {
            setCurrentTime(event.currentTarget.currentTime);
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => goNext()}
      />

      <div className="mx-auto flex h-full w-full max-w-[920px] items-center gap-2.5 px-4 sm:gap-3 sm:px-6">
        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5">
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <motion.button
            type="button"
            onClick={goPrevious}
            aria-label="Previous track"
            animate={{
              width: expanded ? 32 : 28,
              height: expanded ? 32 : 28,
              opacity: expanded ? 1 : 0.55,
            }}
            whileTap={{ scale: 0.9 }}
            className="flex items-center justify-center rounded-full text-foreground/70 hover:text-foreground dark:text-white/60 dark:hover:text-white"
          >
            <SkipBack className="size-3.5" />
          </motion.button>

          <motion.button
            type="button"
            onClick={togglePlayback}
            aria-label={isPlaying ? "Pause" : "Play"}
            animate={{
              width: expanded ? 36 : 28,
              height: expanded ? 36 : 28,
            }}
            whileTap={{ scale: 0.9 }}
            transition={{
              type: "spring",
              stiffness: 360,
              damping: 25,
            }}
            className="flex shrink-0 items-center justify-center rounded-full bg-foreground text-background"
          >
            {isPlaying ? (
              <Pause className="size-3.5" fill="currentColor" />
            ) : (
              <Play className="size-3.5 translate-x-px" fill="currentColor" />
            )}
          </motion.button>

          <motion.button
            type="button"
            onClick={goNext}
            aria-label="Next track"
            animate={{
              width: expanded ? 32 : 28,
              height: expanded ? 32 : 28,
              opacity: expanded ? 1 : 0.55,
            }}
            whileTap={{ scale: 0.9 }}
            className="flex items-center justify-center rounded-full text-foreground/70 hover:text-foreground dark:text-white/60 dark:hover:text-white"
          >
            <SkipForward className="size-3.5" />
          </motion.button>
          </div>

          <motion.div
            animate={{
              maxWidth: expanded ? 180 : 0,
              opacity: expanded ? 1 : 0,
            }}
            transition={{ duration: 0.18 }}
            className="hidden min-w-0 items-center gap-2.5 overflow-hidden sm:flex"
          >
            {track.cover ? (
              <img
                src={track.cover}
                alt=""
                className="size-11 shrink-0 rounded-md object-cover shadow-sm"
              />
            ) : (
              <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-foreground/8 text-foreground/35 dark:bg-white/10 dark:text-white/35">
                <Music2 className="size-4" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium leading-tight">
                {track.title}
              </p>
              <p className="truncate text-[11px] leading-tight text-foreground/45 dark:text-white/40">
                {track.artist}
              </p>
            </div>
          </motion.div>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
          <span className="w-9 shrink-0 tabular-nums text-[10px] text-foreground/50 dark:text-white/55">
            {formatTime(currentTime)}
          </span>

          <motion.div
            ref={sliderRef}
            role="slider"
            tabIndex={0}
            aria-label="Audio progress"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={currentTime}
            onPointerDown={onSliderPointerDown}
            onPointerMove={onSliderPointerMove}
            onPointerUp={onSliderPointerUp}
            onPointerCancel={onSliderPointerUp}
            animate={{
              height: expanded ? 6 : 4,
            }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 28,
            }}
            className="
              relative flex-1 cursor-pointer overflow-visible rounded-full
              bg-black/10 touch-none
              dark:bg-white/20
            "
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-foreground dark:bg-white"
              style={{ width: `${progress * 100}%` }}
            />

            <motion.div
              animate={{
                width: expanded ? 10 : 6,
                height: expanded ? 10 : 6,
              }}
              transition={{
                type: "spring",
                stiffness: 360,
                damping: 25,
              }}
              className="
                absolute top-1/2 rounded-full
                bg-foreground
                dark:bg-white
              "
              style={{
                left: `${progress * 100}%`,
                x: "-50%",
                y: "-50%",
              }}
            />
          </motion.div>

          <span className="w-9 shrink-0 text-right tabular-nums text-[10px] text-foreground/50 dark:text-white/55">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <motion.button
            type="button"
            onClick={toggleMute}
            aria-label={volume > 0 ? "Mute" : "Unmute"}
            animate={{
              width: expanded ? 32 : 28,
              height: expanded ? 32 : 28,
              opacity: expanded ? 1 : 0.55,
            }}
            whileTap={{ scale: 0.9 }}
            className="flex items-center justify-center rounded-full text-foreground/70 hover:text-foreground dark:text-white/60 dark:hover:text-white"
          >
            {volume > 0 ? (
              <Volume2 className="size-3.5" />
            ) : (
              <VolumeX className="size-3.5" />
            )}
          </motion.button>

          <motion.div
            ref={volumeSliderRef}
            role="slider"
            tabIndex={0}
            aria-label="Volume"
            aria-valuemin={0}
            aria-valuemax={1}
            aria-valuenow={volume}
            onPointerDown={onVolumePointerDown}
            onPointerMove={onVolumePointerMove}
            onPointerUp={onVolumePointerUp}
            onPointerCancel={onVolumePointerUp}
            animate={{
              width: expanded ? 72 : 0,
              height: expanded ? 6 : 0,
              opacity: expanded ? 1 : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 28,
            }}
            className="
              relative cursor-pointer overflow-visible rounded-full
              bg-black/10 touch-none
              dark:bg-white/20
            "
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-foreground dark:bg-white"
              style={{ width: `${volume * 100}%` }}
            />

            <motion.div
              animate={{
                width: expanded ? 10 : 0,
                height: expanded ? 10 : 0,
              }}
              className="
                absolute top-1/2 rounded-full
                bg-foreground
                dark:bg-white
              "
              style={{
                left: `${volume * 100}%`,
                x: "-50%",
                y: "-50%",
              }}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
