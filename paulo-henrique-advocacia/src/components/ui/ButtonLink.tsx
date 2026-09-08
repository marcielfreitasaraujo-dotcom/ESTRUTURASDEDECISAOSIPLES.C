import { cn } from "@/lib/cn";
import { withBase } from "@/lib/paths";
import { whatsappUrl } from "@/lib/site";

type Variant = "gold" | "outline-light" | "outline-dark" | "ghost";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  external?: boolean;
  ariaLabel?: string;
};

const variants: Record<Variant, string> = {
  gold: "bg-gold text-navy hover:bg-gold-soft",
  "outline-light":
    "border border-gold/70 text-ivory hover:bg-gold hover:text-navy",
  "outline-dark":
    "border border-navy/20 text-navy hover:border-gold hover:text-navy",
  ghost: "text-gold hover:text-gold-soft",
};

export function ButtonLink({
  href,
  children,
  variant = "gold",
  className,
  external,
  ariaLabel,
}: Props) {
  const isExternal =
    external ?? (href.startsWith("http") || href.startsWith("mailto:"));

  return (
    <a
      href={isExternal ? href : withBase(href)}
      aria-label={ariaLabel}
      {...(isExternal
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 px-6 text-[0.78rem] font-semibold tracking-[0.14em] uppercase transition-colors duration-300",
        variants[variant],
        className,
      )}
    >
      {children}
    </a>
  );
}

export function WhatsAppButton({
  children,
  message,
  variant = "gold",
  className,
  ariaLabel = "Falar com o escritório pelo WhatsApp",
}: {
  children: React.ReactNode;
  message?: string;
  variant?: Variant;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <ButtonLink
      href={whatsappUrl(message)}
      variant={variant}
      className={className}
      external
      ariaLabel={ariaLabel}
    >
      {children}
    </ButtonLink>
  );
}
