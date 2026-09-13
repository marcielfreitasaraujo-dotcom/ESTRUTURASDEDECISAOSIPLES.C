export interface PaymentProvider {
  readonly name: string;
  charge(input: {
    amountCents: number;
    method: "PIX" | "CARD" | "ONLINE";
    idempotencyKey: string;
    metadata: Record<string, string>;
  }): Promise<{ providerRef: string; status: "PENDING" | "PAID" }>;
}

export class ManualPaymentProvider implements PaymentProvider {
  readonly name = "manual";

  async charge(): Promise<{ providerRef: string; status: "PENDING" | "PAID" }> {
    return { providerRef: `manual_${crypto.randomUUID()}`, status: "PENDING" };
  }
}

export function getPaymentProvider(): PaymentProvider {
  return new ManualPaymentProvider();
}
