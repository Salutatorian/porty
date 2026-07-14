import { MoviesPageContent } from "@/components/media/MoviesPageContent";
import {
  getPublishedBooks,
  getPublishedMovies,
  getPublishedPhotos,
} from "@/lib/content/media";

export default async function MoviesPage() {
  const [books, movies, photos] = await Promise.all([
    getPublishedBooks(),
    getPublishedMovies(),
    getPublishedPhotos(),
  ]);
  return (
    <MoviesPageContent
      movies={movies}
      photosCount={photos.length}
      booksCount={books.length}
    />
  );
}
