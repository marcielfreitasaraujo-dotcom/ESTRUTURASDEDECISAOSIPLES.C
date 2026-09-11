"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ROUTES: Record<string, string> = {
  F2: "/caixa/pdv",
  F3: "/caixa/pedidos",
  F4: "/caixa/pagamentos",
  F5: "",
  F6: "/caixa",
  F7: "/caixa/sangria",
  F8: "/caixa/suprimento",
  F9: "/caixa/conferencia",
  F10: "/caixa/fechamento",
};

export function CashierHotkeys() {
  const router = useRouter();
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        const dialog = document.querySelector("[data-slot=dialog-close], [data-slot=sheet-close]");
        if (dialog instanceof HTMLElement) dialog.click();
        return;
      }
      const href = ROUTES[event.key];
      if (!href && event.key !== "F5") return;
      event.preventDefault();
      if (event.key === "F5") {
        router.refresh();
        return;
      }
      router.push(href);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
  return null;
}
