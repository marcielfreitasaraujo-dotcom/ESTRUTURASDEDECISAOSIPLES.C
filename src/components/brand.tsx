import Link from "next/link";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2 font-heading tracking-tight", className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Flame className="size-4" aria-hidden />
      </span>
      {compact ? <span className="sr-only">Forno</span> : <span className="text-lg">Forno</span>}
    </Link>
  );
}
