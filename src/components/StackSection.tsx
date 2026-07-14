"use client";

const STACK = [
  "TypeScript",
  "JavaScript",
  "React",
  "Next.js",
  "Vue",
  "Astro",
  "Tailwind CSS",
  "shadcn/ui",
  "Motion",
  "Redux",
  "Node.js",
  "Express",
  "Bun",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Prisma",
  "Supabase",
  "Tiptap",
  "Git",
  "GitHub",
  "Figma",
];

export function StackSection() {
  return (
    <section className="mt-14 w-full">
      <p className="mb-4 text-[12px] uppercase tracking-[0.18em] text-foreground/40">
        Stack
      </p>

      <div
        className="
          relative w-full overflow-hidden
          [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]
          [-webkit-mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]
        "
      >
        <div
          className="
            stack-marquee flex w-max
            hover:[animation-play-state:paused]
            motion-reduce:animate-none
          "
        >
          {[0, 1].map((copy) => (
            <div
              key={copy}
              aria-hidden={copy === 1}
              className="flex shrink-0 items-center gap-2 pr-2"
            >
              {STACK.map((item) => (
                <span
                  key={`${copy}-${item}`}
                  className="
                    inline-flex shrink-0 items-center justify-center
                    rounded-full border border-foreground/10
                    px-4 py-2 leading-none
                    text-[13px] font-medium
                    text-foreground/55
                    transition-colors duration-150
                    hover:border-foreground/20
                    hover:bg-foreground/[0.06]
                    hover:text-foreground
                  "
                >
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
