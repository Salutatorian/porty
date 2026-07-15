"use client";

import * as React from "react";
import { Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { BlogEditor } from "@/components/admin/BlogEditor";
import { useAdminConfirmDelete } from "@/components/admin/AdminConfirmDeleteDialog";
import { deleteBlog, saveBlog, type BlogDraft } from "@/lib/admin/actions";
import type { AdminBlogPost } from "@/lib/content/blogs";
import { slugify } from "@/lib/slugify";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { cn } from "@/lib/utils";

const emptyDraft: BlogDraft = {
  slug: "",
  title: "",
  subtitle: "",
  excerpt: "",
  contentJson: {},
  contentHtml: "",
  status: "published",
  isFeatured: false,
};

type BlogAdminFormProps = {
  posts: AdminBlogPost[];
};

function postToDraft(post: AdminBlogPost): BlogDraft {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    subtitle: post.subtitle ?? "",
    excerpt: post.excerpt ?? "",
    contentJson: post.contentJson,
    contentHtml: post.contentHtml,
    status: post.status,
    isFeatured: post.isFeatured,
  };
}

export function BlogAdminForm({ posts }: BlogAdminFormProps) {
  const router = useRouter();
  const { requestDelete, dialog } = useAdminConfirmDelete();
  const [postList, setPostList] = React.useState(posts);
  const [draft, setDraft] = React.useState<BlogDraft>(emptyDraft);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setPostList(posts);
  }, [posts]);

  const fieldClass =
    "mt-1 w-full rounded-lg border border-foreground/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/25";

  const update = (patch: Partial<BlogDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const selectPost = (post: AdminBlogPost) => {
    setSelectedId(post.id);
    setDraft(postToDraft(post));
    setMessage(null);
  };

  const startNew = () => {
    setSelectedId(null);
    setDraft(emptyDraft);
    setMessage(null);
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await saveBlog({
        ...draft,
        slug: draft.slug || slugify(draft.title),
        status: "published",
      });
      setMessage("Blog post published.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const performDelete = async (id: string) => {
    setLoading(true);
    setMessage(null);

    try {
      await deleteBlog(id);
      setPostList((current) => current.filter((post) => post.id !== id));
      startNew();
      setMessage("Blog post deleted.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const onDelete = () => {
    if (!draft.id) return;

    const label = draft.title.trim() || "this blog post";
    const hasImages = /<img\s/i.test(draft.contentHtml);

    requestDelete({
      title: "Delete blog post?",
      itemName: label,
      hasAttachments: hasImages,
      attachmentLabel: "uploaded images",
      description: hasImages
        ? `This will permanently delete "${label}", remove it from the database, and delete all images embedded in the post from storage.`
        : undefined,
      onConfirm: () => performDelete(draft.id!),
    });
  };

  return (
    <>
      {dialog}
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-foreground/45">
            Posts
          </p>
          <Button type="button" variant="outline" size="sm" onClick={startNew}>
            New
          </Button>
        </div>

        <div className="max-h-[70vh] space-y-1 overflow-y-auto rounded-xl border border-foreground/10 p-2">
          {postList.length === 0 ? (
            <p className="px-2 py-3 text-[12px] text-foreground/45">
              No posts yet.
            </p>
          ) : (
            postList.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => selectPost(post)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition",
                  selectedId === post.id
                    ? "bg-foreground/8 dark:bg-white/10"
                    : "hover:bg-foreground/5 dark:hover:bg-white/5",
                )}
              >
                {post.isFeatured ? (
                  <Star className="mt-0.5 size-3 shrink-0 fill-amber-500 text-amber-500" />
                ) : (
                  <span className="mt-1 size-3 shrink-0" />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium">
                    {post.title}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </aside>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-[12px] text-foreground/50">
          Title
          <input
            className={fieldClass}
            value={draft.title}
            onChange={(e) =>
              update({
                title: e.target.value,
                slug: draft.id ? draft.slug : slugify(e.target.value),
              })
            }
            required
          />
        </label>

        <label className="block text-[12px] text-foreground/50">
          Slug
          <input
            className={fieldClass}
            value={draft.slug}
            onChange={(e) => update({ slug: slugify(e.target.value) })}
          />
        </label>

        <label className="block text-[12px] text-foreground/50">
          Subtitle
          <input
            className={fieldClass}
            value={draft.subtitle ?? ""}
            onChange={(e) => update({ subtitle: e.target.value })}
          />
        </label>

        <label className="block text-[12px] text-foreground/50">
          Excerpt
          <textarea
            className={`${fieldClass} min-h-[72px]`}
            value={draft.excerpt ?? ""}
            onChange={(e) => update({ excerpt: e.target.value })}
          />
        </label>

        <BlogEditor
          key={draft.id ?? "new"}
          initialHtml={draft.contentHtml}
          onChange={(content) =>
            update({
              contentJson: content.json,
              contentHtml: content.html,
            })
          }
        />

        <label className="flex items-center gap-2 text-[12px] text-foreground/50">
          <input
            type="checkbox"
            checked={draft.isFeatured ?? false}
            onChange={(e) => update({ isFeatured: e.target.checked })}
            className="size-4 rounded border-foreground/20"
          />
          Star / pin to top
        </label>

        <ButtonGroup>
          <Button type="submit" disabled={loading}>
            {loading ? "Publishing..." : "Publish post"}
          </Button>
          {draft.id ? (
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={onDelete}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          ) : null}
        </ButtonGroup>

        {message ? (
          <p className="text-[13px] text-foreground/55">{message}</p>
        ) : null}
      </form>
    </div>
    </>
  );
}
