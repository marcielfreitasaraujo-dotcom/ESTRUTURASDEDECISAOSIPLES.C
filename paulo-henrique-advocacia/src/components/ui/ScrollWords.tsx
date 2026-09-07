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
  stagger = 160,
  mouse = true,
  immediate = false,
}: {
  text: string;
  className?: string;
  stagger?: number;
  mouse?: boolean;
  immediate?: boolean;
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

    const reveal = () => {
      window.requestAnimationFrame(() => setActive(true));
    };

    if (immediate) {
      const start = window.setTimeout(reveal, 420);
      return () => window.clearTimeout(start);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold: 0.35, rootMargin: "0px 0px -18% 0px" },
    );

    observer.observe(node);

    const fallback = window.setTimeout(reveal, 12000);
    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, [immediate]);

  useEffect(() => {
    if (!active) return;
    const timeout = window.setTimeout(
      () => setSettled(true),
      words.length * stagger + 1400,
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
