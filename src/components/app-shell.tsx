"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Menu, Search } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { BrandWordmark } from "@/components/brand";
import { MobileTabs } from "@/components/mobile-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/initials";
import { navIcon } from "@/components/ds/nav-icon";
import { navItemActive, type NavGroup, type NavItem } from "@/domain/rbac/nav";
import type { ControlAlert } from "@/domain/dashboard/control-center";

function NavLinks({
  items,
  groups,
  footerItems,
  onNavigate,
}: {
  items: NavItem[];
  groups?: NavGroup[];
  footerItems?: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const sections = groups?.length ? groups : [{ id: "main", label: "", items }];

  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 space-y-5 overflow-y-auto pb-4" aria-label="Principal">
        {sections.map((group) => (
          <div key={group.id} className="grid gap-0.5">
            {group.label ? (
              <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {group.label}
              </p>
            ) : null}
            {group.items.map((item) => {
              const active = navItemActive(pathname, item.href);
              const Icon = navIcon(item.href);
              return (
                <Link
                  key={`${group.id}-${item.href}`}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors",
                    active
                      ? "bg-primary font-medium text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0 opacity-90" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      {footerItems && footerItems.length > 0 ? (
        <div className="grid gap-0.5 border-t border-sidebar-border pt-3">
          {footerItems.map((item) => {
            const Icon = navIcon(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className="flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function SidebarBrand({ homeHref, storeName, title }: { homeHref: string; storeName?: string; title: string }) {
  return (
    <div className="grid gap-3">
      <Link href={homeHref} className="flex items-center gap-2 px-1">
        <span className="grid size-8 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
          IA
        </span>
        <BrandWordmark className="text-base" />
      </Link>
      <div className="rounded-xl border border-border bg-card px-3 py-2.5">
        <p className="truncate text-sm font-medium text-foreground">{storeName || title}</p>
        <p className="text-[11px] text-muted-foreground">{storeName ? "Estabelecimento" : "Comanda IA"}</p>
      </div>
    </div>
  );
}

export function AppShell({
  title,
  items,
  groups,
  footerItems,
  tabs,
  userName,
  roleLabel,
  storeName,
  homeHref = "/app",
  enableOpsChrome = false,
  children,
}: {
  title: string;
  items: NavItem[];
  groups?: NavGroup[];
  footerItems?: NavItem[];
  tabs?: NavItem[];
  userName: string;
  roleLabel?: string;
  storeName?: string;
  homeHref?: string;
  enableOpsChrome?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const mobileTabs = tabs && tabs.length > 1 ? tabs : [];
  const operational =
    pathname.startsWith("/caixa") ||
    pathname.startsWith("/garcom") ||
    pathname.startsWith("/entrega") ||
    pathname.startsWith("/app/salao") ||
    pathname.startsWith("/app/pedidos");

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="flex min-h-dvh">
        <aside className="hidden w-[var(--width-sidebar)] shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-3 md:flex">
          <SidebarBrand homeHref={homeHref} storeName={storeName} title={title} />
          <div className="mt-5 min-h-0 flex-1 overflow-y-auto">
            <NavLinks items={items} groups={groups} footerItems={footerItems} />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur md:gap-3 md:px-6"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <div className="md:hidden">
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" aria-label="Abrir menu">
                    <Menu className="size-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex w-[min(18rem,100%)] flex-col gap-0 bg-sidebar p-0">
                  <SheetHeader className="shrink-0 px-3 pb-2 pt-4">
                    <SheetTitle className="text-left">
                      <SidebarBrand homeHref={homeHref} storeName={storeName} title={title} />
                    </SheetTitle>
                  </SheetHeader>
                  <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                    <NavLinks items={items} groups={groups} footerItems={footerItems} onNavigate={() => setMenuOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <div className="hidden min-w-0 flex-1 sm:block">
              <OpsSearch />
            </div>
            <div className="min-w-0 flex-1 sm:hidden" />
            <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-2">
              {enableOpsChrome ? <OpsNotifications /> : null}
              <div className="hidden min-w-0 items-center gap-2 sm:flex">
                <Avatar size="sm">
                  <AvatarFallback>{initials(userName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm font-medium">{userName}</p>
                  {roleLabel ? <p className="truncate text-[11px] text-muted-foreground">{roleLabel}</p> : null}
                </div>
              </div>
              <form action={signOutAction}>
                <Button type="submit" variant="ghost" size="sm">
                  Sair
                </Button>
              </form>
            </div>
          </header>
          <main
            className={cn(
              "min-w-0 flex-1 overflow-x-hidden px-4 py-5 md:px-8 md:py-6",
              !operational && "mx-auto w-full max-w-[1500px]",
              mobileTabs.length > 0 && "pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-6",
            )}
          >
            {children}
          </main>
        </div>
      </div>
      <MobileTabs items={mobileTabs} />
      {enableOpsChrome ? <OpsShortcuts /> : null}
    </div>
  );
}

function OpsSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    customers: { id: string; name: string; phone: string }[];
    orders: { id: string; publicCode: string; customerName: string }[];
    products: { id: string; name: string }[];
    tables: { id: string; number: string; status: string; customerName: string | null }[];
    staff: { role: string; user: { id: string; name: string } }[];
  } | null>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open || query.trim().length < 2) return;
    const timer = window.setTimeout(async () => {
      const response = await fetch(`/api/app/busca?q=${encodeURIComponent(query)}`, { cache: "no-store" });
      if (response.ok) setResults(await response.json());
    }, 200);
    return () => window.clearTimeout(timer);
  }, [open, query]);

  const visibleResults = open && query.trim().length >= 2 ? results : null;

  return (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar pedido, cliente, mesa, operador ou caixa…"
        className="h-10 max-w-3xl pl-9"
        aria-label="Buscar pedido, cliente, mesa, operador ou caixa"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground md:inline">
        F3
      </span>
      {visibleResults ? (
        <div className="absolute z-40 mt-1 max-h-72 w-full max-w-3xl overflow-y-auto overflow-x-hidden rounded-xl border border-border bg-popover p-2 text-sm shadow-none">
          <ResultGroup title="Pedidos" items={visibleResults.orders.map((item) => ({ href: "/app/pedidos", label: `#${item.publicCode} · ${item.customerName}` }))} onPick={() => setOpen(false)} />
          <ResultGroup title="Clientes" items={visibleResults.customers.map((item) => ({ href: "/app/clientes", label: `${item.name} · ${item.phone}` }))} onPick={() => setOpen(false)} />
          <ResultGroup title="Produtos" items={visibleResults.products.map((item) => ({ href: "/app/cardapio", label: item.name }))} onPick={() => setOpen(false)} />
          <ResultGroup title="Mesas" items={visibleResults.tables.map((item) => ({ href: "/app/salao", label: `Mesa ${item.number}${item.customerName ? ` · ${item.customerName}` : ""}` }))} onPick={() => setOpen(false)} />
          <ResultGroup title="Equipe" items={visibleResults.staff.map((item) => ({ href: "/app/equipe", label: item.user.name }))} onPick={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}

function ResultGroup({
  title,
  items,
  onPick,
}: {
  title: string;
  items: { href: string; label: string }[];
  onPick: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="grid gap-1 p-1">
      <p className="px-2 text-[11px] uppercase tracking-wide text-muted-foreground">{title}</p>
      {items.map((item) => (
        <Link key={item.label} href={item.href} className="rounded-md px-2 py-1.5 hover:bg-muted" onClick={onPick}>
          {item.label}
        </Link>
      ))}
    </div>
  );
}

function OpsNotifications() {
  const router = useRouter();
  const [items, setItems] = useState<ControlAlert[]>([]);
  useEffect(() => {
    let active = true;
    async function load() {
      const response = await fetch("/api/app/painel?range=today", { cache: "no-store" });
      if (!response.ok || !active) return;
      const data = (await response.json()) as { notifications?: ControlAlert[] };
      setItems(data.notifications ?? []);
    }
    void load();
    const timer = window.setInterval(() => void load(), 12000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="relative" aria-label="Alertas">
          <Bell className="size-4" />
          {items.length > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {Math.min(items.length, 9)}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(20rem,calc(100vw-1.5rem))]">
        <DropdownMenuLabel>Notificações da operação</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? <DropdownMenuItem disabled>Nada pendente agora</DropdownMenuItem> : null}
        {items.map((item) => (
          <DropdownMenuItem key={item.id} onClick={() => router.push(item.href)}>
            <span className="grid gap-0.5">
              <span>{item.title}</span>
              <span className="text-xs text-muted-foreground">{item.detail}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function OpsShortcuts() {
  const router = useRouter();
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === "p") {
        event.preventDefault();
        router.push("/garcom");
      }
      if (key === "m") {
        event.preventDefault();
        router.push("/app/salao");
      }
      if (key === "f") {
        event.preventDefault();
        router.push("/app/financeiro");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
  return null;
}
