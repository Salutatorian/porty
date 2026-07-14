"use client";

import * as React from "react";
import { BackButton } from "@/components/BackButton";
import { MediaCollectionsNav } from "@/components/media/MediaCollectionsNav";
import { PhotoGallery } from "@/components/media/photos/PhotoGallery";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import type { PhotoItem } from "@/lib/media-items";
import { photoMatchesDateFilter } from "@/lib/photo-date";

type MediaPageContentProps = {
  photos: PhotoItem[];
};

export function MediaPageContent({ photos }: MediaPageContentProps) {
  const [filterDate, setFilterDate] = React.useState<Date | undefined>();

  const filteredPhotos = React.useMemo(() => {
    if (!filterDate) {
      return photos;
    }

    return photos.filter((photo) =>
      photoMatchesDateFilter(photo.dateTaken, filterDate),
    );
  }, [filterDate, photos]);

  return (
    <main className="min-h-dvh bg-[#fdfcf9] text-foreground dark:bg-[#101010] dark:text-white">
      <div className="mx-auto w-full max-w-[1380px] px-5 pb-28 pt-10 sm:px-8 lg:px-12">
        <BackButton href="/" />

        <header className="mt-10">
          <h1 className="text-2xl font-semibold tracking-tight">Media</h1>
        </header>

        <MediaCollectionsNav
          active="photos"
          photosCount={filteredPhotos.length}
        />

        <div className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-[15px] font-medium tracking-tight">Photos</h2>
            <DatePickerInput
              id="photo-date-search"
              label="Search by date"
              value={
                filterDate
                  ? `${filterDate.getFullYear()}-${String(filterDate.getMonth() + 1).padStart(2, "0")}-${String(filterDate.getDate()).padStart(2, "0")}`
                  : ""
              }
              placeholder="Pick a date"
              className="w-full max-w-[240px]"
              onChange={(_value, date) => {
                setFilterDate(date);
              }}
            />
          </div>

          {filterDate ? (
            <p className="mt-3 text-[12px] text-foreground/40">
              Showing {filteredPhotos.length} of {photos.length} photos
            </p>
          ) : null}

          <div className="mt-4">
            {filteredPhotos.length > 0 ? (
              <PhotoGallery photos={filteredPhotos} />
            ) : (
              <p className="py-16 text-center text-[14px] text-foreground/40">
                No photos match that date.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
