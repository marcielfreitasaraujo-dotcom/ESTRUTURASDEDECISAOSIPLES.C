"use client";

import { useEffect } from "react";
import { isStaleClientBuild } from "@/lib/app-build";

const STORAGE_KEY = "comanda-ia-build";
const BAKED_BUILD = process.env.NEXT_PUBLIC_APP_BUILD ?? "";

async function liveBuild() {
  const response = await fetch("/api/version", { cache: "no-store" });
  if (!response.ok) return "";
  const payload = (await response.json()) as { build?: string };
  return payload.build?.trim() ?? "";
}

async function syncBuild() {
  const build = await liveBuild();
  if (!build) return;

  const htmlBuild = document.querySelector('meta[name="comanda-build"]')?.getAttribute("content")?.trim() ?? "";
  const previous = window.localStorage.getItem(STORAGE_KEY);
  window.localStorage.setItem(STORAGE_KEY, build);

  if (!isStaleClientBuild({ live: build, html: htmlBuild, baked: BAKED_BUILD, previous })) return;

  const guard = `comanda-ia-reloaded-${build}`;
  if (window.sessionStorage.getItem(guard) === "1") return;
  window.sessionStorage.setItem(guard, "1");
  window.location.reload();
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
  useEffect(() => {
    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker?.addEventListener("controllerchange", onControllerChange);

    void registerWorker().then(() => syncBuild());

    const onVisible = () => {
      if (document.visibilityState === "hidden") return;
      void navigator.serviceWorker?.getRegistration().then((registration) => registration?.update());
      void syncBuild();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("pageshow", onVisible);
    window.addEventListener("online", onVisible);
    const timer = window.setInterval(onVisible, 20_000);

    return () => {
      navigator.serviceWorker?.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("pageshow", onVisible);
      window.removeEventListener("online", onVisible);
      window.clearInterval(timer);
    };
  }, []);
  return null;
}