import { createClient } from "@/lib/supabase/server";

export type BlogPost = {
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  contentHtml: string;
  publishedAt?: string;
};

type BlogRow = {
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  content_html: string;
  published_at: string | null;
};

function mapBlog(row: BlogRow): BlogPost {
  return {
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    excerpt: row.excerpt ?? undefined,
    contentHtml: row.content_html,
    publishedAt: row.published_at ?? undefined,
  };
}

export async function getPublishedBlogs(): Promise<BlogPost[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("portfolio_blogs")
      .select("slug, title, subtitle, excerpt, content_html, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error || !data?.length) return [];
    return data.map((row) => mapBlog(row as BlogRow));
  } catch {
    return [];
  }
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("portfolio_blogs")
      .select("slug, title, subtitle, excerpt, content_html, published_at")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error || !data) return null;
    return mapBlog(data as BlogRow);
  } catch {
    return null;
  }
}

export async function getAllBlogsForAdmin() {
  const { getAdminDb } = await import("@/lib/admin/auth");
  const supabase = await getAdminDb();
  const { data, error } = await supabase
    .from("portfolio_blogs")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
