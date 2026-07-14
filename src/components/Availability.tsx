"use client";

import { ArrowRight } from "lucide-react";
import { GlowButton } from "@/components/unlumen-ui/glow";

export function Availability() {
  const openEmail = () => {
    window.location.href =
      "mailto:contactjoshuawaldo@gmail.com?subject=Software%20Engineering%20Opportunity";
  };

  return (
    <div className="mt-7 flex flex-col items-center">
      <p className="text-[15px] text-foreground/50">
        Available for select software engineering opportunities.
      </p>

      <div className="mt-7 pt-1">
        <GlowButton
          mode="rotate"
          blur="strong"
          duration={5}
          glowScale={1.08}
          colors={["#60A5FA", "#A78BFA", "#F59E0B", "#84CC16"]}
          onClick={openEmail}
          className="
            inline-flex h-9 items-center gap-1.5 rounded-[10px]
            border-0 bg-[#f5f5f4] px-4
            text-[12px] font-medium text-black
            shadow-none transition-colors
            hover:bg-white
            [&_svg]:size-3.5
          "
        >
          Get in touch
          <ArrowRight />
        </GlowButton>
      </div>
    </div>
  );
}
