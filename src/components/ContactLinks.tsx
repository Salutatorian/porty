"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { CONTACT_LINKS } from "@/lib/contact";

const spring = {
  type: "spring",
  stiffness: 500,
  damping: 34,
  mass: 0.7,
} as const;

export function ContactLinks() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="flex w-full justify-center"
      onMouseLeave={() => setActiveId(null)}
    >
      <div
        className="
          relative inline-flex items-center
          rounded-full border border-foreground/[0.08]
          bg-foreground/[0.015] p-1
        "
      >
        {CONTACT_LINKS.map((item) => (
          <a
            key={item.id}
            href={item.href}
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noopener noreferrer" : undefined}
            onMouseEnter={() => setActiveId(item.id)}
            onFocus={() => setActiveId(item.id)}
            onBlur={() => setActiveId(null)}
            className="
              relative inline-flex items-center justify-center
              rounded-full px-4 py-2
              text-[13px] font-medium leading-none
              text-foreground/50
              transition-colors duration-150
              hover:text-foreground
              focus-visible:outline-none
              focus-visible:ring-1
              focus-visible:ring-foreground/25
            "
          >
            {activeId === item.id && (
              <motion.span
                layoutId="contact-highlight"
                transition={reduceMotion ? { duration: 0 } : spring}
                className="
                  absolute inset-0 rounded-full
                  border border-foreground/[0.06]
                  bg-foreground/[0.07]
                  dark:border-white/[0.07]
                  dark:bg-white/[0.08]
                "
              />
            )}
            <span className="relative z-10 whitespace-nowrap">{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
