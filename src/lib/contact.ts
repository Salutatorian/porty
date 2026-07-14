export const GITHUB_URL = "https://github.com/Salutatorian";
export const LINKEDIN_URL =
  "https://www.linkedin.com/in/joshua-waldo-8b8023394/";
export const EMAIL = "contactjoshuawaldo@gmail.com";
export const CAL_URL = "https://cal.com/josh-allen-v1jqpl";

export const CONTACT_LINKS = [
  {
    id: "linkedin",
    label: "LinkedIn",
    href: LINKEDIN_URL,
    external: true,
  },
  {
    id: "github",
    label: "GitHub",
    href: GITHUB_URL,
    external: true,
  },
  {
    id: "email",
    label: "Email",
    href: `mailto:${EMAIL}`,
    external: false,
  },
  {
    id: "schedule",
    label: "Book a call",
    href: CAL_URL,
    external: true,
  },
] as const;
