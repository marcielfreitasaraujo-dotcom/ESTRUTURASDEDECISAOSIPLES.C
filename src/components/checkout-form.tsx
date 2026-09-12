"use client";

import { useState } from "react";
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
  allowPickup = true,
  allowDelivery = true,
  defaultCity = "Belém",
  defaultState = "PA",
}: {
  slug: string;
  error?: string;
  idempotencyKey: string;
  tableNumber?: string;
  couponCode?: string | null;
  guestName?: string;
  guestPhone?: string;
  allowPickup?: boolean;
  allowDelivery?: boolean;
  defaultCity?: string;
  defaultState?: string;
}) {
  const defaultFulfillment = tableNumber ? "DINE_IN" : allowDelivery ? "DELIVERY" : allowPickup ? "PICKUP" : "DINE_IN";
  const [fulfillment, setFulfillment] = useState(defaultFulfillment);
  const delivery = fulfillment === "DELIVERY";

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
          value={fulfillment}
          onChange={(event) => setFulfillment(event.target.value)}
        >
          {allowDelivery ? <option value="DELIVERY">Entrega em casa</option> : null}
          {allowPickup ? <option value="PICKUP">Retirada</option> : null}
          <option value="DINE_IN">Mesa</option>
        </select>
      </div>
      {fulfillment === "DINE_IN" ? (
        <div className="grid gap-2">
          <Label htmlFor="tableNumber">Mesa</Label>
          <Input id="tableNumber" name="tableNumber" defaultValue={tableNumber} placeholder="7" className={fieldClass} />
        </div>
      ) : null}
      {delivery ? (
        <fieldset className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-4">
          <legend className="px-1 text-sm font-semibold">Endereço de entrega</legend>
          <div className="grid gap-2">
            <Label htmlFor="street">Rua</Label>
            <Input id="street" name="street" required={delivery} autoComplete="street-address" className={fieldClass} />
          </div>
          <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
            <div className="grid gap-2">
              <Label htmlFor="addressNumber">Número</Label>
              <Input id="addressNumber" name="addressNumber" required={delivery} className={fieldClass} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="complement">Complemento</Label>
              <Input id="complement" name="complement" placeholder="Apto, bloco" className={fieldClass} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              name="neighborhood"
              required={delivery}
              placeholder="Centro, Vila Nova ou São João"
              className={fieldClass}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" name="city" defaultValue={defaultCity} className={fieldClass} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="state">UF</Label>
              <Input id="state" name="state" defaultValue={defaultState} maxLength={2} className={fieldClass} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reference">Ponto de referência</Label>
            <Input id="reference" name="reference" placeholder="Próximo à praça, portão azul" className={fieldClass} />
          </div>
        </fieldset>
      ) : null}
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
