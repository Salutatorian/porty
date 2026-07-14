import { MediaCatalogPageContent } from "@/components/media/MediaCatalogPageContent";
import type { BookItem } from "@/lib/media-items";

type BooksPageContentProps = {
  books: BookItem[];
  photosCount: number;
  moviesCount: number;
};

export function BooksPageContent({
  books,
  photosCount,
  moviesCount,
}: BooksPageContentProps) {
  return (
    <MediaCatalogPageContent
      title="Books"
      count={books.length}
      activeCollection="books"
      photosCount={photosCount}
      booksCount={books.length}
      moviesCount={moviesCount}
      coverWidthClass="w-[108px] sm:w-[120px] md:w-[132px]"
      items={books.map((book) => ({
        id: book.title,
        image: book.cover,
        title: book.title,
        meta: `${book.author} · ${book.status}`,
      }))}
    />
  );
}
