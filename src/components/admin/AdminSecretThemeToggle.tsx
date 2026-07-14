"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

const HOLD_MS = 1200;

export function AdminSecretThemeToggle() {
  const router = useRouter();
  const holdTimer = React.useRef<number | null>(null);

  const clearHold = () => {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const onPointerDown = () => {
    clearHold();
    holdTimer.current = window.setTimeout(() => {
      router.push("/admin");
    }, HOLD_MS);
  };

  return (
    <div onPointerDown={onPointerDown} onPointerUp={clearHold} onPointerLeave={clearHold}>
      <ThemeToggle />
    </div>
  );
}
