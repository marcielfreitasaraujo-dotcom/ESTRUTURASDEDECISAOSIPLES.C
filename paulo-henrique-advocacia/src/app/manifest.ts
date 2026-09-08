import type { MetadataRoute } from "next";
import { withBase } from "@/lib/paths";
import { site } from "@/lib/site";

export const dynamic = "force-static";

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
        src: withBase("/images/favicon-32.png"),
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: withBase("/images/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
