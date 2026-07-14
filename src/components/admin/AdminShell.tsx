"use client";

import type { User } from "@supabase/supabase-js";
import { useTheme } from "next-themes";
import { ExternalLinkIcon, MoonIcon, SunIcon } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminUploadAttachmentStack } from "@/components/admin/AdminUploadAttachmentStack";
import { AdminUploadProvider } from "@/components/admin/AdminUploadProvider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

type AdminShellProps = {
  user: User;
  children: React.ReactNode;
};

export function AdminShell({ user, children }: AdminShellProps) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <TooltipProvider delayDuration={0}>
      <AdminUploadProvider>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "220px",
              "--header-height": "3.5rem",
            } as React.CSSProperties
          }
        >
          <AppSidebar user={user} />
          <SidebarInset className="bg-[#fafafa] dark:bg-[#111111]">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b border-neutral-200 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 dark:border-neutral-800">
              <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <AdminBreadcrumb />
              </div>
              <div className="flex items-center gap-1.5 px-4">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden h-8 text-[12px] text-neutral-600 sm:inline-flex"
                >
                  <a href="/" target="_blank" rel="noreferrer">
                    <ExternalLinkIcon />
                    View website
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-neutral-600"
                  aria-label="Toggle theme"
                  onClick={() =>
                    setTheme(resolvedTheme === "dark" ? "light" : "dark")
                  }
                >
                  <SunIcon className="hidden dark:block" />
                  <MoonIcon className="dark:hidden" />
                </Button>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0 md:p-6">
              <div className="mx-auto w-full max-w-[1500px] flex-1">
                {children}
              </div>
            </div>
          </SidebarInset>
          <AdminUploadAttachmentStack />
        </SidebarProvider>
      </AdminUploadProvider>
    </TooltipProvider>
  );
}
