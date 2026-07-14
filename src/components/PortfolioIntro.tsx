"use client";

import { Availability } from "@/components/Availability";
import { FastScrambleText } from "@/components/FastScrambleText";
export function PortfolioIntro() {
  return (
    <div className="mx-auto max-w-[560px] text-center">
      <p className="text-[15px]">
        <FastScrambleText
          text="Dear Visitor,"
          duration={400}
          className="font-semibold text-foreground"
          scrambledClassName="font-semibold text-foreground/20"
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
