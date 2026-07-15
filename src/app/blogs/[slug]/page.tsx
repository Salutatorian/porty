import { BackButton } from "@/components/BackButton";
import { BlogKudosButton } from "@/components/blog/BlogKudosButton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { notFound } from "next/navigation";
import { BLOG_AUTHOR, formatBlogDate } from "@/lib/blog-utils";
import { getBlogBySlug } from "@/lib/content/blogs";
import { Star } from "lucide-react";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) notFound();

  const dateLabel = post.publishedAt
    ? formatBlogDate(post.publishedAt)
    : null;

  return (
    <main className="min-h-dvh bg-[#fdfcf9] text-black dark:bg-[#101010] dark:text-white">
      <div className="mx-auto w-full max-w-[760px] px-6 py-10 sm:px-8">
        <BackButton href="/blogs" />

        <header className="mt-10">
          <div className="mb-6 flex items-center gap-2.5">
            <Avatar size="sm" className="size-7">
              <AvatarFallback className="bg-foreground/8 text-[11px] font-medium text-foreground/70 dark:bg-white/10 dark:text-white/70">
                {BLOG_AUTHOR.initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-[14px] text-foreground/55 dark:text-white/50">
              <span className="text-foreground/85 dark:text-white/85">
                {BLOG_AUTHOR.name}
              </span>
              {dateLabel ? (
                <>
                  <span className="mx-1.5">·</span>
                  <span>{dateLabel}</span>
                </>
              ) : null}
            </div>
          </div>

          <h1 className="text-[32px] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[42px]">
            {post.title}
          </h1>
          {post.subtitle ? (
            <p className="mt-4 text-[20px] leading-relaxed text-foreground/50 dark:text-white/45">
              {post.subtitle}
            </p>
          ) : null}
        </header>

        <article
          className="prose prose-neutral mt-10 max-w-none dark:prose-invert prose-p:text-[18px] prose-p:leading-[1.8] prose-img:rounded-sm"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        <footer className="mt-12 flex flex-col gap-3 border-t border-black/[0.08] pt-8 dark:border-white/[0.08] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <BlogKudosButton slug={post.slug} initialCount={post.kudosCount} />
            {post.isFeatured ? (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-amber-600 dark:text-amber-400">
                <Star className="size-4 fill-current" />
                Featured
              </span>
            ) : null}
          </div>
          <p className="text-[12px] text-foreground/45 dark:text-white/40">
            Tap again to undo your kudos
          </p>
        </footer>
      </div>
    </main>
  );
}
