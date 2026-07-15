const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type TipTapNode = {
  type?: string;
  text?: string;
  attrs?: { src?: string };
  content?: TipTapNode[];
};

export function formatBlogDate(publishedAt: string, now = new Date()) {
  const date = new Date(publishedAt);
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < ONE_WEEK_MS) {
    const days = Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
    if (days === 0) return "Today";
    if (days === 1) return "1d ago";
    return `${days}d ago`;
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  if (year === now.getFullYear()) {
    return `${month}/${day}`;
  }

  return `${month}/${day}/${year}`;
}

function nodeHasText(node: TipTapNode): boolean {
  if (node.type === "text") return Boolean(node.text?.trim());
  return (node.content ?? []).some(nodeHasText);
}

export function extractLeadImage(
  contentHtml: string,
  contentJson?: object | null,
): string | null {
  if (contentJson && typeof contentJson === "object" && "content" in contentJson) {
    const nodes = (contentJson as { content?: TipTapNode[] }).content;
    if (Array.isArray(nodes)) {
      for (const node of nodes) {
        if (node.type === "image" && node.attrs?.src) {
          return node.attrs.src;
        }

        if (node.type === "paragraph") {
          for (const child of node.content ?? []) {
            if (child.type === "image" && child.attrs?.src) {
              return child.attrs.src;
            }
            if (child.type === "text" && child.text?.trim()) {
              return null;
            }
          }
          continue;
        }

        if (nodeHasText(node)) {
          return null;
        }
      }
    }
  }

  const trimmed = contentHtml.trim();
  const match = trimmed.match(
    /^(?:\s*<p>\s*)?<img[^>]+src=["']([^"']+)["']/i,
  );
  return match?.[1] ?? null;
}

export const BLOG_AUTHOR = {
  name: "Joshua Waldo",
  initials: "JW",
} as const;
