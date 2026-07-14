import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { getPublishedBlogs } from "@/lib/content/blogs";

const PLACEHOLDER_POSTS = [
  "On building tools that stay out of the way",
  "Notes from a quiet redesign",
  "What I want from AI-assisted writing",
];

export default async function BlogsPage() {
  const posts = await getPublishedBlogs();

  return (
    <main className="min-h-dvh bg-[#fdfcf9] text-black dark:bg-[#101010] dark:text-white">
      <div className="mx-auto w-full max-w-[760px] px-6 py-10 sm:px-8">
        <BackButton href="/" />

        <header className="mt-10 max-w-xl">
          <h1 className="text-[28px] font-medium tracking-[-0.02em] sm:text-[32px]">
            Blogs
          </h1>
        </header>

        <ul className="mt-14 space-y-4">
          {(posts.length > 0 ? posts : PLACEHOLDER_POSTS.map((title) => ({ slug: "", title }))).map(
            (post) => (
              <li key={post.title}>
                {post.slug ? (
                  <Link
                    href={`/blogs/${post.slug}`}
                    className="text-[14px] text-foreground/70 transition hover:text-foreground"
                  >
                    {post.title}
                  </Link>
                ) : (
                  <span className="text-[14px] text-foreground/55 before:mr-2 before:text-foreground/25 before:content-['—']">
                    {post.title}
                  </span>
                )}
              </li>
            ),
          )}
        </ul>
      </div>
    </main>
  );
}
