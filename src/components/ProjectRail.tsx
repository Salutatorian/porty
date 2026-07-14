"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  type PanInfo,
} from "framer-motion";

interface ProjectRailProps {
  children: React.ReactNode;
  className?: string;
}

export function ProjectRail({ children, className }: ProjectRailProps) {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const [leftConstraint, setLeftConstraint] = React.useState(0);

  const didDrag = React.useRef(false);
  const dragDistance = React.useRef(0);

  React.useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;

    if (!viewport || !track) return;

    const measure = () => {
      const viewportWidth = viewport.clientWidth;
      const trackWidth = track.scrollWidth;

      const nextLeftConstraint = Math.min(0, viewportWidth - trackWidth);

      setLeftConstraint(nextLeftConstraint);

      if (x.get() < nextLeftConstraint) {
        x.set(nextLeftConstraint);
      }

      if (x.get() > 0) {
        x.set(0);
      }
    };

    measure();

    const observer = new ResizeObserver(measure);

    observer.observe(viewport);
    observer.observe(track);

    return () => observer.disconnect();
  }, [x, children]);

  const handleDragStart = () => {
    didDrag.current = false;
    dragDistance.current = 0;
  };

  const handleDrag = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    dragDistance.current += Math.abs(info.delta.x);

    if (dragDistance.current > 6) {
      didDrag.current = true;
    }
  };

  const handleDragEnd = () => {
    window.setTimeout(() => {
      didDrag.current = false;
      dragDistance.current = 0;
    }, 50);
  };

  const preventLinkAfterDrag = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (!didDrag.current) return;

    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      ref={viewportRef}
      aria-label="Projects"
      role="region"
      aria-roledescription="carousel"
      className={["w-full overflow-hidden", className].filter(Boolean).join(" ")}
    >
      <motion.div
        ref={trackRef}
        drag="x"
        dragConstraints={{
          left: leftConstraint,
          right: 0,
        }}
        dragElastic={0.06}
        dragMomentum
        dragTransition={{
          bounceStiffness: 420,
          bounceDamping: 38,
          power: 0.25,
          timeConstant: 260,
        }}
        style={{
          x,
          touchAction: "pan-y",
        }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onClickCapture={preventLinkAfterDrag}
        className="
          flex w-max cursor-grab select-none items-start
          gap-6
          px-[clamp(20px,4vw,80px)]
          pb-12 pt-6
          active:cursor-grabbing
        "
      >
        {children}
      </motion.div>
    </div>
  );
}
