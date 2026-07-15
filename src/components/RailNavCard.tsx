"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { CardCover } from "@/components/CardCover";
import { CARD_LINK_CLASS } from "@/lib/card";
import type { RailNavItem } from "@/lib/rail-nav";

type RailNavCardProps = RailNavItem & {
  index: number;
};

export function RailNavCard({
  href,
  title,
  cta,
  image,
  imageAlt,
  color,
  highlightOnHover,
  index,
}: RailNavCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`${CARD_LINK_CLASS} select-none`}
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.45,
        delay: reduceMotion ? 0 : index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileTap={reduceMotion ? undefined : { scale: 0.99 }}
    >
      <Link
        href={href}
        prefetch
        draggable={false}
        className="group block shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-4 dark:focus-visible:ring-white/20"
      >
        <CardCover
          image={image}
          alt={imageAlt ?? title}
          color={color}
          highlightOnHover={highlightOnHover}
        />

        <div className="mt-4 px-1">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-[15px] font-medium text-foreground">{title}</h3>
            <span className="text-[13px] text-foreground/40">{cta}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
