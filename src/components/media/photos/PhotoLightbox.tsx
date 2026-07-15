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
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

type PhotoViewState = {
  zoom: number;
  panX: number;
  panY: number;
};

const defaultViewState: PhotoViewState = {
  zoom: MIN_ZOOM,
  panX: 0,
  panY: 0,
};

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function PhotoLightbox({
  photo,
  onClose,
  onNext,
  onPrevious,
}: PhotoLightboxProps) {
  const reduceMotion = useReducedMotion();
  const touchStartX = React.useRef<number | null>(null);
  const zoomAreaRef = React.useRef<HTMLDivElement>(null);
  const dragRef = React.useRef<{
    active: boolean;
    startX: number;
    startY: number;
    panX: number;
    panY: number;
  } | null>(null);
  const [view, setView] = React.useState<PhotoViewState>(defaultViewState);
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    setView(defaultViewState);
  }, [photo?.id]);

  React.useEffect(() => {
    const element = zoomAreaRef.current;
    if (!photo || !element) return;

    const onWheel = (event: WheelEvent) => {
      if (!window.matchMedia("(pointer: fine)").matches) return;

      event.preventDefault();
      event.stopPropagation();

      setView((current) => {
        const factor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
        const nextZoom = clampZoom(current.zoom * factor);

        if (nextZoom <= MIN_ZOOM) {
          return defaultViewState;
        }

        const rect = element.getBoundingClientRect();
        const pointerX = event.clientX - rect.left - rect.width / 2;
        const pointerY = event.clientY - rect.top - rect.height / 2;
        const ratio = nextZoom / current.zoom;

        return {
          zoom: nextZoom,
          panX: pointerX - (pointerX - current.panX) * ratio,
          panY: pointerY - (pointerY - current.panY) * ratio,
        };
      });
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [photo]);

  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (view.zoom > MIN_ZOOM) return;
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (view.zoom > MIN_ZOOM) return;

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

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (view.zoom <= MIN_ZOOM || event.button !== 0) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    event.preventDefault();
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      panX: view.panX,
      panY: view.panY,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag?.active) return;

    setView((current) => ({
      ...current,
      panX: drag.panX + event.clientX - drag.startX,
      panY: drag.panY + event.clientY - drag.startY,
    }));
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current?.active) return;
    dragRef.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const resetView = () => {
    setView(defaultViewState);
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
            <div
              ref={zoomAreaRef}
              className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
            >
              <motion.div
                key={photo.id}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.28,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{
                  transform: `translate3d(${view.panX}px, ${view.panY}px, 0) scale(${view.zoom})`,
                  transition: isDragging ? "none" : "transform 0.08s ease-out",
                }}
                className={
                  view.zoom > MIN_ZOOM
                    ? "cursor-grab touch-none active:cursor-grabbing"
                    : "cursor-zoom-in"
                }
                onClick={(event) => event.stopPropagation()}
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  resetView();
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                <img
                  src={photo.image}
                  alt={photo.title}
                  className="max-h-[min(72vh,900px)] max-w-full object-contain shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
                  draggable={false}
                />
              </motion.div>

              {view.zoom <= MIN_ZOOM ? (
                <p className="pointer-events-none absolute bottom-3 left-1/2 hidden -translate-x-1/2 text-[11px] text-white/45 sm:block">
                  Scroll to zoom
                </p>
              ) : null}

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
