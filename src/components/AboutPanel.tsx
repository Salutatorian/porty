"use client";

import { StackSection } from "@/components/StackSection";

const EXPERIENCE: {
  title: string;
  href?: string;
  detail: string;
  period: string;
}[] = [
  {
    title: "AfterQuery",
    href: "https://www.afterquery.com/",
    detail: "Expert · Full Stack Software Engineer",
    period: "April 2026 – Present",
  },
  {
    title: "Northern Marianas College",
    href: "https://www.marianas.edu/",
    detail: "IT Aide",
    period: "September 2024 – January 2026",
  },
];

export function AboutPanel() {
  return (
    <div className="max-w-xl">
      <div className="flex flex-col gap-10 sm:flex-row sm:items-start">
        <div
          className="h-28 w-28 shrink-0 rounded-2xl border border-black/[0.05] bg-[#ece8e2] dark:border-white/[0.08] dark:bg-[#242424]"
          aria-hidden
        />
        <div>
          <p className="text-[14px] leading-[1.75] text-[#5c5c5c] dark:text-[#a3a3a3]">
            I build practical tools, creative interfaces, and AI-assisted
            projects based in Northern Mariana Islands. My work sits between
            software, design, and writing — always aiming for clarity over
            noise.
          </p>
          <p className="mt-4 text-[14px] leading-[1.75] text-[#5c5c5c] dark:text-[#a3a3a3]">
            I care about thoughtful interaction, readable systems, and projects
            that feel personal without feeling unfinished.
          </p>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-[12px] uppercase tracking-[0.14em] text-[#9a9a9a] dark:text-[#666]">
          Experience
        </h2>
        <ul className="mt-4 space-y-4">
          {EXPERIENCE.map((item) => (
            <li key={item.title}>
              <p className="text-[14px] font-medium text-[#1a1a1a] dark:text-[#ededed]">
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-[#d0d0d0] underline-offset-[3px] transition hover:decoration-[#1a1a1a] dark:decoration-[#404040] dark:hover:decoration-[#ededed]"
                  >
                    {item.title}
                  </a>
                ) : (
                  item.title
                )}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-[#8a8a8a] dark:text-[#737373]">
                {item.detail}
              </p>
              <p className="mt-0.5 text-[12px] text-[#9a9a9a] dark:text-[#666]">
                {item.period}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <StackSection />
    </div>
  );
}
