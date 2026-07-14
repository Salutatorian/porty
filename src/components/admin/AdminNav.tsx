import Link from "next/link";
import { signOutAdmin } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/media/photos", label: "Photos" },
  { href: "/admin/media/books", label: "Books" },
  { href: "/admin/media/movies", label: "Movies" },
  { href: "/admin/blogs", label: "Blogs" },
];

export function AdminNav({ active }: { active?: string }) {
  return (
    <ButtonGroup className="flex-wrap">
      {links.map((link) => (
        <Button
          key={link.href}
          variant={active === link.href ? "default" : "outline"}
          asChild
        >
          <Link href={link.href}>{link.label}</Link>
        </Button>
      ))}
      <form action={signOutAdmin}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </ButtonGroup>
  );
}
