"use client";

import * as React from "react";

export type AdminUploadState =
  | "idle"
  | "uploading"
  | "processing"
  | "error"
  | "done";

export type AdminUploadOperation = "upload" | "delete";

export type AdminUploadItem = {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  previewUrl?: string;
  kind: "image" | "audio" | "file";
  operation?: AdminUploadOperation;
  state: AdminUploadState;
  progress: number;
  error?: string;
  onRetry?: () => void;
};

type AdminUploadContextValue = {
  items: AdminUploadItem[];
  addUpload: (item: AdminUploadItem) => void;
  updateUpload: (id: string, patch: Partial<AdminUploadItem>) => void;
  removeUpload: (id: string) => void;
};

const AdminUploadContext = React.createContext<AdminUploadContextValue | null>(
  null,
);

export function AdminUploadProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<AdminUploadItem[]>([]);
  const doneTimersRef = React.useRef<Map<string, number>>(new Map());

  const addUpload = React.useCallback((item: AdminUploadItem) => {
    setItems((current) => [item, ...current]);
  }, []);

  const removeUpload = React.useCallback((id: string) => {
    const timer = doneTimersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      doneTimersRef.current.delete(id);
    }

    setItems((current) => {
      const item = current.find((entry) => entry.id === id);
      if (item?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return current.filter((entry) => entry.id !== id);
    });
  }, []);

  const scheduleAutoDismiss = React.useCallback(
    (id: string) => {
      const existing = doneTimersRef.current.get(id);
      if (existing) {
        window.clearTimeout(existing);
      }

      const timer = window.setTimeout(() => {
        removeUpload(id);
      }, 2000);

      doneTimersRef.current.set(id, timer);
    },
    [removeUpload],
  );

  const updateUpload = React.useCallback(
    (id: string, patch: Partial<AdminUploadItem>) => {
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );

      if (patch.state === "done") {
        scheduleAutoDismiss(id);
      }
    },
    [scheduleAutoDismiss],
  );

  const itemsRef = React.useRef(items);
  itemsRef.current = items;

  React.useEffect(() => {
    return () => {
      doneTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      doneTimersRef.current.clear();
      itemsRef.current.forEach((item) => {
        if (item.previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  const value = React.useMemo(
    () => ({ items, addUpload, updateUpload, removeUpload }),
    [addUpload, items, removeUpload, updateUpload],
  );

  return (
    <AdminUploadContext.Provider value={value}>
      {children}
    </AdminUploadContext.Provider>
  );
}

export function useAdminUploads() {
  const context = React.useContext(AdminUploadContext);
  if (!context) {
    throw new Error("useAdminUploads must be used within AdminUploadProvider");
  }
  return context;
}
