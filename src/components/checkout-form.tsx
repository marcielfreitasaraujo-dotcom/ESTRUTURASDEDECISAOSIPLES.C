"use client";

import { useFormStatus } from "react-dom";
import { checkoutFormAction } from "@/app/actions/storefront";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatBrPhone } from "@/lib/phone";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Confirmando..." : "Confirmar pedido"}</Button>;
}

const fieldClass = "border-zinc-300 bg-white text-zinc-900";

export function CheckoutForm({
  slug,
  error,
  idempotencyKey,
  tableNumber,
  couponCode,
  guestName,
  guestPhone,
}: {
  slug: string;
  error?: string;
  idempotencyKey: string;
  tableNumber?: string;
  couponCode?: string | null;
  guestName?: string;
  guestPhone?: string;
}) {
  return (
    <form action={checkoutFormAction} method="post" className="grid gap-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-2">
        <Label htmlFor="customerName">Nome</Label>
        <Input id="customerName" name="customerName" required defaultValue={guestName ?? ""} autoComplete="name" className={fieldClass} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="customerPhone">Telefone</Label>
        <Input
          id="customerPhone"
          name="customerPhone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          required
          defaultValue={guestPhone ? formatBrPhone(guestPhone) : ""}
          className={fieldClass}
        />
        <p className="text-xs text-zinc-600">A pizzaria usa nome e telefone para falar com você se precisar.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="fulfillment">Recebimento</Label>
        <select
          id="fulfillment"
          name="fulfillment"
          className={`h-10 rounded-lg border px-3 ${fieldClass}`}
          defaultValue={tableNumber ? "DINE_IN" : "PICKUP"}
        >
          <option value="PICKUP">Retirada</option>
          <option value="DELIVERY">Entrega em casa</option>
          <option value="DINE_IN">Mesa</option>
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="tableNumber">Mesa (se for no salão)</Label>
        <Input id="tableNumber" name="tableNumber" defaultValue={tableNumber} placeholder="7" className={fieldClass} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="street">Rua (entrega)</Label>
        <Input id="street" name="street" className={fieldClass} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="addressNumber">Número (entrega)</Label>
        <Input id="addressNumber" name="addressNumber" className={fieldClass} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="neighborhood">Bairro (entrega)</Label>
        <Input id="neighborhood" name="neighborhood" placeholder="Centro, Vila Nova ou São João" className={fieldClass} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="reference">Referência</Label>
        <Input id="reference" name="reference" className={fieldClass} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="paymentMethod">Pagamento</Label>
        <select id="paymentMethod" name="paymentMethod" className={`h-10 rounded-lg border px-3 ${fieldClass}`}>
          <option value="PIX">PIX</option>
          <option value="CASH">Dinheiro</option>
          <option value="CARD">Cartão na entrega</option>
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="couponCode">Cupom</Label>
        <Input id="couponCode" name="couponCode" placeholder="BEMVINDO10" defaultValue={couponCode ?? ""} className={fieldClass} />
      </div>
      <SubmitButton />
    </form>
  );
}
