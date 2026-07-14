import { MediaCatalogPageContent } from "@/components/media/MediaCatalogPageContent";
import type { MovieItem } from "@/lib/media-items";

type MoviesPageContentProps = {
  movies: MovieItem[];
  photosCount: number;
  booksCount: number;
};

export function MoviesPageContent({
  movies,
  photosCount,
  booksCount,
}: MoviesPageContentProps) {
  return (
    <MediaCatalogPageContent
      title="Movies"
      count={movies.length}
      activeCollection="movies"
      photosCount={photosCount}
      booksCount={booksCount}
      moviesCount={movies.length}
      coverWidthClass="w-[132px] sm:w-[148px] md:w-[164px]"
      rowGapClass="gap-3.5"
      items={movies.map((movie) => ({
        id: movie.title,
        image: movie.poster,
        title: movie.title,
        meta: `${movie.year} · ${movie.status}`,
      }))}
    />
  );
}
