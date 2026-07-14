import { FolderKanbanIcon } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { ProjectAdminForm } from "@/components/admin/ProjectAdminForm";
import { getAllProjectsForAdmin } from "@/lib/content/projects";

export default async function AdminProjectsPage() {
  let projects: Awaited<ReturnType<typeof getAllProjectsForAdmin>> = [];

  try {
    projects = await getAllProjectsForAdmin();
  } catch {
    projects = [];
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_260px]">
      <div>
        <AdminPageHeader
          title="Projects"
          description="Import projects from links and manage published portfolio entries."
        />
        <ProjectAdminForm />
      </div>
      <aside className="rounded-[12px] border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#161616]">
        <h2 className="text-[12px] font-medium tracking-wide text-neutral-500 uppercase">
          Saved
        </h2>
        {projects.length === 0 ? (
          <AdminEmptyState
            title="No projects yet"
            description="Import a project from a link to see it listed here."
            icon={<FolderKanbanIcon />}
            className="mt-3 border-none bg-transparent p-0"
          />
        ) : (
          <ul className="mt-3 space-y-2 text-[12px] text-neutral-600 dark:text-neutral-400">
            {projects.map((project) => (
              <li key={project.slug} className="truncate">
                {project.title}
                {project.slug ? ` · /${project.slug}` : ""}
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
