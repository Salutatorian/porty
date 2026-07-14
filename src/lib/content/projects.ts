import type { Project } from "@/lib/projects";
import { PROJECTS } from "@/lib/projects";
import { createClient } from "@/lib/supabase/server";

type ProjectRow = {
  slug: string;
  title: string;
  category: string;
  year: string;
  summary: string;
  role: string;
  problem: string;
  process: string;
  result: string;
  image_alt: string;
  color: string;
  image_url: string | null;
  live_url: string | null;
  source_url: string | null;
  tags: string[];
};

function mapRow(row: ProjectRow): Project {
  return {
    slug: row.slug,
    title: row.title,
    category: row.category,
    year: row.year,
    summary: row.summary,
    role: row.role,
    problem: row.problem,
    process: row.process,
    result: row.result,
    imageAlt: row.image_alt,
    color: row.color,
    image: row.image_url ?? undefined,
    liveUrl: row.live_url ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    tags: row.tags,
  };
}

export async function getPublishedProjects(): Promise<Project[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("portfolio_projects")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error || !data?.length) {
      return PROJECTS;
    }

    return data.map((row) => mapRow(row as ProjectRow));
  } catch {
    return PROJECTS;
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("portfolio_projects")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    if (error || !data) {
      return PROJECTS.find((project) => project.slug === slug);
    }

    return mapRow(data as ProjectRow);
  } catch {
    return PROJECTS.find((project) => project.slug === slug);
  }
}

export async function getAllProjectsForAdmin() {
  const { getAdminDb } = await import("@/lib/admin/auth");
  const supabase = await getAdminDb();
  const { data, error } = await supabase
    .from("portfolio_projects")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as ProjectRow));
}
