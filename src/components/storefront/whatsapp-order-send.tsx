"use client";

import { useEffect, useRef } from "react";

export function WhatsAppOrderSend({
  href,
  label = "Enviar pedido no WhatsApp",
}: {
  href: string;
  label?: string;
}) {
  const opened = useRef(false);

  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    const timer = window.setTimeout(() => {
      window.location.assign(href);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [href]);

  return (
    <a
      href={href}
      className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white"
    >
      {label}
    </a>
  );
}
