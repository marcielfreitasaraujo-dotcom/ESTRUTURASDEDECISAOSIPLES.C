"use client";

import { useFormStatus } from "react-dom";
import { checkoutFormAction } from "@/app/actions/storefront";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Confirmando..." : "Confirmar pedido"}</Button>;
}

export function CheckoutForm({
  slug,
  error,
  idempotencyKey,
}: {
  slug: string;
  error?: string;
  idempotencyKey: string;
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
        <Input id="customerName" name="customerName" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="customerPhone">Telefone</Label>
        <Input id="customerPhone" name="customerPhone" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="fulfillment">Recebimento</Label>
        <select
          id="fulfillment"
          name="fulfillment"
          className="h-10 rounded-lg border bg-background px-3"
          defaultValue="PICKUP"
        >
          <option value="PICKUP">Retirada</option>
          <option value="DELIVERY">Entrega</option>
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="street">Rua (entrega)</Label>
        <Input id="street" name="street" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="addressNumber">Número (entrega)</Label>
        <Input id="addressNumber" name="addressNumber" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="neighborhood">Bairro (entrega)</Label>
        <Input id="neighborhood" name="neighborhood" placeholder="Centro, Vila Nova ou São João" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="reference">Referência</Label>
        <Input id="reference" name="reference" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="paymentMethod">Pagamento</Label>
        <select id="paymentMethod" name="paymentMethod" className="h-10 rounded-lg border bg-background px-3">
          <option value="PIX">PIX</option>
          <option value="CASH">Dinheiro</option>
          <option value="CARD">Cartão na entrega</option>
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="couponCode">Cupom</Label>
        <Input id="couponCode" name="couponCode" placeholder="BEMVINDO10" />
      </div>
      <SubmitButton />
    </form>
  );
}
