import { cn } from "@/lib/utils";

const imageFrameClass = cn(
  "overflow-hidden bg-foreground/[0.04]",
  "border border-foreground/[0.06]",
  "motion-safe:transition-[transform,box-shadow] motion-safe:duration-300 motion-safe:ease-out",
  "motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:scale-[1.02]",
  "motion-safe:group-hover:shadow-[0_10px_28px_rgba(0,0,0,0.12)]",
  "dark:motion-safe:group-hover:shadow-[0_10px_28px_rgba(0,0,0,0.35)]",
);

type MediaListItemProps = {
  image: string;
  alt: string;
  title: string;
  meta: string;
  aspectRatio: "4/3" | "2/3";
  widthClass: string;
  compact?: boolean;
};

export function MediaListItem({
  image,
  alt,
  title,
  meta,
  aspectRatio,
  widthClass,
  compact = false,
}: MediaListItemProps) {
  return (
    <article className={cn("group shrink-0", widthClass)}>
      <div
        className={cn(
          imageFrameClass,
          compact ? "rounded-lg" : "rounded-xl",
          aspectRatio === "4/3" ? "aspect-[4/3]" : "aspect-[2/3]",
        )}
      >
        <img
          src={image}
          alt={alt}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="h-full w-full object-cover"
        />
      </div>

      <div className={compact ? "mt-1.5" : "mt-2.5"}>
        <h3
          className={cn(
            "truncate font-medium leading-5",
            compact ? "text-[11px]" : "text-[13px]",
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            "mt-0.5 truncate text-foreground/40",
            compact ? "text-[10px]" : "text-[12px]",
          )}
        >
          {meta}
        </p>
      </div>
    </article>
  );
}
