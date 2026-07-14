import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { BottomMusicPlayerShell } from "@/components/BottomMusicPlayerShell";
import { SiteChrome } from "@/components/SiteChrome";
import { SiteFooter } from "@/components/SiteFooter";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "Joshua Waldo",
  description:
    "Software engineer, designer, writer, and builder based in Northern Mariana Islands.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <body className="min-h-dvh pb-28 font-sans antialiased">
        <ThemeProvider>
          {children}
          <SiteChrome>
            <SiteFooter />
            <BottomMusicPlayerShell />
          </SiteChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}
