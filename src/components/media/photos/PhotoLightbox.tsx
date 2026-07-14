"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PhotoMetadata } from "@/components/media/photos/PhotoMetadata";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import type { PhotoItem } from "@/lib/media-items";

type PhotoLightboxProps = {
  photo: PhotoItem | null;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
};

const SWIPE_THRESHOLD = 48;

export function PhotoLightbox({
  photo,
  onClose,
  onNext,
  onPrevious,
}: PhotoLightboxProps) {
  const reduceMotion = useReducedMotion();
  const touchStartX = React.useRef<number | null>(null);

  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartX.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartX.current = null;

    if (startX === null || endX === undefined) return;

    const delta = endX - startX;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;

    if (delta < 0) {
      onNext();
    } else {
      onPrevious();
    }
  };

  return (
    <AnimatePresence>
      {photo ? (
        <motion.div
          key="photo-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={photo.title}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex flex-col bg-black/72 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.22 }}
        >
          <div
            className="relative flex min-h-0 flex-1 flex-col px-4 pb-5 pt-6 sm:px-8 sm:pb-8 sm:pt-8"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="relative flex min-h-0 flex-1 items-center justify-center">
              <motion.img
                key={photo.id}
                src={photo.image}
                alt={photo.title}
                onClick={(event) => event.stopPropagation()}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.28,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="max-h-[min(72vh,900px)] max-w-full object-contain shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
                draggable={false}
              />

              <ButtonGroup className="absolute left-0 top-1/2 hidden -translate-y-1/2 sm:flex">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Previous photo"
                  onClick={(event) => {
                    event.stopPropagation();
                    onPrevious();
                  }}
                  className="border-white/15 bg-black/35 text-white hover:bg-black/50 hover:text-white"
                >
                  <ChevronLeftIcon />
                </Button>
              </ButtonGroup>

              <ButtonGroup className="absolute right-0 top-1/2 hidden -translate-y-1/2 sm:flex">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Next photo"
                  onClick={(event) => {
                    event.stopPropagation();
                    onNext();
                  }}
                  className="border-white/15 bg-black/35 text-white hover:bg-black/50 hover:text-white"
                >
                  <ChevronRightIcon />
                </Button>
              </ButtonGroup>
            </div>

            <div
              className="relative z-10 mx-auto mt-4 w-full max-w-3xl rounded-2xl border border-white/10 bg-black/35 px-4 py-4 backdrop-blur-md sm:px-5 sm:py-5"
              onClick={(event) => event.stopPropagation()}
            >
              <PhotoMetadata photo={photo} />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
