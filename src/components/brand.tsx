import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Brand({
  className,
  compact = false,
  href = "/",
}: {
  className?: string;
  compact?: boolean;
  href?: string;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2", className)}>
      {compact ? (
        <Image
          src="/icons/icon-192.png"
          alt="Comanda IA"
          width={36}
          height={36}
          className="size-9 rounded-md"
          priority
        />
      ) : (
        <Image
          src="/brand/comanda-ia-web.png"
          alt="Comanda IA — gestão inteligente para restaurantes"
          width={220}
          height={72}
          className="h-10 w-auto max-w-[220px] object-contain object-left"
          priority
        />
      )}
    </Link>
  );
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <p className={cn("text-lg font-semibold tracking-tight", className)}>
      Comanda<span className="text-primary">IA</span>
    </p>
  );
}
