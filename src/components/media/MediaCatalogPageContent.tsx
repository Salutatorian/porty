"use client";

import { BackButton } from "@/components/BackButton";
import { MediaCollectionsNav } from "@/components/media/MediaCollectionsNav";
import { MediaHorizontalRow } from "@/components/media/MediaHorizontalRow";
import { MediaListItem } from "@/components/media/MediaListItem";
import { cn } from "@/lib/utils";

type CatalogItem = {
  id: string;
  image: string;
  title: string;
  meta: string;
};

type MediaCatalogPageContentProps = {
  title: string;
  count: number;
  activeCollection: "books" | "movies";
  photosCount: number;
  booksCount: number;
  moviesCount: number;
  items: CatalogItem[];
  coverWidthClass?: string;
  rowGapClass?: string;
};

export function MediaCatalogPageContent({
  title,
  count,
  activeCollection,
  photosCount,
  booksCount,
  moviesCount,
  items,
  coverWidthClass = "w-[108px] sm:w-[120px] md:w-[128px]",
  rowGapClass = "gap-3",
}: MediaCatalogPageContentProps) {
  return (
    <main className="min-h-dvh bg-[#fdfcf9] text-foreground dark:bg-[#101010] dark:text-white">
      <div className="mx-auto w-full max-w-[1380px] px-5 pb-28 pt-10 sm:px-8 lg:px-12">
        <BackButton href="/media" />

        <header className="mt-10 flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <span className="shrink-0 text-[13px] tabular-nums text-foreground/35">
            {count}
          </span>
        </header>

        <MediaCollectionsNav
          active={activeCollection}
          photosCount={photosCount}
          booksCount={booksCount}
          moviesCount={moviesCount}
        />

        <MediaHorizontalRow className={cn("mt-6 px-0", rowGapClass)}>
          {items.map((item) => (
            <MediaListItem
              key={item.id}
              image={item.image}
              alt={item.title}
              title={item.title}
              meta={item.meta}
              aspectRatio="2/3"
              widthClass={coverWidthClass}
            />
          ))}
        </MediaHorizontalRow>
      </div>
    </main>
  );
}
