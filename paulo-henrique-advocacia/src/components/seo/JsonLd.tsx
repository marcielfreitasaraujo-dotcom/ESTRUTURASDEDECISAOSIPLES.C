import { site } from "@/lib/site";

export function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["LegalService", "Attorney"],
        "@id": `${site.url}/#escritorio-schema`,
        name: site.name,
        alternateName: site.shortName,
        legalName: site.legalName,
        description: site.tagline,
        url: site.url,
        image: `${site.url}/images/paulo-henrique.jpg`,
        logo: `${site.url}/images/logo.png`,
        telephone: site.phoneE164,
        email: site.email,
        priceRange: "$$",
        areaServed: [
          { "@type": "City", name: "Estreito" },
          { "@type": "State", name: "Maranhão" },
          { "@type": "Country", name: "BR" },
        ],
        address: {
          "@type": "PostalAddress",
          streetAddress: `${site.address.street} - ${site.address.neighborhood}`,
          addressLocality: site.address.city,
          addressRegion: site.address.region,
          postalCode: site.address.postalCode,
          addressCountry: site.address.country,
        },
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
          ],
          opens: "08:00",
          closes: "18:00",
        },
        sameAs: [site.instagram].filter(Boolean),
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: site.google.ratingValue,
          reviewCount: String(site.google.reviewCount),
          bestRating: "5",
          worstRating: "1",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        url: site.url,
        name: site.name,
        inLanguage: "pt-BR",
        publisher: { "@id": `${site.url}/#escritorio-schema` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
