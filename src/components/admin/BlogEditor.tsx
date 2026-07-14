"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import * as React from "react";
import { EditorToolbar } from "@/components/admin/EditorToolbar";
import { uploadPortfolioFile } from "@/lib/admin/portfolio-upload";

type BlogEditorProps = {
  initialHtml?: string;
  onChange: (payload: { json: object; html: string }) => void;
};

export function BlogEditor({ initialHtml = "", onChange }: BlogEditorProps) {
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Image.configure({
        allowBase64: false,
      }),
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
    ],
    content: initialHtml,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      onChange({
        json: currentEditor.getJSON(),
        html: currentEditor.getHTML(),
      });
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    onChange({ json: editor.getJSON(), html: editor.getHTML() });
  }, [editor, onChange]);

  const onImageSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !editor) return;

    try {
      const url = await uploadPortfolioFile(file, "photos");
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch {
      const url = window.prompt("Image upload failed. Enter an image URL");
      if (url?.trim()) {
        editor.chain().focus().setImage({ src: url.trim() }).run();
      }
    }
  };

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          void onImageSelected(event);
        }}
      />

      <EditorToolbar
        editor={editor}
        onImageUpload={() => imageInputRef.current?.click()}
      />

      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none px-5 py-4 dark:prose-invert [&_.ProseMirror]:min-h-[380px] [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]"
      />
    </div>
  );
}
