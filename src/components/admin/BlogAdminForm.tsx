"use client";

import * as React from "react";
import { BlogEditor } from "@/components/admin/BlogEditor";
import { saveBlog } from "@/lib/admin/actions";
import { slugify } from "@/lib/slugify";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

export function BlogAdminForm() {
  const [title, setTitle] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [excerpt, setExcerpt] = React.useState("");
  const [status, setStatus] = React.useState<"draft" | "published">("draft");
  const [content, setContent] = React.useState<{ json: object; html: string }>({
    json: {},
    html: "",
  });
  const [message, setMessage] = React.useState<string | null>(null);

  const fieldClass =
    "mt-1 w-full rounded-lg border border-foreground/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/25";

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await saveBlog({
        slug: slugify(title),
        title,
        subtitle,
        excerpt,
        contentJson: content.json,
        contentHtml: content.html,
        status,
      });
      setMessage("Blog post saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-[12px] text-foreground/50">
        Title
        <input className={fieldClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label className="block text-[12px] text-foreground/50">
        Subtitle
        <input className={fieldClass} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
      </label>
      <label className="block text-[12px] text-foreground/50">
        Excerpt
        <textarea className={`${fieldClass} min-h-[72px]`} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
      </label>
      <BlogEditor onChange={setContent} />
      <label className="block text-[12px] text-foreground/50">
        Status
        <select
          className={fieldClass}
          value={status}
          onChange={(e) => setStatus(e.target.value as "draft" | "published")}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </label>
      <ButtonGroup>
        <Button type="submit">Save post</Button>
      </ButtonGroup>
      {message ? <p className="text-[13px] text-foreground/55">{message}</p> : null}
    </form>
  );
}
