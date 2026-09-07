import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: "PH Advocacia",
    description: site.description,
    start_url: "/",
    display: "browser",
    background_color: "#0B1C2C",
    theme_color: "#0B1C2C",
    lang: "pt-BR",
    icons: [
      {
        src: "/images/favicon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/images/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
