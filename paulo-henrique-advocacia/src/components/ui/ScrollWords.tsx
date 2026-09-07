"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { cn } from "@/lib/cn";

export function ScrollWords({
  text,
  className,
  stagger = 55,
  mouse = true,
}: {
  text: string;
  className?: string;
  stagger?: number;
  mouse?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(false);
  const [settled, setSettled] = useState(false);
  const words = text.trim().split(/\s+/);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      setActive(true);
      setSettled(true);
      return;
    }

    const updateProgress = () => {
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const start = vh * 0.9;
      const end = vh * 0.22;
      const progress = (start - rect.top) / Math.max(start - end, 1);
      node.style.setProperty(
        "--p",
        Math.min(1, Math.max(0, progress)).toFixed(3),
      );
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(node);
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    const fallback = window.setTimeout(() => setActive(true), 2200);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      window.clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const timeout = window.setTimeout(
      () => setSettled(true),
      words.length * stagger + 520,
    );
    return () => window.clearTimeout(timeout);
  }, [active, stagger, words.length]);

  return (
    <span
      ref={ref}
      className={cn(
        "scroll-words",
        active && "is-active",
        settled && "is-settled",
        mouse && "has-mouse",
        className,
      )}
    >
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="scroll-word"
          style={
            {
              "--i": index,
              "--n": words.length,
              transitionDelay: settled ? "0ms" : `${index * stagger}ms`,
            } as CSSProperties
          }
        >
          {word}
        </span>
      ))}
    </span>
  );
}
