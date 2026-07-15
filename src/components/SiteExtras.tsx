import { headers } from "next/headers";
import { BottomMusicPlayerShell } from "@/components/BottomMusicPlayerShell";
import { SiteChrome } from "@/components/SiteChrome";
import { SiteFooter } from "@/components/SiteFooter";

export async function SiteExtras() {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <SiteChrome>
      <SiteFooter />
      <BottomMusicPlayerShell />
    </SiteChrome>
  );
}
