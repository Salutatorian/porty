"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

type AdminUploadEmptyProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onFileSelect?: (files: FileList) => void;
  onAction?: () => void;
  className?: string;
};

export function AdminUploadEmpty({
  icon,
  title,
  description,
  actionLabel = "Upload",
  accept,
  multiple = false,
  disabled = false,
  onFileSelect,
  onAction,
  className,
}: AdminUploadEmptyProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const openPicker = () => {
    if (disabled) return;
    if (onAction) {
      onAction();
      return;
    }
    inputRef.current?.click();
  };

  return (
    <Empty className={cn("border border-dashed", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {onFileSelect ? (
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            className="sr-only"
            disabled={disabled}
            onChange={(event) => {
              const files = event.target.files;
              if (files?.length) {
                onFileSelect(files);
              }
              event.target.value = "";
            }}
          />
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={openPicker}
        >
          {actionLabel}
        </Button>
      </EmptyContent>
    </Empty>
  );
}
