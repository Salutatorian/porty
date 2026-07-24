"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ADMIN_AUTH_BYPASS } from "@/lib/admin/auth-bypass";
import { getAdminDb, requireAdmin } from "@/lib/admin/auth";
import { slugify } from "@/lib/slugify";
import {
  getLegacyPhotos,
  getLegacyPhotosIndexCandidates,
} from "@/lib/syndication/legacy-photos";

export type ProjectDraft = {
  slug: string;
  title: string;
  category: string;
  year: string;
  summary: string;
  role: string;
  problem: string;
  process: string;
  result: string;
  imageAlt: string;
  color: string;
  imageUrl?: string;
  liveUrl?: string;
  sourceUrl?: string;
  tags: string[];
  published: boolean;
};

export async function saveProject(draft: ProjectDraft) {
  await requireAdmin();
  const supabase = await getAdminDb();

  const { error } = await supabase.from("portfolio_projects").upsert({
    slug: draft.slug || slugify(draft.title),
    title: draft.title,
    category: draft.category,
    year: draft.year,
    summary: draft.summary,
    role: draft.role,
    problem: draft.problem,
    process: draft.process,
    result: draft.result,
    image_alt: draft.imageAlt,
    color: draft.color,
    image_url: draft.imageUrl ?? null,
    live_url: draft.liveUrl ?? null,
    source_url: draft.sourceUrl ?? null,
    tags: draft.tags,
    published: draft.published,
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);

  revalidatePath("/projects");
  revalidatePath(`/projects/${draft.slug}`);
  revalidatePath("/admin/projects");
}

export async function deleteProject(slug: string) {
  await requireAdmin();
  const supabase = await getAdminDb();

  const { data: project, error: readError } = await supabase
    .from("portfolio_projects")
    .select("image_url")
    .eq("slug", slug)
    .maybeSingle();

  if (readError) throw new Error(readError.message);

  const { error } = await supabase
    .from("portfolio_projects")
    .delete()
    .eq("slug", slug);
  if (error) throw new Error(error.message);

  if (project?.image_url) {
    const { deletePortfolioStorageObject } = await import(
      "@/lib/admin/portfolio-storage"
    );
    try {
      await deletePortfolioStorageObject(project.image_url);
    } catch {
      // Ignore external image URLs.
    }
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${slug}`);
  revalidatePath("/admin/projects");
}

export type PhotoDraft = {
  id: string;
  title: string;
  location: string;
  year: string;
  imageUrl: string;
  dateTaken?: string;
  locationDetail?: string;
  camera?: string;
  description?: string;
  collection?: string;
  published: boolean;
};

export async function savePhoto(draft: PhotoDraft) {
  await requireAdmin();
  const supabase = await getAdminDb();

  const { error } = await supabase.from("portfolio_photos").upsert({
    id: draft.id || slugify(draft.title),
    title: draft.title,
    location: draft.location,
    year: draft.year,
    image_url: draft.imageUrl,
    date_taken: draft.dateTaken ?? null,
    location_detail: draft.locationDetail ?? null,
    camera: draft.camera ?? null,
    description: draft.description ?? null,
    collection: draft.collection ?? null,
    published: draft.published,
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);

  revalidatePath("/media");
  revalidatePath("/admin/photos");
}

export async function deletePhoto(id: string, imageUrl?: string) {
  await requireAdmin();
  const { deletePhotoRecord } = await import("@/lib/admin/portfolio-storage");
  await deletePhotoRecord(id, imageUrl);
  revalidatePath("/media");
  revalidatePath("/admin/photos");
}

export type PortfolioUploadFolder = "photos" | "music";

export async function preparePortfolioFileUpload(input: {
  fileName: string;
  contentType: string;
  fileSize: number;
  folder: PortfolioUploadFolder;
}) {
  await requireAdmin();
  const { createPortfolioSignedUpload } = await import(
    "@/lib/admin/portfolio-storage"
  );

  return createPortfolioSignedUpload({
    fileName: input.fileName,
    fileSize: input.fileSize,
    folder: input.folder,
  });
}

export type BookDraft = {
  id?: string;
  title: string;
  author: string;
  status: string;
  coverUrl: string;
  published: boolean;
};

export async function saveBook(draft: BookDraft) {
  await requireAdmin();
  const supabase = await getAdminDb();
  const row = {
    id: draft.id,
    title: draft.title,
    author: draft.author,
    status: draft.status,
    cover_url: draft.coverUrl,
    published: draft.published,
  };

  const { error } = draft.id
    ? await supabase.from("portfolio_books").update(row).eq("id", draft.id)
    : await supabase.from("portfolio_books").insert(row);

  if (error) throw new Error(error.message);
  revalidatePath("/media/books");
  revalidatePath("/admin/books");
}

export type MovieDraft = {
  id?: string;
  title: string;
  year: string;
  director: string;
  status: string;
  posterUrl: string;
  published: boolean;
};

export async function saveMovie(draft: MovieDraft) {
  await requireAdmin();
  const supabase = await getAdminDb();
  const row = {
    id: draft.id,
    title: draft.title,
    year: draft.year,
    director: draft.director,
    status: draft.status,
    poster_url: draft.posterUrl,
    published: draft.published,
  };

  const { error } = draft.id
    ? await supabase.from("portfolio_movies").update(row).eq("id", draft.id)
    : await supabase.from("portfolio_movies").insert(row);

  if (error) throw new Error(error.message);
  revalidatePath("/media/movies");
  revalidatePath("/admin/movies");
}

export type BlogDraft = {
  id?: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  contentJson: object;
  contentHtml: string;
  status: "draft" | "published";
  isFeatured?: boolean;
};

export type SaveBlogResult =
  | { ok: true; id: string; slug: string }
  | { ok: false; error: string };

export async function saveBlog(draft: BlogDraft): Promise<SaveBlogResult> {
  await requireAdmin();
  const supabase = await getAdminDb();

  let publishedAt = new Date().toISOString();

  if (draft.id) {
    const { data: existing } = await supabase
      .from("portfolio_blogs")
      .select("published_at")
      .eq("id", draft.id)
      .maybeSingle();

    if (existing?.published_at) {
      publishedAt = existing.published_at;
    }
  }

  const slug = draft.slug || slugify(draft.title);
  const row = {
    slug,
    title: draft.title,
    subtitle: draft.subtitle ?? null,
    excerpt: draft.excerpt ?? null,
    content_json: draft.contentJson,
    content_html: draft.contentHtml,
    status: "published" as const,
    is_featured: draft.isFeatured ?? false,
    published_at: publishedAt,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = draft.id
    ? await supabase
        .from("portfolio_blogs")
        .update(row)
        .eq("id", draft.id)
        .select("id, slug")
        .single()
    : await supabase
        .from("portfolio_blogs")
        .insert(row)
        .select("id, slug")
        .single();

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: `A post with the slug "${slug}" already exists. Change the slug or edit the existing post.`,
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/blogs");
  revalidatePath(`/blogs/${slug}`);
  revalidatePath("/admin/blogs");

  return { ok: true, id: data.id, slug: data.slug };
}

export async function deleteBlog(id: string) {
  await requireAdmin();
  const supabase = await getAdminDb();

  const { data: blog, error: readError } = await supabase
    .from("portfolio_blogs")
    .select("content_html, slug")
    .eq("id", id)
    .maybeSingle();

  if (readError) throw new Error(readError.message);
  if (!blog) return;

  const { error } = await supabase.from("portfolio_blogs").delete().eq("id", id);
  if (error) throw new Error(error.message);

  const {
    deletePortfolioStorageObjects,
    extractStorageUrlsFromHtml,
  } = await import("@/lib/admin/portfolio-storage");
  await deletePortfolioStorageObjects(
    extractStorageUrlsFromHtml(blog.content_html ?? ""),
  );

  revalidatePath("/blogs");
  revalidatePath(`/blogs/${blog.slug}`);
  revalidatePath("/admin/blogs");
}

export type MusicTrackDraft = {
  id?: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl?: string;
  published: boolean;
  sortOrder?: number;
};

export async function saveMusicTrack(draft: MusicTrackDraft) {
  await requireAdmin();
  const supabase = await getAdminDb();

  const id = draft.id || slugify(draft.title);
  const { error } = await supabase.from("portfolio_music").upsert({
    id,
    title: draft.title,
    artist: draft.artist,
    audio_url: draft.audioUrl,
    cover_url: draft.coverUrl?.trim() || null,
    sort_order: draft.sortOrder ?? 0,
    published: draft.published,
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/music");
}

export async function deleteMusicTrack(id: string) {
  await requireAdmin();
  const supabase = await getAdminDb();

  const { data: track, error: readError } = await supabase
    .from("portfolio_music")
    .select("audio_url, cover_url")
    .eq("id", id)
    .maybeSingle();

  if (readError) throw new Error(readError.message);

  const { error } = await supabase.from("portfolio_music").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (track) {
    const { deletePortfolioStorageObject } = await import(
      "@/lib/admin/portfolio-storage"
    );

    for (const fileUrl of [track.audio_url, track.cover_url]) {
      if (!fileUrl) continue;
      try {
        await deletePortfolioStorageObject(fileUrl);
      } catch {
        // Ignore legacy public audio paths and external URLs.
      }
    }
  }

  revalidatePath("/");
  revalidatePath("/admin/music");
}


export async function importLegacyPhotos() {
  await requireAdmin();

  if (!getLegacyPhotosIndexCandidates().length) {
    throw new Error(
      "Set R2_PUBLIC_BASE_URL on Vercel (Cloudflare R2), or LEGACY_PHOTOS_INDEX_URL.",
    );
  }

  const legacyPhotos = await getLegacyPhotos();
  if (legacyPhotos.length === 0) {
    throw new Error("Legacy photo index is empty.");
  }

  let imported = 0;
  for (const photo of legacyPhotos) {
    await savePhoto({
      id: photo.id,
      title: photo.title,
      location: photo.location,
      year: photo.year,
      imageUrl: photo.image,
      dateTaken: photo.dateTaken,
      locationDetail: photo.locationDetail,
      description: photo.description,
      collection: photo.collection,
      published: true,
    });
    imported += 1;
  }

  if (imported === 0) {
    throw new Error("No photos with image URLs were found in the legacy index.");
  }

  revalidatePath("/media");
  revalidatePath("/admin/photos");
  return { imported };
}

export async function signOutAdmin() {
  if (ADMIN_AUTH_BYPASS) {
    redirect("/admin");
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
