"use client";

import * as React from "react";

type UseLightboxNavigationOptions<T> = {
  items: T[];
  getItemId: (item: T) => string;
};

export function useLightboxNavigation<T>({
  items,
  getItemId,
}: UseLightboxNavigationOptions<T>) {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const activeIndex = React.useMemo(() => {
    if (!activeId) return -1;
    return items.findIndex((item) => getItemId(item) === activeId);
  }, [activeId, getItemId, items]);

  const activeItem = activeIndex >= 0 ? items[activeIndex] : null;

  const open = React.useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const close = React.useCallback(() => {
    setActiveId(null);
  }, []);

  const goNext = React.useCallback(() => {
    if (activeIndex < 0 || items.length === 0) return;
    const nextIndex = (activeIndex + 1) % items.length;
    const nextItem = items[nextIndex];
    if (nextItem) {
      setActiveId(getItemId(nextItem));
    }
  }, [activeIndex, getItemId, items]);

  const goPrevious = React.useCallback(() => {
    if (activeIndex < 0 || items.length === 0) return;
    const previousIndex = (activeIndex - 1 + items.length) % items.length;
    const previousItem = items[previousIndex];
    if (previousItem) {
      setActiveId(getItemId(previousItem));
    }
  }, [activeIndex, getItemId, items]);

  React.useEffect(() => {
    if (activeId) {
      document.body.dataset.photoLightboxOpen = "true";
    } else {
      delete document.body.dataset.photoLightboxOpen;
    }

    return () => {
      delete document.body.dataset.photoLightboxOpen;
    };
  }, [activeId]);

  React.useEffect(() => {
    if (!activeId) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      } else if (event.key === "ArrowRight") {
        goNext();
      } else if (event.key === "ArrowLeft") {
        goPrevious();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeId, close, goNext, goPrevious]);

  return {
    activeId,
    activeIndex,
    activeItem,
    isOpen: activeId !== null,
    open,
    close,
    goNext,
    goPrevious,
  };
}
