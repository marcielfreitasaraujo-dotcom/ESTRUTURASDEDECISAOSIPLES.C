import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function StoreStaffBack({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
    >
      <ArrowLeft className="size-3.5" />
      Voltar ao sistema
    </Link>
  );
}
