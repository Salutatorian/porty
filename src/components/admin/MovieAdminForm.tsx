"use client";

import * as React from "react";
import { saveMovie, type MovieDraft } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

export function MovieAdminForm() {
  const [draft, setDraft] = React.useState<MovieDraft>({
    title: "",
    year: "",
    director: "",
    status: "Watched",
    posterUrl: "",
    published: true,
  });
  const [message, setMessage] = React.useState<string | null>(null);

  const fieldClass =
    "mt-1 w-full rounded-lg border border-foreground/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/25";

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await saveMovie(draft);
      setMessage("Movie saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-[12px] text-foreground/50">
        Title
        <input
          className={fieldClass}
          value={draft.title}
          onChange={(event) =>
            setDraft((current) => ({ ...current, title: event.target.value }))
          }
          required
        />
      </label>
      <label className="block text-[12px] text-foreground/50">
        Year
        <input
          className={fieldClass}
          value={draft.year}
          onChange={(event) =>
            setDraft((current) => ({ ...current, year: event.target.value }))
          }
        />
      </label>
      <label className="block text-[12px] text-foreground/50">
        Director
        <input
          className={fieldClass}
          value={draft.director}
          onChange={(event) =>
            setDraft((current) => ({ ...current, director: event.target.value }))
          }
        />
      </label>
      <label className="block text-[12px] text-foreground/50">
        Status
        <input
          className={fieldClass}
          value={draft.status}
          onChange={(event) =>
            setDraft((current) => ({ ...current, status: event.target.value }))
          }
        />
      </label>
      <label className="block text-[12px] text-foreground/50">
        Poster URL
        <input
          className={fieldClass}
          value={draft.posterUrl}
          onChange={(event) =>
            setDraft((current) => ({ ...current, posterUrl: event.target.value }))
          }
        />
      </label>
      <ButtonGroup>
        <Button type="submit">Save movie</Button>
      </ButtonGroup>
      {message ? <p className="text-[13px] text-foreground/55">{message}</p> : null}
    </form>
  );
}
