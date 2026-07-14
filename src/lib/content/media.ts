import type { PhotoItem, BookItem, MovieItem } from "@/lib/media-items";
import { BOOKS, MOVIES, PHOTOS } from "@/lib/media-items";
import { createClient } from "@/lib/supabase/server";

type PhotoRow = {
  id: string;
  title: string;
  location: string;
  year: string;
  image_url: string;
  date_taken: string | null;
  location_detail: string | null;
  camera: string | null;
  description: string | null;
  collection: string | null;
};

function mapPhoto(row: PhotoRow): PhotoItem {
  return {
    id: row.id,
    title: row.title,
    location: row.location,
    year: row.year,
    image: row.image_url,
    dateTaken: row.date_taken ?? undefined,
    locationDetail: row.location_detail ?? undefined,
    camera: row.camera ?? undefined,
    description: row.description ?? undefined,
    collection: row.collection ?? undefined,
  };
}

export async function getPublishedPhotos(): Promise<PhotoItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("portfolio_photos")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error || !data?.length) return PHOTOS;
    return data.map((row) => mapPhoto(row as PhotoRow));
  } catch {
    return PHOTOS;
  }
}

export async function getPublishedBooks(): Promise<BookItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("portfolio_books")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true });

    if (error || !data?.length) return BOOKS;

    return data.map((row) => ({
      title: row.title,
      author: row.author,
      status: row.status as BookItem["status"],
      cover: row.cover_url,
    }));
  } catch {
    return BOOKS;
  }
}

export async function getPublishedMovies(): Promise<MovieItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("portfolio_movies")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true });

    if (error || !data?.length) return MOVIES;

    return data.map((row) => ({
      title: row.title,
      year: row.year,
      director: row.director,
      status: row.status as MovieItem["status"],
      poster: row.poster_url,
    }));
  } catch {
    return MOVIES;
  }
}

export async function getAllPhotosForAdmin() {
  const { getAdminDb } = await import("@/lib/admin/auth");
  const supabase = await getAdminDb();
  const { data, error } = await supabase
    .from("portfolio_photos")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapPhoto(row as PhotoRow));
}

export async function getAllBooksForAdmin() {
  const { getAdminDb } = await import("@/lib/admin/auth");
  const supabase = await getAdminDb();
  const { data, error } = await supabase.from("portfolio_books").select("*").order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function getAllMoviesForAdmin() {
  const { getAdminDb } = await import("@/lib/admin/auth");
  const supabase = await getAdminDb();
  const { data, error } = await supabase.from("portfolio_movies").select("*").order("sort_order");
  if (error) throw error;
  return data ?? [];
}
