"use client";

import { Availability } from "@/components/Availability";
import { FastScrambleText } from "@/components/FastScrambleText";
import { ShimmeringText } from "@/components/unlumen-ui/shimmering-text";

export function PortfolioIntro() {
  return (
    <div className="mx-auto max-w-[560px] text-center">
      <p className="text-[15px]">
        <ShimmeringText
          text="Dear Visitor,"
          duration={2.5}
          repeatDelay={0.75}
          className="font-semibold [--base-color:var(--foreground)] [--shimmer-color:#38bdf8] dark:[--base-color:#ffffff]"
        />
      </p>

      <p className="mx-auto mt-7 max-w-[500px] text-[15px] leading-[1.6] text-foreground/50">
        <FastScrambleText
          text="I'm Joshua, a software engineer based in the Northern Mariana Islands. I build thoughtful digital products, useful tools, and personal projects across software, design, and data."
          delay={150}
          duration={900}
          block
          className="text-foreground/50"
          scrambledClassName="text-foreground/15"
        />
      </p>

      <Availability />    </div>
  );
}
