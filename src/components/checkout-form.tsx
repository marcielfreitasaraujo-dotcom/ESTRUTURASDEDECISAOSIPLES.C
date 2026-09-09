"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { checkoutAction } from "@/app/actions/storefront";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function CheckoutForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fulfillment, setFulfillment] = useState("DELIVERY");
  const idempotencyKey = useState(() => crypto.randomUUID())[0];

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await checkoutAction(slug, new FormData(event.currentTarget));
        if (result.error) {
          setError(result.error);
          return;
        }
        if (result.redirectTo) router.push(result.redirectTo);
      }}
    >
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
          value={fulfillment}
          onChange={(event) => setFulfillment(event.target.value)}
        >
          <option value="DELIVERY">Entrega</option>
          <option value="PICKUP">Retirada</option>
        </select>
      </div>
      {fulfillment === "DELIVERY" ? (
        <>
          <div className="grid gap-2">
            <Label htmlFor="street">Rua</Label>
            <Input id="street" name="street" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="addressNumber">Número</Label>
            <Input id="addressNumber" name="addressNumber" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input id="neighborhood" name="neighborhood" required placeholder="Centro, Vila Nova ou São João" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reference">Referência</Label>
            <Input id="reference" name="reference" />
          </div>
        </>
      ) : null}
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
      <Button type="submit">Confirmar pedido</Button>
    </form>
  );
}
