"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { PhotoItem } from "@/lib/media-items";
import { cn } from "@/lib/utils";

type PhotoGalleryItemProps = {
  photo: PhotoItem;
  index: number;
  layoutClassName: string;
  onOpen: (photo: PhotoItem) => void;
  variant?: "mobile" | "grid";
};

export function PhotoGalleryItem({
  photo,
  index,
  layoutClassName,
  onOpen,
  variant = "grid",
}: PhotoGalleryItemProps) {
  const reduceMotion = useReducedMotion();
  const isMobileFeed = variant === "mobile";

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(photo)}
      initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: reduceMotion ? 0 : 0.42,
        delay: reduceMotion ? 0 : Math.min(index * 0.035, 0.25),
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        "group relative overflow-hidden text-left",
        "border-[3px] border-white bg-white",
        "shadow-[0_3px_14px_rgba(0,0,0,0.08)]",
        "transition-shadow duration-300",
        "hover:shadow-[0_12px_35px_rgba(0,0,0,0.14)]",
        "dark:border-neutral-200 dark:bg-neutral-100",
        isMobileFeed
          ? "aspect-[4/5] w-full"
          : "sm:border-[4px]",
        !isMobileFeed && layoutClassName,
      )}
    >
      <img
        src={photo.image}
        alt={photo.title}
        loading="lazy"
        decoding="async"
        draggable={false}
        className={cn(
          "photo-gallery-image h-full w-full object-cover",
          "grayscale transition-[filter,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "motion-safe:group-hover:scale-[1.015] motion-safe:group-hover:grayscale-0",
          "motion-safe:group-hover:contrast-[1.03] motion-safe:group-hover:brightness-[1.02]",
          "[@media(hover:none)]:grayscale-0 [@media(hover:none)]:contrast-100 [@media(hover:none)]:brightness-100",
        )}
      />

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0",
          "bg-gradient-to-t from-black/55 via-black/10 to-transparent",
          "px-2.5 pb-2 pt-8 opacity-0 transition-opacity duration-300",
          "motion-safe:group-hover:opacity-100",
          "[@media(hover:none)]:hidden",
        )}
      >
        <p className="truncate text-[11px] font-medium text-white/90">
          {photo.title}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-white/55">
          {photo.dateTaken ?? photo.year}
        </p>
      </div>
    </motion.button>
  );
}
