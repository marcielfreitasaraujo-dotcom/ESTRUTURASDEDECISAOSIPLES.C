"use client";

import { useEffect } from "react";

export function MotionRoot() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const canHover = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    if (reduced || !canHover) return;

    let mx = 0;
    let my = 0;
    let targetX = 0;
    let targetY = 0;
    let frame = 0;

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX / window.innerWidth - 0.5;
      targetY = event.clientY / window.innerHeight - 0.5;
    };

    const tick = () => {
      mx += (targetX - mx) * 0.14;
      my += (targetY - my) * 0.14;
      root.style.setProperty("--mx", mx.toFixed(4));
      root.style.setProperty("--my", my.toFixed(4));
      frame = window.requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    frame = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
