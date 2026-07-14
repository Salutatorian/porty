import { BooksPageContent } from "@/components/media/BooksPageContent";
import {
  getPublishedBooks,
  getPublishedMovies,
  getPublishedPhotos,
} from "@/lib/content/media";

export default async function BooksPage() {
  const [books, movies, photos] = await Promise.all([
    getPublishedBooks(),
    getPublishedMovies(),
    getPublishedPhotos(),
  ]);
  return (
    <BooksPageContent
      books={books}
      photosCount={photos.length}
      moviesCount={movies.length}
    />
  );
}
