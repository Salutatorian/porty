import { getAdminDb, requireAdmin } from "@/lib/admin/auth";

export type AdminDashboardStats = {
  projects: number;
  photos: number;
  blogPosts: number;
};

export type AdminActivityItem = {
  id: string;
  title: string;
  type: string;
  updatedAt: string;
  status: string;
};

export async function getAdminDashboardData(): Promise<{
  stats: AdminDashboardStats;
  activity: AdminActivityItem[];
}> {
  await requireAdmin();
  const supabase = await getAdminDb();

  const [{ count: projects }, { count: photos }, { count: blogs }] =
    await Promise.all([
      supabase
        .from("portfolio_projects")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("portfolio_photos")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("portfolio_blogs")
        .select("*", { count: "exact", head: true }),
    ]);

  const { data: recentProjects } = await supabase
    .from("portfolio_projects")
    .select("slug, title, published, updated_at")
    .order("updated_at", { ascending: false })
    .limit(3);

  const { data: recentBlogs } = await supabase
    .from("portfolio_blogs")
    .select("slug, title, status, updated_at")
    .order("updated_at", { ascending: false })
    .limit(3);

  const activity: AdminActivityItem[] = [
    ...(recentProjects ?? []).map((row) => ({
      id: `project-${row.slug}`,
      title: row.title,
      type: "Project",
      updatedAt: row.updated_at,
      status: row.published ? "Published" : "Draft",
    })),
    ...(recentBlogs ?? []).map((row) => ({
      id: `blog-${row.slug}`,
      title: row.title,
      type: "Blog",
      updatedAt: row.updated_at,
      status: row.status === "published" ? "Published" : "Draft",
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 6);

  return {
    stats: {
      projects: projects ?? 0,
      photos: photos ?? 0,
      blogPosts: blogs ?? 0,
    },
    activity,
  };
}
