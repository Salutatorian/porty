import { createClient } from "@/lib/supabase/server";
import { extractLeadImage } from "@/lib/blog-utils";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  contentHtml: string;
  contentJson?: object;
  publishedAt?: string;
  isFeatured: boolean;
  leadImage?: string;
  kudosCount: number;
};

export type AdminBlogPost = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  contentJson: object;
  contentHtml: string;
  status: "draft" | "published";
  isFeatured: boolean;
  publishedAt?: string;
  updatedAt: string;
};

type BlogRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  content_html: string;
  content_json?: object | null;
  published_at: string | null;
  is_featured?: boolean | null;
  status?: string;
  updated_at?: string;
};

async function getKudosCountsByBlogId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  blogIds: string[],
) {
  const counts = new Map<string, number>();
  if (blogIds.length === 0) return counts;

  const { data } = await supabase
    .from("portfolio_blog_likes")
    .select("blog_id")
    .in("blog_id", blogIds);

  for (const row of data ?? []) {
    counts.set(row.blog_id, (counts.get(row.blog_id) ?? 0) + 1);
  }

  return counts;
}

function mapBlog(row: BlogRow, kudosCount = 0): BlogPost {
  const contentJson = row.content_json ?? undefined;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    excerpt: row.excerpt ?? undefined,
    contentHtml: row.content_html,
    contentJson,
    publishedAt: row.published_at ?? undefined,
    isFeatured: Boolean(row.is_featured),
    leadImage: extractLeadImage(row.content_html, contentJson) ?? undefined,
    kudosCount,
  };
}

function mapAdminBlog(row: BlogRow): AdminBlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    excerpt: row.excerpt ?? undefined,
    contentJson: row.content_json ?? {},
    contentHtml: row.content_html,
    status: (row.status as "draft" | "published") ?? "draft",
    isFeatured: Boolean(row.is_featured),
    publishedAt: row.published_at ?? undefined,
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

export async function getPublishedBlogs(): Promise<BlogPost[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("portfolio_blogs")
      .select(
        "id, slug, title, subtitle, excerpt, content_html, content_json, published_at, is_featured",
      )
      .eq("status", "published")
      .order("is_featured", { ascending: false })
      .order("published_at", { ascending: false });

    if (error || !data?.length) return [];

    const kudosCounts = await getKudosCountsByBlogId(
      supabase,
      data.map((row) => row.id),
    );

    return data.map((row) =>
      mapBlog(row as BlogRow, kudosCounts.get(row.id) ?? 0),
    );
  } catch {
    return [];
  }
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("portfolio_blogs")
      .select(
        "id, slug, title, subtitle, excerpt, content_html, content_json, published_at, is_featured",
      )
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error || !data) return null;

    const kudosCounts = await getKudosCountsByBlogId(supabase, [data.id]);
    return mapBlog(data as BlogRow, kudosCounts.get(data.id) ?? 0);
  } catch {
    return null;
  }
}

export async function getAllBlogsForAdmin(): Promise<AdminBlogPost[]> {
  const { getAdminDb } = await import("@/lib/admin/auth");
  const supabase = await getAdminDb();
  const { data, error } = await supabase
    .from("portfolio_blogs")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapAdminBlog(row as BlogRow));
}
