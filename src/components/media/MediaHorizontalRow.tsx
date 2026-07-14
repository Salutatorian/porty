"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useDragScroll } from "@/hooks/useDragScroll";

type MediaHorizontalRowProps = {
  children: React.ReactNode;
  className?: string;
};

export function MediaHorizontalRow({
  children,
  className,
}: MediaHorizontalRowProps) {
  const {
    railRef,
    isDragging,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onWheel,
  } = useDragScroll();

  return (
    <div
      ref={railRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onWheel={onWheel}
      className={cn(
        "flex gap-3 overflow-x-auto overscroll-x-contain pb-1",
        "px-5 sm:px-8 lg:px-12",
        "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        isDragging ? "cursor-grabbing select-none" : "cursor-grab",
        className,
      )}
    >
      {children}
    </div>
  );
}
