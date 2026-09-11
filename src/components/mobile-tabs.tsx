"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItemActive, type NavItem } from "@/domain/rbac/nav";
import { cn } from "@/lib/utils";

export function MobileTabs({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  if (items.length < 2) return null;

  return (
    <nav
      aria-label="Atalhos"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-950/95 px-1 pt-1 md:hidden"
      style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))" }}
    >
      <div className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = navItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-12 min-w-0 items-center justify-center px-1 text-center text-[11px] font-medium leading-tight",
                active ? "text-primary" : "text-zinc-400",
              )}
            >
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
