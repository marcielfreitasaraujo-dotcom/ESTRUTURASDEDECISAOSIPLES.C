import { MapPin, Scale, ShieldCheck, UserRound } from "lucide-react";

const items = [
  { icon: UserRound, label: "Atendimento personalizado" },
  { icon: Scale, label: "Atuação especializada" },
  { icon: MapPin, label: "Atendimento online em todo o Brasil" },
  { icon: ShieldCheck, label: "Compromisso com cada caso" },
];

export function TrustBar() {
  return (
    <section
      aria-label="Indicadores de confiança"
      className="border-y border-gold/15 bg-petrol"
    >
      <ul className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {items.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex items-center gap-3 text-sm font-medium tracking-wide text-ivory/90"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-gold/35 text-gold">
              <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
            </span>
            {label}
          </li>
        ))}
      </ul>
    </section>
  );
}
