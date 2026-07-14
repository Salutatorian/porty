"use client";

import * as React from "react";
import { saveBook, type BookDraft } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

export function BookAdminForm() {
  const [draft, setDraft] = React.useState<BookDraft>({
    title: "",
    author: "",
    status: "Read",
    coverUrl: "",
    published: true,
  });
  const [message, setMessage] = React.useState<string | null>(null);

  const fieldClass =
    "mt-1 w-full rounded-lg border border-foreground/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/25";

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await saveBook(draft);
      setMessage("Book saved.");
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
        Author
        <input
          className={fieldClass}
          value={draft.author}
          onChange={(event) =>
            setDraft((current) => ({ ...current, author: event.target.value }))
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
        Cover URL
        <input
          className={fieldClass}
          value={draft.coverUrl}
          onChange={(event) =>
            setDraft((current) => ({ ...current, coverUrl: event.target.value }))
          }
        />
      </label>
      <ButtonGroup>
        <Button type="submit">Save book</Button>
      </ButtonGroup>
      {message ? <p className="text-[13px] text-foreground/55">{message}</p> : null}
    </form>
  );
}
