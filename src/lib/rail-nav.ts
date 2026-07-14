export type RailNavItem = {
  href: string;
  title: string;
  cta: string;
  image?: string;
  imageAlt?: string;
  color?: string;
  highlightOnHover?: boolean;
};

export const PROJECTS_NAV: RailNavItem = {
  href: "/projects",
  title: "Projects",
  cta: "View all ↗",
  image: "/projects/projects-card.png?v=6",
  imageAlt: "Projects — system diagram",
  highlightOnHover: true,
};

export const MEDIA_NAV: RailNavItem = {
  href: "/media",
  title: "Media",
  cta: "View archive ↗",
  image: "/media/media-card.png?v=1",
  imageAlt: "Media — photos, books, and films",
  highlightOnHover: true,
};

export const BLOGS_NAV: RailNavItem = {
  href: "/blogs",
  title: "Blogs",
  cta: "Read posts ↗",
};

export const TRAINING_NAV: RailNavItem = {
  href: "/training",
  title: "Training",
  cta: "View activity ↗",
};
