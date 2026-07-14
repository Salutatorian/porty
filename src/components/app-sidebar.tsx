"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLinkIcon,
  LogOutIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { adminNavigation } from "@/lib/admin/navigation";
import { signOutAdmin } from "@/lib/admin/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

type AppSidebarProps = {
  user: User;
};

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const email = user.email ?? "admin";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#161616]"
    >
      <SidebarContent className="gap-0 px-2 py-3">
        {adminNavigation.map((section) => (
          <SidebarGroup key={section.label} className="p-0">
            <SidebarGroupLabel className="px-2 text-[10px] font-medium tracking-[0.14em] text-neutral-400 uppercase">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin" &&
                      pathname.startsWith(`${item.href}/`));

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                        className="h-8 rounded-[7px] text-[13px] text-neutral-500 data-[active=true]:bg-neutral-100 data-[active=true]:font-medium data-[active=true]:text-neutral-900 dark:data-[active=true]:bg-neutral-800 dark:data-[active=true]:text-neutral-100"
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-neutral-200 p-2 dark:border-neutral-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-[7px] px-2 py-1.5 text-left outline-none transition hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-300 group-data-[collapsible=icon]:justify-center dark:hover:bg-neutral-800/80 dark:focus-visible:ring-neutral-600"
              aria-label="Account menu"
            >
              <Avatar className="size-7 rounded-md">
                <AvatarFallback className="rounded-md bg-neutral-100 text-[11px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                  JW
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-[12px] font-medium text-neutral-900 dark:text-neutral-100">
                  Joshua Waldo
                </p>
                <p className="truncate text-[11px] text-neutral-500">{email}</p>
              </div>
              <MoreHorizontalIcon className="size-4 shrink-0 text-neutral-500 group-data-[collapsible=icon]:hidden" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="end"
            sideOffset={8}
            collisionPadding={12}
            className="z-50 w-48"
          >
            <DropdownMenuItem asChild>
              <a href="/" target="_blank" rel="noreferrer">
                <ExternalLinkIcon />
                View website
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                void signOutAdmin();
              }}
            >
              <LogOutIcon />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
