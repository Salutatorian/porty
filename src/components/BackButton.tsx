import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

type BackButtonProps = {
  href: string;
  label?: string;
};

export function BackButton({ href, label = "Back" }: BackButtonProps) {
  return (
    <ButtonGroup>
      <Button variant="outline" asChild>
        <Link href={href}>
          <ArrowLeftIcon />
          {label}
        </Link>
      </Button>
    </ButtonGroup>
  );
}
