"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { CARD_IMAGE_CLASS, CARD_IMAGE_PLACEHOLDER_CLASS } from "@/lib/card";
import { cn } from "@/lib/utils";

type CardCoverProps = {
  image?: string;
  alt: string;
  color?: string;
  highlightOnHover?: boolean;
};

export function CardCover({
  image,
  alt,
  color,
  highlightOnHover = false,
}: CardCoverProps) {
  const reduceMotion = useReducedMotion();
  const interactive = highlightOnHover && image && !reduceMotion;

  return (
    <div
      className={cn(
        CARD_IMAGE_CLASS,
        image
          ? "border-0 bg-transparent shadow-none"
          : cn(
              CARD_IMAGE_PLACEHOLDER_CLASS,
              "bg-[#f4f1eb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-shadow duration-300 group-hover:shadow-[0_18px_50px_rgba(0,0,0,0.10)] dark:bg-[#171717]",
            ),
        interactive &&
          "transition-[border-color,box-shadow,ring-color] duration-500 group-hover:border-foreground/20 group-hover:ring-2 group-hover:ring-foreground/25 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)]",
      )}
      style={color && !image ? { backgroundColor: color } : undefined}
    >
      {image ? (
        <div
          className={cn(
            "relative h-full w-full bg-transparent",
            interactive &&
              "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]",
          )}
        >
          <Image
            src={image}
            alt={alt}
            fill
            className={cn(
              "object-contain",
              interactive &&
                "brightness-[0.92] saturate-[0.95] transition-[filter] duration-500 group-hover:brightness-100 group-hover:saturate-110",
            )}
            draggable={false}
            unoptimized
          />

          {interactive ? (
            <>
              <div
                className="
                  pointer-events-none absolute inset-0
                  bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_3px,rgba(255,255,255,0.04)_4px)]
                  opacity-35 transition-opacity duration-300
                  group-hover:opacity-70
                "
              />
              <div
                className="
                  pointer-events-none absolute inset-0
                  bg-[radial-gradient(circle_at_center,transparent_42%,rgba(0,0,0,0.1)_100%)]
                  opacity-0 transition-opacity duration-300
                  group-hover:opacity-100
                  dark:bg-[radial-gradient(circle_at_center,transparent_42%,rgba(0,0,0,0.22)_100%)]
                "
              />
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
