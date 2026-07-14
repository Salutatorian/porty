export type Project = {
  slug: string;
  title: string;
  category: string;
  year: string;
  summary: string;
  role: string;
  problem: string;
  process: string;
  result: string;
  imageAlt: string;
  /** Placeholder tint when no image asset exists */
  color: string;
  image?: string;
  liveUrl?: string;
  sourceUrl?: string;
  tags: string[];
};

export const PROJECTS: Project[] = [
  {
    slug: "portpaper",
    title: "PortPaper",
    category: "CLI · Java",
    year: "2026",
    summary:
      "Offline CLI and Java library for freight forwarders, customs brokers, and importers — catches paperwork mistakes before you submit shipment documents.",
    role: "Design & development",
    problem:
      "Commercial invoices, packing lists, SLIs, BOLs, and manifests are reviewed manually. Missing fields, mismatched totals, vague descriptions, battery handling gaps, and duplicate tracking numbers are easy to miss until customs pushes back.",
    process:
      "Built parsers for invoices, packing lists, shipper's letters of instruction, shipment logs, HS/tariff tables, tracking numbers, bills of lading, cargo manifests, and freight quotes. Added cross-validation and a full-audit command that consolidates findings across documents.",
    result:
      "A dependency-free Java 17 tool with CLI commands for invoice validation, freight estimates, tracking checks, HS parsing, BOL and manifest review, and cross-document audits — all runnable offline.",
    imageAlt: "PortPaper CLI validation report",
    color: "#e8e6e1",
    sourceUrl: "https://github.com/Salutatorian/portpaper",
    tags: ["Java", "CLI", "Freight", "Customs"],
  },
];

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}
