"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { customerStatusLabel, remainingMinutes, computeEta } from "@/domain/ordering/tracking";
import type { FulfillmentType, OrderStatus } from "@/domain/ordering/status";

export type StoreActiveOrder = {
  publicCode: string;
  trackingToken: string;
  status: OrderStatus;
  fulfillment: FulfillmentType;
  estimatedMinutes: number;
  createdAt: string;
  rejected: boolean;
};

export function StoreTrackingButton({
  slug,
  active,
}: {
  slug: string;
  active: StoreActiveOrder | null;
}) {
  const href = active ? `/loja/${slug}/acompanhar/${active.trackingToken}` : `/loja/${slug}/acompanhar`;
  const remaining = active
    ? Math.max(0, remainingMinutes(computeEta(new Date(active.createdAt), active.estimatedMinutes), new Date()))
    : null;

  return (
    <Link
      href={href}
      className="inline-flex min-w-0 max-w-[11rem] items-center gap-2 text-left text-sm font-semibold text-zinc-800 hover:text-zinc-950 sm:max-w-none"
      aria-label={active ? `Acompanhar pedido ${active.publicCode}` : "Acompanhar pedido"}
    >
      <Package className="size-5 shrink-0" strokeWidth={1.75} />
      <span className="min-w-0 truncate leading-tight">
        {active ? (
          <>
            <span className="block truncate">Pedido #{active.publicCode}</span>
            <span className="block truncate text-[11px] font-medium text-zinc-500">
              {customerStatusLabel(active.status, active.fulfillment, active.rejected)}
              {remaining !== null ? ` · ${remaining} min` : ""}
            </span>
          </>
        ) : (
          "Acompanhar pedido"
        )}
      </span>
    </Link>
  );
}
