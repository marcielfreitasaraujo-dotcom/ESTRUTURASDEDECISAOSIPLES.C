"use client";

import { useEffect } from "react";

const STORAGE_KEY = "comanda-ia-build";

async function syncBuild() {
  const response = await fetch("/api/version", { cache: "no-store" });
  if (!response.ok) return;
  const payload = (await response.json()) as { build?: string };
  const build = payload.build?.trim();
  if (!build) return;
  const previous = window.localStorage.getItem(STORAGE_KEY);
  window.localStorage.setItem(STORAGE_KEY, build);
  if (previous && previous !== build) {
    window.location.reload();
  }
}

export function PwaRefresh() {
  useEffect(() => {
    void syncBuild();
    const onVisible = () => {
      if (document.visibilityState === "visible") void syncBuild();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onVisible);
    const timer = window.setInterval(() => void syncBuild(), 45_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onVisible);
      window.clearInterval(timer);
    };
  }, []);
  return null;
}
