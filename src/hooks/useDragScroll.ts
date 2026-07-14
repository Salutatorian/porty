"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DRAG_THRESHOLD = 6;
const FRICTION = 0.92;
const MIN_VELOCITY = 0.15;

export function useDragScroll() {
  const railRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const scrollStartRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const movedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const stopMomentum = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const applyMomentum = useCallback(() => {
    const el = railRef.current;
    if (!el) return;

    const step = () => {
      velocityRef.current *= FRICTION;
      if (Math.abs(velocityRef.current) < MIN_VELOCITY) {
        rafRef.current = null;
        return;
      }
      el.scrollLeft -= velocityRef.current;
      rafRef.current = requestAnimationFrame(step);
    };

    stopMomentum();
    rafRef.current = requestAnimationFrame(step);
  }, [stopMomentum]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const el = railRef.current;
      if (!el) return;

      stopMomentum();
      pointerIdRef.current = e.pointerId;
      startXRef.current = e.clientX;
      scrollStartRef.current = el.scrollLeft;
      lastXRef.current = e.clientX;
      lastTimeRef.current = performance.now();
      velocityRef.current = 0;
      movedRef.current = false;
      setIsDragging(true);
      el.setPointerCapture(e.pointerId);
    },
    [stopMomentum],
  );

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    const el = railRef.current;
    if (!el) return;

    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > DRAG_THRESHOLD) {
      movedRef.current = true;
    }

    const now = performance.now();
    const dt = now - lastTimeRef.current;
    if (dt > 0) {
      velocityRef.current = (e.clientX - lastXRef.current) / dt;
    }
    lastXRef.current = e.clientX;
    lastTimeRef.current = now;

    el.scrollLeft = scrollStartRef.current - dx;
  }, []);

  const endDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current !== e.pointerId) return;
      const el = railRef.current;
      if (!el) return;

      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      pointerIdRef.current = null;
      setIsDragging(false);

      if (movedRef.current) {
        applyMomentum();
      }
    },
    [applyMomentum],
  );

  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = railRef.current;
    if (!el) return;

    let delta = 0;
    if (e.shiftKey) {
      delta = e.deltaY;
    } else if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      delta = e.deltaX;
    } else if (e.deltaY !== 0) {
      delta = e.deltaY;
    }

    if (delta === 0) return;

    e.preventDefault();
    stopMomentum();
    el.scrollLeft += delta;
  }, [stopMomentum]);

  useEffect(() => () => stopMomentum(), [stopMomentum]);

  const wasDragging = useCallback(() => {
    const dragged = movedRef.current;
    movedRef.current = false;
    return dragged;
  }, []);

  return {
    railRef,
    isDragging,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onWheel,
    wasDragging,
  };
}
