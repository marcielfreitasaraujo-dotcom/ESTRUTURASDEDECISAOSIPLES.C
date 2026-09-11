"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Menu } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { Brand } from "@/components/brand";
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
import { navItemActive, type NavGroup, type NavItem } from "@/domain/rbac/nav";
import type { ControlAlert } from "@/domain/dashboard/control-center";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

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
  const sections = groups?.length
    ? groups
    : [{ id: "main", label: "", items }];

  return (
    <div className="flex h-full flex-col">
      <nav className="grid flex-1 gap-4 overflow-y-auto pb-4" aria-label="Principal">
        {sections.map((group) => (
          <div key={group.id} className="grid gap-0.5">
            {group.label ? (
              <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-zinc-500">{group.label}</p>
            ) : null}
            {group.items.map((item) => {
              const active = navItemActive(pathname, item.href);
              return (
                <Link
                  key={`${group.id}-${item.href}`}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "min-h-11 rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-muted",
                    active && "bg-primary/15 text-primary",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      {footerItems && footerItems.length > 0 ? (
        <div className="grid gap-0.5 border-t border-zinc-800 pt-3">
          {footerItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={onNavigate} className="min-h-11 rounded-md px-3 py-2.5 text-sm hover:bg-muted">
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
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
  const showBack = pathname !== homeHref;
  const mobileTabs = tabs && tabs.length > 1 ? tabs : [];

  return (
    <div className="dark min-h-dvh bg-background text-foreground">
      <div className="flex min-h-dvh">
        <aside className="hidden w-60 shrink-0 border-r bg-card/40 p-3 pb-12 md:flex md:flex-col">
          <Brand href={homeHref} />
          <p className="mt-3 rounded-md bg-primary/15 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-primary">
            {storeName ? storeName : `PDV · ${title}`}
          </p>
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
            <NavLinks items={items} groups={groups} footerItems={footerItems} />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className="sticky top-0 z-30 flex items-center gap-2 border-b bg-card/90 px-3 py-2 backdrop-blur md:gap-3"
            style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
          >
            <div className="md:hidden">
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="Abrir menu">
                    <Menu className="size-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex w-[min(18rem,100%)] flex-col gap-0 bg-zinc-950 p-0">
                  <SheetHeader className="shrink-0 px-4 pb-2 pt-4">
                    <SheetTitle className="text-left">
                      <Brand href={homeHref} />
                    </SheetTitle>
                    {roleLabel ? <p className="text-left text-xs text-muted-foreground">{roleLabel}</p> : null}
                  </SheetHeader>
                  <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                    <NavLinks items={items} groups={groups} footerItems={footerItems} onNavigate={() => setMenuOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            {showBack ? (
              <Button asChild variant="ghost" size="sm" className="min-h-11 shrink-0 gap-1 px-2">
                <Link href={homeHref}>
                  <ArrowLeft className="size-4" />
                  Voltar
                </Link>
              </Button>
            ) : null}
            <div className="min-w-0 md:hidden">
              <Brand compact href={homeHref} />
            </div>
            {enableOpsChrome ? (
              <div className="hidden min-w-0 flex-1 md:block">
                <OpsSearch />
              </div>
            ) : (
              <div className="min-w-0 flex-1" />
            )}
            <div className="ml-auto flex min-w-0 items-center gap-1 text-sm sm:gap-2">
              {enableOpsChrome ? (
                <div className="hidden sm:block">
                  <OpsNotifications />
                </div>
              ) : null}
              <div className="hidden min-w-0 items-center gap-2 sm:flex">
                <Avatar size="sm">
                  <AvatarFallback>{initials(userName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 leading-tight">
                  <p className="truncate font-medium">{userName}</p>
                  {roleLabel ? <p className="truncate text-xs text-muted-foreground">{roleLabel}</p> : null}
                </div>
              </div>
              <form action={signOutAction}>
                <Button type="submit" variant="ghost" size="sm" className="min-h-11">
                  Sair
                </Button>
              </form>
            </div>
          </header>
          <main
            className={cn(
              "min-w-0 flex-1 overflow-x-hidden px-4 py-4 md:p-6",
              mobileTabs.length > 0 && "pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:pb-6",
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
      <Input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar…"
        className="h-11 max-w-xl md:h-10"
        aria-label="Buscar pedido, cliente, produto ou mesa"
      />
      {visibleResults ? (
        <div className="absolute z-40 mt-1 max-h-72 w-full max-w-xl overflow-y-auto overflow-x-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-2 text-sm shadow-xl">
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
      <p className="px-2 text-[11px] uppercase tracking-wide text-zinc-500">{title}</p>
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
        <Button type="button" variant="outline" size="sm" className="relative min-h-11">
          Alertas
          {items.length > 0 ? (
            <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-orange-500 text-[10px] text-black">
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
