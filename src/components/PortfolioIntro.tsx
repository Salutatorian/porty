"use client";

import { Availability } from "@/components/Availability";
import { FastScrambleText } from "@/components/FastScrambleText";
import { ShimmeringText } from "@/components/unlumen-ui/shimmering-text";

export function PortfolioIntro() {
  return (
    <div className="mx-auto max-w-5xl text-center">
      <p className="text-[35px] leading-[1.2]">
        <ShimmeringText
          text="Dear Visitor,"
          duration={2.5}
          repeatDelay={0.75}
          spread={2.5}
          shimmerColor="#0ea5e9"
          className="font-semibold [--base-color:var(--foreground)] dark:[--base-color:#ffffff]"
        />
      </p>

      <p className="mx-auto mt-8 max-w-3xl text-[35px] leading-[1.5] text-foreground/50">
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
