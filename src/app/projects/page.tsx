import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { DraggableDescription } from "@/components/DraggableDescription";
import { getPublishedProjects } from "@/lib/content/projects";

export default async function ProjectsPage() {
  const projects = await getPublishedProjects();

  return (
    <main className="min-h-dvh bg-[#fdfcf9] text-black dark:bg-[#101010] dark:text-white">
      <div className="mx-auto w-full max-w-[760px] px-6 py-10 sm:px-8">
        <BackButton href="/" />

        <header className="mt-10 max-w-xl">
          <h1 className="text-[28px] font-medium tracking-[-0.02em] sm:text-[32px]">
            Projects
          </h1>
        </header>

        <ul className="mt-14 space-y-8">
          {projects.map((project) => (
            <li key={project.slug}>
              <Link
                href={`/projects/${project.slug}`}
                className="group block rounded-2xl border border-black/[0.04] bg-white/40 px-5 py-5 transition hover:border-black/[0.08] hover:bg-white/70 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.1] dark:hover:bg-white/[0.05]"
              >
                <h2 className="text-[17px] font-medium text-foreground group-hover:underline group-hover:underline-offset-4">
                  {project.title}
                </h2>

                <DraggableDescription text={project.summary} />

                <p className="mt-3 text-[13px] text-foreground/35">
                  {project.category}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
