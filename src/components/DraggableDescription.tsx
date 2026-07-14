"use client";

import { motion, useMotionValue, type PanInfo } from "framer-motion";
import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type DraggableDescriptionProps = {
  text: string;
  className?: string;
};

export function DraggableDescription({
  text,
  className,
}: DraggableDescriptionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const x = useMotionValue(0);
  const [leftConstraint, setLeftConstraint] = useState(0);
  const didDrag = useRef(false);
  const dragDistance = useRef(0);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    const measure = () => {
      const overflow = textEl.scrollWidth - container.clientWidth;
      const nextLeft = overflow > 0 ? -overflow : 0;

      setLeftConstraint(nextLeft);

      if (x.get() < nextLeft) {
        x.set(nextLeft);
      }

      if (x.get() > 0) {
        x.set(0);
      }
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(textEl);

    return () => observer.disconnect();
  }, [text, x]);

  const canDrag = leftConstraint < 0;

  const handleDragStart = () => {
    didDrag.current = false;
    dragDistance.current = 0;
  };

  const handleDrag = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    dragDistance.current += Math.abs(info.delta.x);

    if (dragDistance.current > 4) {
      didDrag.current = true;
    }
  };

  const handleDragEnd = () => {
    window.setTimeout(() => {
      didDrag.current = false;
      dragDistance.current = 0;
    }, 50);
  };

  const preventLinkAfterDrag = (event: React.MouseEvent<HTMLParagraphElement>) => {
    if (!didDrag.current) return;

    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "mt-1 max-w-full overflow-hidden",
        canDrag && "cursor-grab active:cursor-grabbing",
      )}
      onClickCapture={preventLinkAfterDrag}
    >
      <motion.p
        ref={textRef}
        drag={canDrag ? "x" : false}
        dragConstraints={{ left: leftConstraint, right: 0 }}
        dragElastic={0.06}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x, touchAction: canDrag ? "pan-x" : undefined }}
        className={cn(
          "w-max text-[14px] leading-[1.5] text-foreground/45",
          className,
        )}
      >
        {text}
      </motion.p>
    </div>
  );
}
