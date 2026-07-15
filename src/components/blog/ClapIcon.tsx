import { cn } from "@/lib/utils";

type ClapIconProps = {
  className?: string;
  filled?: boolean;
};

export function ClapIcon({ className, filled = false }: ClapIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8.5 8.2V5.4c0-.9.7-1.6 1.6-1.6.8 0 1.5.6 1.6 1.4l.3 2.1" />
      <path d="M8.5 8.2 7 10.1c-.8 1-.7 2.4.2 3.3l4.2 4.1c.8.8 2 .9 2.9.3l3.5-2.4c.8-.6 1.2-1.6 1-2.6l-.8-3.8" />
      <path d="M12 17.8V20c0 .8-.7 1.5-1.5 1.5S9 20.8 9 20v-2.2" />
      <path d="M15.5 8.2V5.4c0-.9-.7-1.6-1.6-1.6-.8 0-1.5.6-1.6 1.4l-.3 2.1" />
      <path d="M15.5 8.2 17 10.1c.8 1 .7 2.4-.2 3.3l-4.2 4.1c-.8.8-2 .9-2.9.3l-3.5-2.4c-.8-.6-1.2-1.6-1-2.6l.8-3.8" />
    </svg>
  );
}
