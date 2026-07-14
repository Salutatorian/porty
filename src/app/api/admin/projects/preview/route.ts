import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin/auth";
import { slugify } from "@/lib/slugify";

function extractMeta(html: string, property: string) {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return undefined;
}

function extractTitle(html: string) {
  return (
    extractMeta(html, "og:title") ??
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim()
  );
}

async function fetchGithubRepo(url: string) {
  const match = url.match(/github\.com\/([^/]+)\/([^/?#]+)/i);
  if (!match) return null;

  const [, owner, repo] = match;
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { Accept: "application/vnd.github+json" },
    next: { revalidate: 0 },
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    name: string;
    description: string | null;
    html_url: string;
    homepage: string | null;
    topics?: string[];
    language?: string | null;
  };

  return {
    title: data.name,
    summary: data.description ?? "",
    sourceUrl: data.html_url,
    liveUrl: data.homepage || undefined,
    tags: [
      ...(data.topics ?? []),
      ...(data.language ? [data.language] : []),
    ].slice(0, 6),
    category: data.language ? `${data.language} · GitHub` : "GitHub",
  };
}

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { url?: string };
  const url = body.url?.trim();

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const github = await fetchGithubRepo(url);
    if (github) {
      return NextResponse.json({
        slug: slugify(github.title),
        title: github.title,
        summary: github.summary,
        sourceUrl: github.sourceUrl,
        liveUrl: github.liveUrl,
        tags: github.tags,
        category: github.category,
        year: String(new Date().getFullYear()),
        role: "Design & development",
        problem:
          "Describe the problem this project solves — imported from GitHub metadata.",
        process:
          "Outline your approach, stack, and key implementation decisions.",
        result: "Summarize the outcome, impact, or what shipped.",
        imageAlt: `${github.title} preview`,
        color: "#e8e6e1",
      });
    }

    const response = await fetch(url, {
      headers: { "User-Agent": "PortfolioBot/1.0" },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Could not fetch that URL" },
        { status: 400 },
      );
    }

    const html = await response.text();
    const title = extractTitle(html) ?? "Untitled project";
    const summary =
      extractMeta(html, "og:description") ??
      extractMeta(html, "description") ??
      "";
    const image = extractMeta(html, "og:image");

    return NextResponse.json({
      slug: slugify(title),
      title,
      summary,
      liveUrl: url,
      sourceUrl: url,
      imageUrl: image,
      tags: [],
      category: "Project",
      year: String(new Date().getFullYear()),
      role: "Design & development",
      problem: summary || "Describe the core problem.",
      process: "How you explored, built, and iterated.",
      result: "What changed after shipping.",
      imageAlt: title,
      color: "#e8e6e1",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to preview that link" },
      { status: 500 },
    );
  }
}
