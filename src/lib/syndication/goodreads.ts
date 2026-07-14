import type { BookItem } from "@/lib/media-items";

const DEFAULT_USER_ID = "199403748";
const USER_AGENT =
  "Mozilla/5.0 (compatible; GreaterEngine/1.0; +https://github.com)";

type GoodreadsShelf = "read" | "currently-reading" | "to-read";

type GoodreadsRssItem = {
  title: string;
  author: string;
  cover: string;
  link: string;
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

function extractAllItems(xml: string): GoodreadsRssItem[] {
  const items: GoodreadsRssItem[] = [];
  const itemPattern = /<item>([\s\S]*?)<\/item>/gi;
  let match = itemPattern.exec(xml);

  while (match) {
    const block = match[1];
    const title =
      extractTag(block, "book_title") || extractTag(block, "title") || "";
    const author = extractTag(block, "author_name") || "";
    const cover =
      extractTag(block, "book_large_image_url") ||
      extractTag(block, "book_medium_image_url") ||
      extractTag(block, "book_small_image_url") ||
      extractTag(block, "book_image_url") ||
      "";
    const link = extractTag(block, "link") || "";
    const rating = Math.min(
      5,
      Math.max(0, Number.parseInt(extractTag(block, "user_rating") || "0", 10) || 0),
    );

    if (title) {
      items.push({ title, author, cover, link, rating });
    }

    match = itemPattern.exec(xml);
  }

  return items;
}

async function fetchShelf(userId: string, shelf: GoodreadsShelf) {
  const params = new URLSearchParams({ shelf });
  if (shelf === "currently-reading") params.set("sort", "position");

  const response = await fetch(
    `https://www.goodreads.com/review/list_rss/${userId}?${params}`,
    {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 3600 },
    },
  );

  if (!response.ok) {
    throw new Error(`Goodreads RSS failed: ${response.status}`);
  }

  return extractAllItems(await response.text());
}

function shelfToStatus(shelf: GoodreadsShelf): BookItem["status"] {
  if (shelf === "currently-reading") return "Currently reading";
  if (shelf === "to-read") return "Want to read";
  return "Read";
}

export function getGoodreadsUserId() {
  return process.env.GOODREADS_USER_ID || DEFAULT_USER_ID;
}

export async function getGoodreadsShelves() {
  const userId = getGoodreadsUserId();
  const [read, currentlyReading, toRead] = await Promise.all([
    fetchShelf(userId, "read"),
    fetchShelf(userId, "currently-reading"),
    fetchShelf(userId, "to-read"),
  ]);

  return { read, currentlyReading, toRead };
}

export async function getGoodreadsBooks(): Promise<BookItem[]> {
  const { read, currentlyReading, toRead } = await getGoodreadsShelves();
  const books: BookItem[] = [];

  for (const item of currentlyReading) {
    books.push({
      title: item.title,
      author: item.author || "Unknown author",
      status: shelfToStatus("currently-reading"),
      cover: item.cover,
    });
  }

  for (const item of toRead) {
    books.push({
      title: item.title,
      author: item.author || "Unknown author",
      status: shelfToStatus("to-read"),
      cover: item.cover,
    });
  }

  for (const item of read) {
    books.push({
      title: item.title,
      author: item.author || "Unknown author",
      status: shelfToStatus("read"),
      cover: item.cover,
    });
  }

  return books;
}

export function isGoodreadsConfigured() {
  return Boolean(getGoodreadsUserId());
}
