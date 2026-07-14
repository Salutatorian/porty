"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {  CARD_IMAGE_CLASS,
  CARD_IMAGE_SHADOW_CLASS,
  CARD_LINK_CLASS,
} from "@/lib/card";
import type { Project } from "@/lib/projects";

type ProjectCardProps = {
  project: Project;
  index: number;
};

export function ProjectCard({ project, index }: ProjectCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      className={`${CARD_LINK_CLASS} select-none`}
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.45,
        delay: reduceMotion ? 0 : index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Link
        href={`/projects/${project.slug}`}
        draggable={false}
        className="group block outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-4 dark:focus-visible:ring-white/20"
      >
        <div
          className={`${CARD_IMAGE_CLASS} ${CARD_IMAGE_SHADOW_CLASS}`}
          style={{ backgroundColor: project.image ? undefined : project.color }}
        >
          {project.image ? (
            <motion.div
              className="relative h-full w-full"
              whileHover={reduceMotion ? undefined : { scale: 1.02 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image
                src={project.image}
                alt={project.imageAlt}
                fill
                className="object-cover"
                draggable={false}
              />
            </motion.div>
          ) : (
            <motion.div
              className="flex h-full w-full items-center justify-center p-8"
              whileHover={reduceMotion ? undefined : { scale: 1.02 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="rounded-2xl border border-black/[0.05] bg-white/55 px-4 py-3 text-center text-[11px] uppercase tracking-[0.18em] text-foreground/45 dark:border-white/[0.08] dark:bg-black/20">
                {project.title}
              </span>
            </motion.div>
          )}
        </div>

        <div className="mt-4 px-1">
          <h3 className="text-[15px] font-medium text-foreground">
            {project.title}
          </h3>
        </div>      </Link>
    </motion.article>
  );
}
