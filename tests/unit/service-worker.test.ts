import { describe, expect, it } from "vitest";
import { isStaleClientBuild } from "@/lib/app-build";
import { serviceWorkerScript } from "@/lib/service-worker";

describe("serviceWorkerScript", () => {
  it("muda o cache a cada deploy e nunca guarda HTML das telas", () => {
    const script = serviceWorkerScript("abc123");
    expect(script).toContain('const BUILD = "abc123"');
    expect(script).toContain("comanda-ia-static-");
    expect(script).toContain("self.skipWaiting()");
    expect(script).toContain("clients.claim()");
    expect(script).toContain('cache: "no-store"');
    expect(script).toContain('url.pathname === "/entrar"');
    expect(script).toContain('url.pathname.startsWith("/loja")');
  });
});

describe("isStaleClientBuild", () => {
  it("não recarrega quando o cliente já está no build ao vivo", () => {
    expect(
      isStaleClientBuild({ live: "v2", html: "v2", baked: "v2", previous: "v2" }),
    ).toBe(false);
  });

  it("recarrega quando o atalho ainda tem a versão antiga", () => {
    expect(
      isStaleClientBuild({ live: "v2", html: "v1", baked: "v1", previous: "v1" }),
    ).toBe(true);
  });
});