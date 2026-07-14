"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

type ViewTransitionDocument = Document & {
  startViewTransition?: (
    callback: () => void | Promise<void>,
  ) => {
    ready: Promise<void>;
    finished: Promise<void>;
    updateCallbackDone: Promise<void>;
  };
};

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = async () => {
    const button = buttonRef.current;
    if (!button) return;

    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const doc = document as ViewTransitionDocument;

    if (!doc.startViewTransition || prefersReducedMotion) {
      setTheme(nextTheme);
      return;
    }

    const transition = doc.startViewTransition(() => {
      flushSync(() => {
        setTheme(nextTheme);
      });
    });

    await transition.ready;

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 550,
        easing: "cubic-bezier(0.76, 0, 0.24, 1)",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  };

  if (!mounted) {
    return (
      <div
        aria-hidden
        className="size-12 rounded-full border border-black/[0.04] bg-white"
      />
    );
  }

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      aria-label={
        resolvedTheme === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      onClick={toggleTheme}
      whileHover={{ y: -1, scale: 1.03 }}
      whileTap={{ scale: 0.94 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 34,
        mass: 0.7,
      }}
      className={cn(
        "relative flex size-12 items-center justify-center rounded-full",
        "border border-black/[0.04] bg-white text-black/70",
        "shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10",
        "dark:border-white/[0.08] dark:bg-neutral-900 dark:text-white/70",
        className,
      )}
    >
      <motion.span
        key={resolvedTheme}
        initial={{ opacity: 0, rotate: -35, scale: 0.65 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
        className="flex items-center justify-center"
      >
        {resolvedTheme === "dark" ? (
          <Sun className="size-[15px]" strokeWidth={1.8} />
        ) : (
          <Moon className="size-[15px]" strokeWidth={1.8} />
        )}
      </motion.span>
    </motion.button>
  );
}
