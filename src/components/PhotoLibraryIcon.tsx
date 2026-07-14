export function PhotoLibraryIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="14"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.45"
      />
      <rect
        x="7"
        y="7"
        width="14"
        height="14"
        rx="3"
        fill="currentColor"
      />
      <circle
        cx="16.5"
        cy="11.5"
        r="1.5"
        fill="var(--photo-icon-background, white)"
      />
      <path
        d="M9.5 18L13 14.5L15 16.5L17 14.5L20 18"
        stroke="var(--photo-icon-background, white)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
