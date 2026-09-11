import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
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
