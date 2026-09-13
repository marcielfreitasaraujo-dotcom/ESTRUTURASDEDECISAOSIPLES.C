"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Banknote, CreditCard, QrCode } from "lucide-react";
import { checkoutFormAction } from "@/app/actions/storefront";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatBrPhone } from "@/lib/phone";
import {
  STORE_CHECKOUT_PAYMENTS,
  checkoutAddressReady,
  type StoreCheckoutPayment,
} from "@/domain/ordering/store-payment";

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="h-12" disabled={pending || disabled}>
      {pending ? "Confirmando..." : "Confirmar pedido"}
    </Button>
  );
}

const fieldClass = "border-zinc-300 bg-white text-zinc-900";

const PAYMENT_ICON = {
  PIX: QrCode,
  CASH: Banknote,
  CARD: CreditCard,
} as const;

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
  const [step, setStep] = useState<"address" | "payment">("address");
  const [paymentMethod, setPaymentMethod] = useState<StoreCheckoutPayment | "">("");
  const [stepError, setStepError] = useState<string | null>(null);
  const delivery = fulfillment === "DELIVERY";

  function goToPayment(form: HTMLFormElement) {
    const data = new FormData(form);
    const name = String(data.get("customerName") || "").trim();
    const phone = String(data.get("customerPhone") || "").replace(/\D/g, "");
    if (name.length < 2) {
      setStepError("Informe seu nome.");
      return;
    }
    if (phone.length !== 10 && phone.length !== 11) {
      setStepError("Informe o telefone com DDD.");
      return;
    }
    if (
      !checkoutAddressReady({
        fulfillment,
        street: String(data.get("street") || ""),
        addressNumber: String(data.get("addressNumber") || ""),
        neighborhood: String(data.get("neighborhood") || ""),
      })
    ) {
      setStepError("Informe rua, número e bairro para a entrega.");
      return;
    }
    setStepError(null);
    setStep("payment");
  }

  return (
    <form action={checkoutFormAction} method="post" className="grid gap-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />
      {error || stepError ? (
        <Alert variant="destructive">
          <AlertDescription>{stepError ?? error}</AlertDescription>
        </Alert>
      ) : null}

      <div className={step === "address" ? "grid gap-4" : "hidden"}>
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
          <Label htmlFor="couponCode">Cupom</Label>
          <Input id="couponCode" name="couponCode" placeholder="BEMVINDO10" defaultValue={couponCode ?? ""} className={fieldClass} />
        </div>
        <Button
          type="button"
          className="h-12"
          onClick={(event) => goToPayment(event.currentTarget.form!)}
        >
          Continuar para pagamento
        </Button>
      </div>

      <div className={step === "payment" ? "grid gap-4" : "hidden"}>
        <div className="grid gap-1">
          <p className="text-sm font-semibold text-zinc-900">Como você vai pagar?</p>
          <p className="text-sm text-zinc-600">Escolha PIX, dinheiro ou cartão para concluir o pedido.</p>
        </div>
        <fieldset className="grid gap-3">
          <legend className="sr-only">Forma de pagamento</legend>
          {STORE_CHECKOUT_PAYMENTS.map((option) => {
            const Icon = PAYMENT_ICON[option.value];
            const selected = paymentMethod === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setPaymentMethod(option.value);
                  setStepError(null);
                }}
                className={`flex items-start gap-3 rounded-2xl border bg-white p-4 text-left transition ${
                  selected ? "border-zinc-900 ring-2 ring-zinc-900" : "border-zinc-200 hover:border-zinc-400"
                }`}
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-800">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-zinc-900">{option.label}</span>
                  <span className="mt-0.5 block text-sm text-zinc-600">{option.hint}</span>
                </span>
              </button>
            );
          })}
        </fieldset>
        <div className="grid gap-2">
          <Button type="button" variant="outline" className="h-11" onClick={() => setStep("address")}>
            Voltar ao endereço
          </Button>
          <SubmitButton disabled={!paymentMethod} />
        </div>
      </div>
    </form>
  );
}
