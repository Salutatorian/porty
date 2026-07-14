import type { MovieItem } from "@/lib/media-items";

const DEFAULT_USERNAME = "joshuawaldo";
const USER_AGENT =
  "Mozilla/5.0 (compatible; GreaterEngine/1.0; +https://github.com)";

type LetterboxdRssItem = {
  title: string;
  link: string;
  cover: string;
  rating: number;
};

function extractTag(xml: string, tagName: string) {
  const open = `<${tagName}>`;
  const close = `</${tagName}>`;
  const index = xml.indexOf(open);
  if (index === -1) return null;
  const start = index + open.length;
  const end = xml.indexOf(close, start);
  if (end === -1) return null;
  return xml.slice(start, end).replace(/<!\[CDATA\[|\]\]>/g, "").trim();
}

function parseLetterboxdRating(value: string | null) {
  if (!value) return 0;
  const numeric = Number.parseFloat(value);
  if (!Number.isNaN(numeric)) return Math.min(5, Math.max(0, numeric));
  const stars = (value.match(/★/g) || []).length;
  const half = (value.match(/½/g) || []).length;
  return Math.min(5, Math.max(0, stars + half * 0.5));
}

function extractPosterFromDescription(html: string) {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : "";
}

function extractAllItems(xml: string): LetterboxdRssItem[] {
  const items: LetterboxdRssItem[] = [];
  const itemPattern = /<item>([\s\S]*?)<\/item>/gi;
  let match = itemPattern.exec(xml);

  while (match) {
    const block = match[1];
    let title =
      extractTag(block, "letterboxd:filmTitle") ||
      extractTag(block, "letterboxd-filmTitle") ||
      "";

    if (!title) {
      const rawTitle = extractTag(block, "title") || "";
      title =
        rawTitle
          .replace(/^[^:]+(?:watched|reviewed|rated)\s*/i, "")
          .replace(/\s*[★☆½]+.*$/, "")
          .trim() || rawTitle;
    }

    const link = extractTag(block, "link") || "";
    const description = extractTag(block, "description") || "";
    const cover = extractPosterFromDescription(description) || "";
    const rating = parseLetterboxdRating(
      extractTag(block, "letterboxd:memberRating") ||
        extractTag(block, "letterboxd-memberRating"),
    );

    if (title) {
      items.push({ title, link, cover, rating });
    }

    match = itemPattern.exec(xml);
  }

  return items;
}

export function getLetterboxdUsername() {
  return process.env.LETTERBOXD_USERNAME || DEFAULT_USERNAME;
}

export async function getLetterboxdMovies(): Promise<MovieItem[]> {
  const username = getLetterboxdUsername();
  const response = await fetch(
    `https://letterboxd.com/${encodeURIComponent(username)}/rss/`,
    {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 3600 },
    },
  );

  if (!response.ok) {
    throw new Error(`Letterboxd RSS failed: ${response.status}`);
  }

  const watched = extractAllItems(await response.text());

  return watched.map((item) => ({
    title: item.title,
    year: "",
    director: "",
    status: "Watched" as const,
    poster: item.cover,
  }));
}

export function isLetterboxdConfigured() {
  return Boolean(getLetterboxdUsername());
}
