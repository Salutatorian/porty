import {
  FileText,
  FolderKanban,
  Gauge,
  Images,
  Music,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type AdminNavSection = {
  label: string;
  items: AdminNavItem[];
};

export const adminNavigation: AdminNavSection[] = [
  {
    label: "Dashboard",
    items: [{ label: "Overview", href: "/admin", icon: Gauge }],
  },
  {
    label: "Content",
    items: [
      { label: "Projects", href: "/admin/projects", icon: FolderKanban },
      { label: "Photos", href: "/admin/photos", icon: Images },
      { label: "Blogs", href: "/admin/blogs", icon: FileText },
      { label: "Music player", href: "/admin/music", icon: Music },
    ],
  },
];

export function getAdminBreadcrumbs(pathname: string) {
  const crumbs: { label: string; href?: string }[] = [
    { label: "Admin", href: "/admin" },
  ];

  for (const section of adminNavigation) {
    for (const item of section.items) {
      if (pathname === item.href) {
        crumbs.push({ label: section.label });
        crumbs.push({ label: item.label });
        return crumbs;
      }
    }
  }

  if (pathname.startsWith("/admin")) {
    const tail = pathname.replace("/admin", "").split("/").filter(Boolean);
    tail.forEach((part) => {
      crumbs.push({ label: part.charAt(0).toUpperCase() + part.slice(1) });
    });
  }

  return crumbs;
}
