"use client";

import * as React from "react";
import { motion, type TargetAndTransition, type Transition } from "framer-motion";
import { cn } from "@/lib/utils";

export type GlowMode =
  | "rotate"
  | "pulse"
  | "breathe"
  | "colorShift"
  | "flowHorizontal"
  | "static";

export type GlowBlur =
  | number
  | "softest"
  | "soft"
  | "medium"
  | "strong"
  | "stronger"
  | "strongest"
  | "none";

const BLUR_PRESETS: Record<string, string> = {
  softest: "blur-xs",
  soft: "blur-sm",
  medium: "blur-md",
  strong: "blur-lg",
  stronger: "blur-xl",
  strongest: "blur-2xl",
  none: "blur-none",
};

function blurClass(blur: GlowBlur) {
  if (typeof blur === "number") return `blur-[${blur}px]`;
  return BLUR_PRESETS[blur] ?? "blur-md";
}

export interface GlowEffectLayerProps {
  colors?: string[];
  mode?: GlowMode;
  blur?: GlowBlur;
  scale?: number;
  duration?: number;
  transition?: Transition;
  className?: string;
}

export function GlowEffectLayer({
  colors = ["#FF5733", "#33FF57", "#3357FF", "#F1C40F"],
  mode = "rotate",
  blur = "strong",
  scale = 1,
  duration = 5,
  transition,
  className,
}: GlowEffectLayerProps) {
  const base: Transition = { repeat: Infinity, duration, ease: "linear" };

  const animations: Record<GlowMode, TargetAndTransition> = {
    rotate: {
      background: [
        `conic-gradient(from 0deg at 50% 50%, ${colors.join(", ")})`,
        `conic-gradient(from 360deg at 50% 50%, ${colors.join(", ")})`,
      ],
      transition: transition ?? base,
    },
    pulse: {
      background: colors.map(
        (color) =>
          `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 100%)`,
      ),
      scale: [scale, scale * 1.1, scale],
      opacity: [0.5, 0.8, 0.5],
      transition: transition ?? { ...base, repeatType: "mirror" },
    },
    breathe: {
      background: colors.map(
        (color) =>
          `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 100%)`,
      ),
      scale: [scale, scale * 1.05, scale],
      transition: transition ?? { ...base, repeatType: "mirror" },
    },
    colorShift: {
      background: colors.map((color, index) => {
        const next = colors[(index + 1) % colors.length];
        return `conic-gradient(from 0deg at 50% 50%, ${color} 0%, ${next} 50%, ${color} 100%)`;
      }),
      transition: transition ?? { ...base, repeatType: "mirror" },
    },
    flowHorizontal: {
      background: colors.map((color, index) => {
        const next = colors[(index + 1) % colors.length];
        return `linear-gradient(to right, ${color}, ${next})`;
      }),
      transition: transition ?? { ...base, repeatType: "mirror" },
    },
    static: {
      background: `linear-gradient(to right, ${colors.join(", ")})`,
    },
  };

  return (
    <motion.div
      animate={animations[mode]}
      style={
        { "--scale": scale, willChange: "transform" } as React.CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full",
        "scale-[var(--scale)] transform-gpu",
        blurClass(blur),
        className,
      )}
    />
  );
}

export interface GlowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  mode?: GlowMode;
  colors?: string[];
  blur?: GlowBlur;
  duration?: number;
  glowScale?: number;
  wrapperClassName?: string;
}

export function GlowButton({
  mode = "rotate",
  colors = ["#FF5733", "#33FF57", "#3357FF", "#F1C40F"],
  blur = "strong",
  duration = 5,
  glowScale = 1,
  children,
  className,
  wrapperClassName,
  disabled,
  ...props
}: GlowButtonProps) {
  return (
    <motion.div
      className={cn(
        "relative isolate inline-flex",
        disabled && "pointer-events-none opacity-50",
        wrapperClassName,
      )}
      whileHover={disabled ? undefined : "hovered"}
      initial="idle"
    >
      <motion.div
        className="pointer-events-none absolute -inset-x-1 top-0.5 -bottom-1 -z-10"
        variants={{
          idle: { scale: glowScale },
          hovered: { scale: glowScale * 1.05 },
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
        }}
      >
        <GlowEffectLayer
          colors={colors}
          mode={mode}
          blur={blur}
          duration={duration}
          scale={1}
        />
      </motion.div>
      <button
        type="button"
        disabled={disabled}
        className={cn("relative z-10", className)}
        {...props}
      >
        {children}
      </button>
    </motion.div>
  );
}
