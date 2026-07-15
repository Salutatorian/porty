import Link from "next/link";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BlogKudosButton } from "@/components/blog/BlogKudosButton";
import { BLOG_AUTHOR, formatBlogDate } from "@/lib/blog-utils";
import type { BlogPost } from "@/lib/content/blogs";

type BlogPostCardProps = {
  post: BlogPost;
};

export function BlogPostCard({ post }: BlogPostCardProps) {
  const preview = post.subtitle || post.excerpt;
  const dateLabel = post.publishedAt
    ? formatBlogDate(post.publishedAt)
    : null;

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:border-foreground/20 hover:shadow-md dark:hover:border-white/20">
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <Avatar size="sm" className="size-6">
            <AvatarFallback className="bg-foreground/8 text-[10px] font-medium text-foreground/70 dark:bg-white/10 dark:text-white/70">
              {BLOG_AUTHOR.initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 text-[13px] text-muted-foreground">
            <span className="font-medium text-foreground dark:text-white">
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

        <Link href={`/blogs/${post.slug}`} className="group block">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <h2 className="text-[22px] font-semibold leading-[1.2] tracking-[-0.02em] text-black transition group-hover:text-black/75 dark:text-white dark:group-hover:text-white/85 sm:text-[24px]">
                {post.title}
              </h2>
              {preview ? (
                <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-muted-foreground">
                  {preview}
                </p>
              ) : null}
            </div>

            {post.leadImage ? (
              <div className="hidden shrink-0 sm:block">
                <img
                  src={post.leadImage}
                  alt=""
                  className="size-[112px] rounded-md border border-border object-cover"
                />
              </div>
            ) : null}
          </div>
        </Link>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-4">
          <div className="flex items-center gap-3">
            <BlogKudosButton
              slug={post.slug}
              initialCount={post.kudosCount}
              compact
            />
            {post.isFeatured ? (
              <span
                className="inline-flex items-center gap-1 text-[12px] text-amber-600 dark:text-amber-400"
                aria-label="Featured post"
              >
                <Star className="size-3.5 fill-current" />
                <span>Featured</span>
              </span>
            ) : null}
          </div>
          <span className="text-[12px] text-muted-foreground">Read post →</span>
        </div>
      </div>
    </article>
  );
}
