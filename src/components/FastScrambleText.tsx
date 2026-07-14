"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const CHARACTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

interface FastScrambleTextProps {
  text: string;
  delay?: number;
  duration?: number;
  className?: string;
  scrambledClassName?: string;
  /** Use for multi-line text so layout height stays fixed while scrambling */
  block?: boolean;
}

export function FastScrambleText({
  text,
  delay = 0,
  duration = 650,
  className,
  scrambledClassName,
  block = false,
}: FastScrambleTextProps) {
  const [displayedText, setDisplayedText] = React.useState(text);
  const [finished, setFinished] = React.useState(false);

  React.useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      setDisplayedText(text);
      setFinished(true);
      return;
    }

    let frameId = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const startAnimation = () => {
      const startedAt = performance.now();

      const animate = (time: number) => {
        const elapsed = time - startedAt;
        const progress = Math.min(elapsed / duration, 1);
        const revealedCharacters = Math.floor(progress * text.length);

        const nextText = text
          .split("")
          .map((character, index) => {
            if (character === " ") return " ";

            if (index < revealedCharacters) {
              return character;
            }

            return CHARACTERS[
              Math.floor(Math.random() * CHARACTERS.length)
            ];
          })
          .join("");

        setDisplayedText(nextText);

        if (progress < 1) {
          frameId = requestAnimationFrame(animate);
        } else {
          setDisplayedText(text);
          setFinished(true);
        }
      };

      frameId = requestAnimationFrame(animate);
    };

    timeoutId = setTimeout(startAnimation, delay);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(frameId);
    };
  }, [text, delay, duration]);

  const visibleClassName = finished ? className : scrambledClassName;

  if (block) {
    return (
      <span className="relative block w-full overflow-hidden">
        <span aria-hidden className="invisible block">
          {text}
        </span>
        <span className={cn("absolute inset-0 block", visibleClassName)}>
          {displayedText}
        </span>
      </span>
    );
  }

  return (
    <span className="relative inline-grid max-w-full overflow-hidden align-top">
      <span aria-hidden className="invisible col-start-1 row-start-1">
        {text}
      </span>
      <span className={cn("col-start-1 row-start-1", visibleClassName)}>
        {displayedText}
      </span>
    </span>
  );
}
