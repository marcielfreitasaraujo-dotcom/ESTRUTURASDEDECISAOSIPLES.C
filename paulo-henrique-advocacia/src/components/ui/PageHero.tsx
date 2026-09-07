import { ButtonLink } from "@/components/ui/ButtonLink";
import { ScrollWords } from "@/components/ui/ScrollWords";

export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="bg-navy px-4 pt-32 pb-16 text-ivory sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-5 text-4xl text-ivory sm:text-5xl">
          <ScrollWords text={title} />
        </h1>
        {subtitle ? (
          <p className="mt-5 max-w-2xl text-lg text-ivory/75">{subtitle}</p>
        ) : null}
        <div className="mt-8">
          <ButtonLink href="/" variant="outline-light">
            Voltar ao início
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
