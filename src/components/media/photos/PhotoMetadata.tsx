import type { PhotoItem } from "@/lib/media-items";

type PhotoMetadataProps = {
  photo: PhotoItem;
  className?: string;
};

function formatLocation(photo: PhotoItem) {
  if (photo.locationDetail) {
    return photo.locationDetail;
  }

  if (photo.location === "Northern Mariana Islands") {
    return photo.location;
  }

  return `${photo.location}, Northern Mariana Islands`;
}

export function PhotoMetadata({ photo, className }: PhotoMetadataProps) {
  const dateLine = [photo.dateTaken ?? photo.year, formatLocation(photo)]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className={className}>
      <h3 className="text-[15px] font-medium tracking-tight text-white/92 sm:text-base">
        {photo.title}
      </h3>

      {dateLine ? (
        <p className="mt-1.5 text-[12px] text-white/48 sm:text-[13px]">
          {dateLine}
        </p>
      ) : null}

      {photo.description ? (
        <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-white/55 sm:text-[14px]">
          {photo.description}
        </p>
      ) : null}

      {photo.collection ? (
        <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-white/32">
          {photo.collection}
        </p>
      ) : null}
    </div>
  );
}
