import Image from "next/image";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { getProjectBySlug, getPublishedProjects } from "@/lib/content/projects";
import { PROJECTS } from "@/lib/projects";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const projects = await getPublishedProjects();
  const slugs = projects.length > 0 ? projects : PROJECTS;
  return slugs.map((project) => ({ slug: project.slug }));
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  return (
    <main className="min-h-dvh bg-[#fdfcf9] text-black dark:bg-[#101010] dark:text-white">
      <div className="mx-auto w-full max-w-[760px] px-6 py-10 sm:px-8">
        <BackButton href="/" />

        <header className="mt-10">
          <h1 className="text-[28px] font-medium tracking-[-0.02em] text-[#1a1a1a] dark:text-[#ededed] sm:text-[32px]">
            {project.title}
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#5c5c5c] dark:text-[#a3a3a3]">
            {project.summary}
          </p>
          <p className="mt-4 text-[13px] text-[#8a8a8a] dark:text-[#737373]">
            {project.role}
          </p>
        </header>

        <div
          className="relative mt-12 aspect-[16/10] overflow-hidden rounded-[24px] border border-black/[0.04] bg-black/[0.025] dark:border-white/[0.06] dark:bg-white/[0.045]"
          style={{ backgroundColor: project.image ? undefined : project.color }}
        >
          {project.image ? (
            <Image
              src={project.image}
              alt={project.imageAlt}
              fill
              className="object-cover"
              priority
              unoptimized={project.image.startsWith("http")}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="rounded-2xl border border-black/[0.05] bg-white/55 px-6 py-4 text-[12px] uppercase tracking-[0.16em] text-[#8a8a8a] dark:border-white/[0.08] dark:bg-black/20">
                {project.title}
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 space-y-10">
          <section>
            <h2 className="text-[12px] uppercase tracking-[0.14em] text-[#9a9a9a] dark:text-[#666]">
              Problem
            </h2>
            <p className="mt-3 text-[14px] leading-[1.75] text-[#5c5c5c] dark:text-[#a3a3a3]">
              {project.problem}
            </p>
          </section>
          <section>
            <h2 className="text-[12px] uppercase tracking-[0.14em] text-[#9a9a9a] dark:text-[#666]">
              Process
            </h2>
            <p className="mt-3 text-[14px] leading-[1.75] text-[#5c5c5c] dark:text-[#a3a3a3]">
              {project.process}
            </p>
          </section>
          <section>
            <h2 className="text-[12px] uppercase tracking-[0.14em] text-[#9a9a9a] dark:text-[#666]">
              Result
            </h2>
            <p className="mt-3 text-[14px] leading-[1.75] text-[#5c5c5c] dark:text-[#a3a3a3]">
              {project.result}
            </p>
          </section>
        </div>

        {(project.liveUrl || project.sourceUrl) ? (
          <ButtonGroup className="mt-12">
            {project.liveUrl ? (
              <Button variant="outline" asChild>
                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                  Live project
                </a>
              </Button>
            ) : null}
            {project.sourceUrl ? (
              <Button variant="outline" asChild>
                <a href={project.sourceUrl} target="_blank" rel="noopener noreferrer">
                  Source code
                </a>
              </Button>
            ) : null}
          </ButtonGroup>
        ) : null}
      </div>
    </main>
  );
}
