import { Star } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { site } from "@/lib/site";

export function SocialProof() {
  return (
    <section
      aria-label="Avaliações no Google"
      className="border-y border-line bg-paper"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-10 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <div>
          <p className="flex items-center gap-2 font-serif text-2xl text-navy">
            <Star className="h-5 w-5 fill-gold text-gold" aria-hidden />
            {site.google.ratingDisplay} estrelas no Google
          </p>
          <p className="mt-1 text-sm text-muted">
            {site.google.reviewCount} avaliações · Atendimento reconhecido pelos
            clientes
          </p>
        </div>
        <ButtonLink href={site.google.reviewsUrl} variant="outline-dark" external>
          Ver avaliações
        </ButtonLink>
      </div>
    </section>
  );
}
