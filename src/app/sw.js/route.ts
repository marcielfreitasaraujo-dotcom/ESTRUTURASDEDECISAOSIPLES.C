import { getAppBuildId } from "@/lib/app-build";
import { serviceWorkerScript } from "@/lib/service-worker";

export const dynamic = "force-dynamic";

export function GET() {
  return new Response(serviceWorkerScript(getAppBuildId()), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store, max-age=0, must-revalidate",
      "Service-Worker-Allowed": "/",
    },
  });
}