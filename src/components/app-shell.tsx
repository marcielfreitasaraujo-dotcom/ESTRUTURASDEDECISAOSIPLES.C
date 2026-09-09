import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type NavItem = { href: string; label: string };

export function AppShell({
  title,
  items,
  userName,
  homeHref = "/app",
  children,
}: {
  title: string;
  items: NavItem[];
  userName: string;
  homeHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        <aside className="hidden w-64 shrink-0 border-r p-4 md:block">
          <Brand href={homeHref} />
          <p className="mt-3 text-xs text-muted-foreground">{title}</p>
          <nav className="mt-6 grid gap-1" aria-label="Principal">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <div className="md:hidden">
              <Brand compact href={homeHref} />
            </div>
            <nav className="flex gap-2 overflow-x-auto md:hidden" aria-label="Mobile">
              {items.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-full bg-muted px-3 py-1 text-xs">
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-3 text-sm">
              <span className="hidden text-muted-foreground sm:inline">{userName}</span>
              <form action={signOutAction}>
                <Button type="submit" variant="ghost" size="sm">
                  Sair
                </Button>
              </form>
            </div>
          </header>
          <Separator className="md:hidden" />
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
