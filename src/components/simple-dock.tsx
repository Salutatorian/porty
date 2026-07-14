"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Folder, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

type View = "projects" | "about";

interface SimpleDockProps {
  activeView: View;
  onViewChange: (view: View) => void;
  className?: string;
}

const spring = {
  type: "spring",
  stiffness: 500,
  damping: 34,
  mass: 0.7,
} as const;

export function SimpleDock({
  activeView,
  onViewChange,
  className,
}: SimpleDockProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        `
          relative flex items-center rounded-[28px]
          border border-black/[0.04]
          bg-black/[0.025]
          p-1
          shadow-[0_1px_2px_rgba(0,0,0,0.04)]
          backdrop-blur-xl
          dark:border-white/[0.06]
          dark:bg-white/[0.04]
        `,
        className,
      )}
      role="tablist"
      aria-label="Site sections"
    >
      <DockButton
        label="Projects"
        active={activeView === "projects"}
        onClick={() => onViewChange("projects")}
        reduceMotion={!!reduceMotion}
      >
        <Folder />
      </DockButton>

      <DockButton
        label="About"
        active={activeView === "about"}
        onClick={() => onViewChange("about")}
        reduceMotion={!!reduceMotion}
      >
        <UserRound />
      </DockButton>
    </div>
  );
}

interface DockButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  reduceMotion: boolean;
  children: React.ReactNode;
}

function DockButton({
  label,
  active,
  onClick,
  reduceMotion,
  children,
}: DockButtonProps) {
  return (
    <motion.button
      type="button"
      role="tab"
      aria-label={label}
      aria-selected={active}
      onClick={onClick}
      whileHover={reduceMotion ? undefined : { y: -1 }}
      whileTap={reduceMotion ? undefined : { scale: 0.94 }}
      transition={spring}
      className={cn(
        "relative z-10 flex size-12 items-center justify-center rounded-full",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10",
        "[&_svg]:size-[15px] [&_svg]:stroke-[1.8]",
        active
          ? "text-black dark:text-white"
          : "text-black/35 hover:text-black/60 dark:text-white/35 dark:hover:text-white/65",
      )}
    >
      {active && (
        <motion.span
          layoutId="simple-dock-active"
          transition={reduceMotion ? { duration: 0 } : spring}
          className="
            absolute inset-0 -z-10 rounded-full
            border border-black/[0.04]
            bg-white
            shadow-[0_1px_2px_rgba(0,0,0,0.05)]
            dark:border-white/[0.07]
            dark:bg-neutral-800
          "
        />
      )}

      <motion.span
        animate={{ scale: active ? 1 : 0.94 }}
        transition={reduceMotion ? { duration: 0 } : spring}
        className="flex items-center justify-center"
      >
        {children}
      </motion.span>

      <span className="sr-only">{label}</span>
    </motion.button>
  );
}

export type { View as DockView };
