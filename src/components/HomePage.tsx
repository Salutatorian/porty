"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { AboutPanel } from "@/components/AboutPanel";
import { PortfolioIntro } from "@/components/PortfolioIntro";
import { ProjectRail } from "@/components/ProjectRail";
import { RailNavCard } from "@/components/RailNavCard";
import {
  BLOGS_NAV,
  MEDIA_NAV,
  PROJECTS_NAV,
  TRAINING_NAV,
} from "@/lib/rail-nav";
import { SimpleDock, type DockView } from "@/components/simple-dock";
import { AdminSecretThemeToggle } from "@/components/admin/AdminSecretThemeToggle";

export function HomePage() {
  const [activeView, setActiveView] = useState<DockView>("projects");
  const reduceMotion = useReducedMotion();

  const sectionMotion = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
      }
    : {
        initial: { opacity: 0, y: 8, filter: "blur(4px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -6, filter: "blur(4px)" },
        transition: { duration: 0.25 },
      };

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#fdfcf9] pb-28 text-black dark:bg-[#101010] dark:text-white">
      <div className="fixed left-1/2 top-8 z-50 flex -translate-x-1/2 items-center gap-3">
        <SimpleDock activeView={activeView} onViewChange={setActiveView} />
        <AdminSecretThemeToggle />
      </div>

      <section className="w-full px-6 pt-32 sm:pt-36">
        <PortfolioIntro />
      </section>

      <AnimatePresence mode="wait" initial={false}>
        {activeView === "projects" ? (
          <motion.section
            key="projects"
            className="mt-20 w-full"
            {...sectionMotion}
          >
            <ProjectRail>
              <RailNavCard {...PROJECTS_NAV} index={0} />
              <RailNavCard {...MEDIA_NAV} index={1} />
              <RailNavCard {...BLOGS_NAV} index={2} />
              <RailNavCard {...TRAINING_NAV} index={3} />
            </ProjectRail>
          </motion.section>
        ) : (
          <motion.section
            key="about"
            className="mt-20 w-full px-6"
            {...sectionMotion}
          >
            <div className="mx-auto max-w-xl">
              <AboutPanel />
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
