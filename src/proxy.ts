import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request, { cookiePrefix: "comanda" });
  const needsAuth =
    pathname.startsWith("/app") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/garcom") ||
    pathname.startsWith("/caixa") ||
    pathname.startsWith("/entrega");
  if (needsAuth && !sessionCookie) {
    const login = NextResponse.redirect(new URL("/entrar", request.url));
    login.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return login;
  }
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  return response;
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*", "/garcom/:path*", "/caixa/:path*", "/entrega/:path*"],
};
