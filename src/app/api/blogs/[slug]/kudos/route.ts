import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getOrCreateVisitorId,
  getRequestIp,
  hashIpAddress,
  hashVisitorKey,
} from "@/lib/blog-visitor";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

async function getPublishedBlog(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("portfolio_blogs")
    .select("id")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  return data;
}

async function getKudosState(blogId: string, visitorId: string) {
  const supabase = await createClient();
  const visitorKey = hashVisitorKey(visitorId, blogId);

  const [{ count }, { data: existing }] = await Promise.all([
    supabase
      .from("portfolio_blog_likes")
      .select("*", { count: "exact", head: true })
      .eq("blog_id", blogId),
    supabase
      .from("portfolio_blog_likes")
      .select("id")
      .eq("blog_id", blogId)
      .eq("visitor_key", visitorKey)
      .maybeSingle(),
  ]);

  return {
    count: count ?? 0,
    liked: Boolean(existing),
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const blog = await getPublishedBlog(slug);
  if (!blog) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const visitorId = await getOrCreateVisitorId();
  const state = await getKudosState(blog.id, visitorId);

  return NextResponse.json(state);
}

export async function POST(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const blog = await getPublishedBlog(slug);
  if (!blog) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const visitorId = await getOrCreateVisitorId();
  const visitorKey = hashVisitorKey(visitorId, blog.id);
  const ipHash = hashIpAddress(getRequestIp(request));
  const current = await getKudosState(blog.id, visitorId);

  if (current.liked) {
    return NextResponse.json({
      count: current.count,
      liked: true,
    });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("portfolio_blog_likes").insert({
    blog_id: blog.id,
    visitor_key: visitorKey,
    ip_hash: ipHash,
  });

  if (error) {
    if (error.code === "23505") {
      const state = await getKudosState(blog.id, visitorId);
      return NextResponse.json({
        count: state.count,
        liked: true,
      });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    count: current.count + 1,
    liked: true,
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const blog = await getPublishedBlog(slug);
  if (!blog) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const visitorId = await getOrCreateVisitorId();
  const visitorKey = hashVisitorKey(visitorId, blog.id);
  const current = await getKudosState(blog.id, visitorId);

  if (!current.liked) {
    return NextResponse.json({
      count: current.count,
      liked: false,
    });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("portfolio_blog_likes")
    .delete()
    .eq("blog_id", blog.id)
    .eq("visitor_key", visitorKey);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    count: Math.max(0, current.count - 1),
    liked: false,
  });
}
