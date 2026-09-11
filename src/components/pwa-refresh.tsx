"use client";

import { useEffect, useState } from "react";
import { isStaleClientBuild } from "@/lib/app-build";

const STORAGE_KEY = "comanda-ia-build";
const BAKED_BUILD = process.env.NEXT_PUBLIC_APP_BUILD ?? "";

async function liveBuild() {
  const response = await fetch("/api/version", { cache: "no-store" });
  if (!response.ok) return "";
  const payload = (await response.json()) as { build?: string };
  return payload.build?.trim() ?? "";
}

async function clearSiteCaches() {
  if (!("caches" in window)) return;
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
}

async function reloadToLive(build: string, force = false) {
  await clearSiteCaches();
  const guard = `comanda-ia-reloaded-${build}`;
  if (!force && window.sessionStorage.getItem(guard) === "1") return false;
  window.sessionStorage.setItem(guard, "1");
  window.location.reload();
  return true;
}

async function syncBuild() {
  const build = await liveBuild();
  if (!build) return { stale: false, build: "" };

  const htmlBuild = document.querySelector('meta[name="comanda-build"]')?.getAttribute("content")?.trim() ?? "";
  const previous = window.localStorage.getItem(STORAGE_KEY);
  const stale = isStaleClientBuild({ live: build, html: htmlBuild, baked: BAKED_BUILD, previous });
  window.localStorage.setItem(STORAGE_KEY, build);
  return { stale, build };
}

async function registerWorker() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
  await registration.update();
  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    if (!worker) return;
    worker.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        worker.postMessage("SKIP_WAITING");
      }
    });
  });
  if (registration.waiting) registration.waiting.postMessage("SKIP_WAITING");
}

export function PwaRefresh() {
  const [banner, setBanner] = useState(false);

  useEffect(() => {
    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    const apply = async (force = false) => {
      const { stale, build } = await syncBuild();
      if (!stale || !build) return;
      setBanner(true);
      await reloadToLive(build, force);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "COMANDA_UPDATED") void apply(true);
    };
    navigator.serviceWorker?.addEventListener("controllerchange", onControllerChange);
    navigator.serviceWorker?.addEventListener("message", onMessage);

    void registerWorker().then(() => apply());

    const onVisible = () => {
      if (document.visibilityState === "hidden") return;
      void navigator.serviceWorker?.getRegistration().then((registration) => registration?.update());
      void apply();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("pageshow", onVisible);
    window.addEventListener("online", onVisible);
    const timer = window.setInterval(onVisible, 12_000);

    return () => {
      navigator.serviceWorker?.removeEventListener("controllerchange", onControllerChange);
      navigator.serviceWorker?.removeEventListener("message", onMessage);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("pageshow", onVisible);
      window.removeEventListener("online", onVisible);
      window.clearInterval(timer);
    };
  }, []);

  if (!banner) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] border-t border-orange-500/50 bg-zinc-950 px-4 py-3 text-center text-sm text-white shadow-2xl">
      <p className="font-medium">Nova versão do Comanda IA.</p>
      <p className="mt-1 text-zinc-400">Atualizando o atalho deste aparelho. Não precisa apagar o ícone.</p>
      <button
        type="button"
        className="mt-2 rounded-lg bg-orange-500 px-4 py-2 font-medium text-black"
        onClick={() => {
          void (async () => {
            const { build } = await syncBuild();
            if (build) await reloadToLive(build, true);
            else window.location.reload();
          })();
        }}
      >
        Atualizar agora
      </button>
    </div>
  );
}
