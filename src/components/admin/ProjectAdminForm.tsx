"use client";

import * as React from "react";
import { saveProject, type ProjectDraft } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

const emptyDraft: ProjectDraft = {
  slug: "",
  title: "",
  category: "",
  year: String(new Date().getFullYear()),
  summary: "",
  role: "Design & development",
  problem: "",
  process: "",
  result: "",
  imageAlt: "",
  color: "#e8e6e1",
  tags: [],
  published: false,
};

export function ProjectAdminForm() {
  const [draft, setDraft] = React.useState<ProjectDraft>(emptyDraft);
  const [link, setLink] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const update = (patch: Partial<ProjectDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const importLink = async () => {
    if (!link.trim()) return;
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/projects/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link.trim() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Import failed");

      setDraft((current) => ({ ...current, ...data, published: false }));
      setMessage("Imported draft from link. Review and publish when ready.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await saveProject(draft);
      setMessage("Project saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    "mt-1 w-full rounded-lg border border-foreground/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/25";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={link}
          onChange={(event) => setLink(event.target.value)}
          placeholder="Paste GitHub or project URL"
          className={fieldClass}
        />
        <ButtonGroup>
          <Button
            type="button"
            variant="outline"
            onClick={importLink}
            disabled={loading}
          >
            Import
          </Button>
        </ButtonGroup>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-[12px] text-foreground/50">
          Title
          <input
            className={fieldClass}
            value={draft.title}
            onChange={(event) => update({ title: event.target.value })}
            required
          />
        </label>
        <label className="block text-[12px] text-foreground/50">
          Slug
          <input
            className={fieldClass}
            value={draft.slug}
            onChange={(event) => update({ slug: event.target.value })}
            required
          />
        </label>
      </div>

      <label className="block text-[12px] text-foreground/50">
        Summary
        <textarea
          className={`${fieldClass} min-h-[72px]`}
          value={draft.summary}
          onChange={(event) => update({ summary: event.target.value })}
        />
      </label>
      <label className="block text-[12px] text-foreground/50">
        Category
        <input
          className={fieldClass}
          value={draft.category}
          onChange={(event) => update({ category: event.target.value })}
        />
      </label>
      <label className="block text-[12px] text-foreground/50">
        Role
        <input
          className={fieldClass}
          value={draft.role}
          onChange={(event) => update({ role: event.target.value })}
        />
      </label>
      <label className="block text-[12px] text-foreground/50">
        Problem
        <textarea
          className={`${fieldClass} min-h-[72px]`}
          value={draft.problem}
          onChange={(event) => update({ problem: event.target.value })}
        />
      </label>
      <label className="block text-[12px] text-foreground/50">
        Process
        <textarea
          className={`${fieldClass} min-h-[72px]`}
          value={draft.process}
          onChange={(event) => update({ process: event.target.value })}
        />
      </label>
      <label className="block text-[12px] text-foreground/50">
        Result
        <textarea
          className={`${fieldClass} min-h-[72px]`}
          value={draft.result}
          onChange={(event) => update({ result: event.target.value })}
        />
      </label>
      <label className="block text-[12px] text-foreground/50">
        Live URL
        <input
          className={fieldClass}
          value={draft.liveUrl ?? ""}
          onChange={(event) => update({ liveUrl: event.target.value })}
        />
      </label>
      <label className="block text-[12px] text-foreground/50">
        Source URL
        <input
          className={fieldClass}
          value={draft.sourceUrl ?? ""}
          onChange={(event) => update({ sourceUrl: event.target.value })}
        />
      </label>
      <label className="block text-[12px] text-foreground/50">
        Image URL
        <input
          className={fieldClass}
          value={draft.imageUrl ?? ""}
          onChange={(event) => update({ imageUrl: event.target.value })}
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={draft.published}
          onChange={(event) => update({ published: event.target.checked })}
        />
        Published
      </label>

      {message ? <p className="text-[13px] text-foreground/55">{message}</p> : null}

      <ButtonGroup>
        <Button type="submit" disabled={loading}>
          Save project
        </Button>
      </ButtonGroup>
    </form>
  );
}
