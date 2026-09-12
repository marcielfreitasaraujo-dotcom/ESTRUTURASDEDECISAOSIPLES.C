import type { NextConfig } from "next";
import { execSync } from "node:child_process";
import { resolveDeployBuildId } from "./src/lib/app-build";

function commitFromGit() {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "dev";
  }
}

const buildId = resolveDeployBuildId() || commitFromGit();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  generateBuildId: async () => buildId,
  env: {
    NEXT_PUBLIC_APP_BUILD: buildId,
  },
  async headers() {
    const noStore = [{ key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" }];
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
      { source: "/", headers: noStore },
      { source: "/loja/:path*", headers: noStore },
      {
        source: "/acompanhar/:path*",
        headers: [...noStore, { key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/loja/:slug/acompanhar",
        headers: [...noStore, { key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/loja/:slug/acompanhar/:path*",
        headers: [...noStore, { key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      { source: "/sw.js", headers: noStore },
      { source: "/manifest.webmanifest", headers: noStore },
      { source: "/entrar", headers: noStore },
      { source: "/app", headers: noStore },
      { source: "/app/:path*", headers: noStore },
      { source: "/caixa", headers: noStore },
      { source: "/caixa/:path*", headers: noStore },
      { source: "/garcom", headers: noStore },
      { source: "/garcom/:path*", headers: noStore },
      { source: "/entrega", headers: noStore },
      { source: "/entrega/:path*", headers: noStore },
      { source: "/admin", headers: noStore },
      { source: "/admin/:path*", headers: noStore },
      { source: "/api/version", headers: noStore },
    ];
  },
};

export default nextConfig;
