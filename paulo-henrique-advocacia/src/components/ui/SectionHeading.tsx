import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  light = false,
  align = "left",
  id,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  light?: boolean;
  align?: "left" | "center";
  id?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "eyebrow mb-4",
            light ? "text-gold" : "text-gold",
            align === "center" && "justify-center",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={id}
        className={cn(
          "text-3xl sm:text-4xl lg:text-[2.65rem]",
          light ? "text-ivory" : "text-navy",
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            "mt-5 text-base sm:text-lg leading-relaxed",
            light ? "text-ivory/78" : "text-muted",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
