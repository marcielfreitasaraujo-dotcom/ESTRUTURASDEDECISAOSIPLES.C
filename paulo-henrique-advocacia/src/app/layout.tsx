import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { FloatingActions } from "@/components/layout/FloatingActions";
import { Header } from "@/components/layout/Header";
import { JsonLd } from "@/components/seo/JsonLd";
import { site } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Paulo Henrique Advocacia Previdenciária | Estreito - MA",
    template: `%s | ${site.shortName}`,
  },
  description: site.description,
  keywords: [
    "advogado previdenciário Estreito MA",
    "aposentadoria INSS",
    "BPC LOAS",
    "auxílio-doença",
    "aposentadoria rural",
    "pensão por morte",
    "advocacia previdenciária Maranhão",
  ],
  authors: [{ name: site.name }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: site.url,
    siteName: site.name,
    title: "Paulo Henrique Advocacia Previdenciária | Estreito - MA",
    description: site.description,
    images: [
      {
        url: "/images/og.jpg",
        width: 1200,
        height: 630,
        alt: site.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Paulo Henrique Advocacia Previdenciária | Estreito - MA",
    description: site.description,
    images: ["/images/og.jpg"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/images/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/favicon-64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: [{ url: "/images/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="flex min-h-svh flex-col bg-ivory font-sans text-ink">
        <JsonLd />
        <a className="skip-link" href="#conteudo">
          Ir para o conteúdo
        </a>
        <Header />
        <main id="conteudo" className="flex-1">
          {children}
        </main>
        <Footer />
        <FloatingActions />
      </body>
    </html>
  );
}
