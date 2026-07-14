import Link from "next/link";
import { BOOKS, MOVIES, PHOTOS } from "@/lib/media-items";
import { cn } from "@/lib/utils";

type MediaCollection = "photos" | "books" | "movies";

type MediaCollectionsNavProps = {
  active?: MediaCollection;
  photosCount?: number;
  booksCount?: number;
  moviesCount?: number;
  className?: string;
};

const items = [
  { key: "photos" as const, href: "/media", label: "Photos" },
  { key: "books" as const, href: "/media/books", label: "Books" },
  { key: "movies" as const, href: "/media/movies", label: "Movies" },
];

export function MediaCollectionsNav({
  active,
  photosCount = PHOTOS.length,
  booksCount = BOOKS.length,
  moviesCount = MOVIES.length,
  className,
}: MediaCollectionsNavProps) {
  const counts = {
    photos: photosCount,
    books: booksCount,
    movies: moviesCount,
  };

  return (
    <nav
      aria-label="Media collections"
      className={cn(
        "mt-6 inline-flex rounded-lg border border-foreground/15 bg-foreground/[0.03] p-1",
        className,
      )}
    >
      {items.map((item) => {
        const isActive = active === item.key;

        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors",
              isActive
                ? "bg-foreground text-background"
                : "text-foreground/55 hover:text-foreground/85",
            )}
          >
            {item.label}
            <span
              className={cn(
                "tabular-nums",
                isActive ? "opacity-60" : "opacity-40",
              )}
            >
              {counts[item.key]}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
