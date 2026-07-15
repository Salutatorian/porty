"use client";

import * as React from "react";
import { PhotoGalleryItem } from "@/components/media/photos/PhotoGalleryItem";
import { PhotoLightbox } from "@/components/media/photos/PhotoLightbox";
import { useLightboxNavigation } from "@/hooks/useLightboxNavigation";
import { assignPhotoLayouts } from "@/hooks/usePhotoLayout";
import type { PhotoItem } from "@/lib/media-items";

type PhotoGalleryProps = {
  photos: PhotoItem[];
};

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const layoutClassNames = React.useMemo(
    () => assignPhotoLayouts(photos),
    [photos],
  );

  const {
    activeItem,
    isOpen,
    open,
    close,
    goNext,
    goPrevious,
  } = useLightboxNavigation({
    items: photos,
    getItemId: (photo) => photo.id,
  });

  return (
    <>
      <div className="flex flex-col gap-4 sm:hidden">
        {photos.map((photo, index) => (
          <PhotoGalleryItem
            key={photo.id}
            photo={photo}
            index={index}
            layoutClassName=""
            variant="mobile"
            onOpen={(selected) => open(selected.id)}
          />
        ))}
      </div>

      <div
        className="
          hidden auto-rows-[8px] grid-flow-dense
          gap-2 sm:grid sm:grid-cols-4 lg:grid-cols-6
        "
      >
        {photos.map((photo, index) => (
          <PhotoGalleryItem
            key={photo.id}
            photo={photo}
            index={index}
            layoutClassName={layoutClassNames[index] ?? ""}
            onOpen={(selected) => open(selected.id)}
          />
        ))}
      </div>

      {isOpen ? (
        <PhotoLightbox
          photo={activeItem}
          onClose={close}
          onNext={goNext}
          onPrevious={goPrevious}
        />
      ) : null}
    </>
  );
}
