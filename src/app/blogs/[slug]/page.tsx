import { BackButton } from "@/components/BackButton";
import { notFound } from "next/navigation";
import { getBlogBySlug } from "@/lib/content/blogs";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) notFound();

  return (
    <main className="min-h-dvh bg-[#fdfcf9] text-black dark:bg-[#101010] dark:text-white">
      <div className="mx-auto w-full max-w-[760px] px-6 py-10 sm:px-8">
        <BackButton href="/blogs" />

        <header className="mt-10">
          <h1 className="text-[28px] font-medium tracking-[-0.02em] sm:text-[32px]">
            {post.title}
          </h1>
          {post.subtitle ? (
            <p className="mt-3 text-[15px] text-foreground/50">{post.subtitle}</p>
          ) : null}
        </header>

        <article
          className="prose prose-neutral mt-12 max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </div>
    </main>
  );
}
