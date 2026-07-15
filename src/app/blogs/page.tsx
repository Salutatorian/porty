import { BackButton } from "@/components/BackButton";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { getPublishedBlogs } from "@/lib/content/blogs";

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

        <section className="mt-10 space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => <BlogPostCard key={post.id} post={post} />)
          ) : (
            <p className="text-[14px] text-foreground/50 dark:text-white/45">
              No posts yet.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
