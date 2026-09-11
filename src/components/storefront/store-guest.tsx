"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { User, X } from "lucide-react";
import { clearStoreGuestAction, identifyStoreGuestAction } from "@/app/actions/storefront";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBrPhone } from "@/lib/phone";
import { guestFirstName, type StoreGuest } from "@/lib/store-guest";

export function StoreGuestTrigger({
  guest,
  onClick,
}: {
  guest: StoreGuest | null;
  onClick: () => void;
}) {
  const label = guest ? `Olá, ${guestFirstName(guest.name)}` : "Entrar/Cadastrar";
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-w-0 max-w-[11.5rem] items-center gap-2 text-left text-sm font-semibold text-zinc-800 hover:text-zinc-950 sm:max-w-none"
      aria-label={label}
    >
      <User className="size-5 shrink-0" strokeWidth={1.75} />
      <span className="truncate">{label}</span>
    </button>
  );
}

function FloatingField({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder=" "
        className="peer h-14 w-full rounded-md border border-zinc-400 bg-white px-3 pt-3 text-base text-zinc-900 outline-none placeholder:text-transparent focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500 transition-all peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs"
      >
        {label}
      </label>
    </div>
  );
}

export function StoreGuestDialog({
  open,
  onOpenChange,
  slug,
  guest,
  onIdentified,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  guest: StoreGuest | null;
  onIdentified?: (guest: StoreGuest) => void;
}) {
  const [name, setName] = useState(guest?.name ?? "");
  const [phone, setPhone] = useState(guest?.phone ? formatBrPhone(guest.phone) : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    setName(guest?.name ?? "");
    setPhone(guest?.phone ? formatBrPhone(guest.phone) : "");
    setError(null);
  }, [open, guest]);

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await identifyStoreGuestAction(slug, name, phone);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      router.refresh();
      onIdentified?.(result.guest);
    });
  }

  function signOut() {
    startTransition(async () => {
      await clearStoreGuestAction(slug);
      setName("");
      setPhone("");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-5 bg-white p-6 text-zinc-900 shadow-2xl ring-1 ring-zinc-200 sm:max-w-[420px]"
      >
        <DialogClose asChild>
          <button
            type="button"
            className="absolute top-3 right-3 inline-flex size-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </DialogClose>
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-xl font-semibold text-zinc-800">Informe seu nome e telefone</DialogTitle>
          <DialogDescription className="max-w-xs text-center text-zinc-500">
            Eles são importantes para a pizzaria falar com você caso precise.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <FloatingField
            id="store-guest-name"
            label="Nome"
            autoComplete="name"
            value={name}
            onChange={setName}
          />
          <FloatingField
            id="store-guest-phone"
            label="Telefone"
            type="tel"
            autoComplete="tel"
            inputMode="numeric"
            value={phone}
            onChange={(value) => setPhone(formatBrPhone(value))}
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button
            type="submit"
            disabled={pending}
            className="h-12 w-full bg-zinc-950 text-sm font-semibold tracking-wide text-white uppercase hover:bg-zinc-800"
          >
            {pending ? "Confirmando..." : "Confirmar"}
          </Button>
          {guest ? (
            <button
              type="button"
              disabled={pending}
              onClick={signOut}
              className="text-center text-sm text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
            >
              Sair
            </button>
          ) : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function StoreGuestBar({ slug, guest }: { slug: string; guest: StoreGuest | null }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <StoreGuestTrigger guest={guest} onClick={() => setOpen(true)} />
      <StoreGuestDialog open={open} onOpenChange={setOpen} slug={slug} guest={guest} />
    </>
  );
}

export function StoreFinalizeButton({
  slug,
  guest,
  checkoutHref,
  disabled,
  disabledLabel,
}: {
  slug: string;
  guest: StoreGuest | null;
  checkoutHref: string;
  disabled?: boolean;
  disabledLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (disabled) {
    return (
      <Button type="button" disabled className="h-11">
        {disabledLabel ?? "Finalizar pedido"}
      </Button>
    );
  }

  return (
    <>
      <Button
        type="button"
        className="h-11"
        onClick={() => {
          if (guest) router.push(checkoutHref);
          else setOpen(true);
        }}
      >
        Finalizar pedido
      </Button>
      <StoreGuestDialog
        open={open}
        onOpenChange={setOpen}
        slug={slug}
        guest={guest}
        onIdentified={() => {
          setOpen(false);
          router.push(checkoutHref);
        }}
      />
    </>
  );
}
