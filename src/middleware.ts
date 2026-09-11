import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const dest = request.headers.get("sec-fetch-dest");
  const accept = request.headers.get("accept") ?? "";
  const isDocument = dest === "document" || accept.includes("text/html");
  const isWorker = request.nextUrl.pathname === "/sw.js" || dest === "serviceworker";
  const isVersion = request.nextUrl.pathname === "/api/version";

  if (isDocument || isWorker || isVersion) {
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    response.headers.set("Pragma", "no-cache");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icons/|uploads/).*)"],
};