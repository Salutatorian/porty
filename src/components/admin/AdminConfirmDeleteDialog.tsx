"use client";

import * as React from "react";
import { Dialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export type AdminConfirmDeleteOptions = {
  title: string;
  itemName: string;
  description?: string;
  hasAttachments?: boolean;
  attachmentLabel?: string;
  onConfirm: () => void | Promise<void>;
};

type AdminConfirmDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  itemName: string;
  description?: string;
  hasAttachments?: boolean;
  attachmentLabel?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
};

export function AdminConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  itemName,
  description,
  hasAttachments = false,
  attachmentLabel = "files",
  loading = false,
  onConfirm,
}: AdminConfirmDeleteDialogProps) {
  const [confirmed, setConfirmed] = React.useState(false);
  const checkboxId = React.useId();

  React.useEffect(() => {
    if (!open) {
      setConfirmed(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!confirmed || loading) return;
    await onConfirm();
  };

  const warning = hasAttachments
    ? `This will permanently delete "${itemName}" and its ${attachmentLabel}.`
    : `This will permanently delete "${itemName}".`;

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-[120] bg-black/45 backdrop-blur-md",
            "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
          )}
        />
        <Dialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-[121] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
            "rounded-xl border border-border bg-card p-6 shadow-2xl outline-none",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          )}
        >
          <Dialog.Title className="text-lg font-semibold tracking-[-0.02em]">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description ?? warning}
            <span className="mt-1 block">This cannot be undone.</span>
          </Dialog.Description>

          <FieldGroup className="mt-5">
            <Field orientation="horizontal">
              <Checkbox
                id={checkboxId}
                checked={confirmed}
                onCheckedChange={(value) => setConfirmed(value === true)}
                disabled={loading}
              />
              <FieldLabel htmlFor={checkboxId} className="font-normal">
                I understand this will be permanently deleted
              </FieldLabel>
            </Field>
          </FieldGroup>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleConfirm()}
              disabled={!confirmed || loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function useAdminConfirmDelete() {
  const [options, setOptions] = React.useState<AdminConfirmDeleteOptions | null>(
    null,
  );
  const [loading, setLoading] = React.useState(false);

  const requestDelete = React.useCallback((next: AdminConfirmDeleteOptions) => {
    setOptions(next);
  }, []);

  const close = React.useCallback(() => {
    if (!loading) {
      setOptions(null);
    }
  }, [loading]);

  const dialog = (
    <AdminConfirmDeleteDialog
      open={Boolean(options)}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      title={options?.title ?? "Delete item?"}
      itemName={options?.itemName ?? "this item"}
      description={options?.description}
      hasAttachments={options?.hasAttachments}
      attachmentLabel={options?.attachmentLabel}
      loading={loading}
      onConfirm={async () => {
        if (!options) return;
        setLoading(true);
        try {
          await options.onConfirm();
          setOptions(null);
        } finally {
          setLoading(false);
        }
      }}
    />
  );

  return { requestDelete, dialog };
}
