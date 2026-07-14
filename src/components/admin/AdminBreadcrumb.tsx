"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getAdminBreadcrumbs } from "@/lib/admin/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function AdminBreadcrumb() {
  const pathname = usePathname();
  const crumbs = getAdminBreadcrumbs(pathname);
  const parent = crumbs.length > 2 ? crumbs[crumbs.length - 2] : crumbs[0];
  const current = crumbs[crumbs.length - 1];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {parent && parent.href && parent.label !== current?.label ? (
          <>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink asChild>
                <Link href={parent.href}>{parent.label}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
          </>
        ) : null}
        <BreadcrumbItem>
          <BreadcrumbPage>{current?.label ?? "Admin"}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
