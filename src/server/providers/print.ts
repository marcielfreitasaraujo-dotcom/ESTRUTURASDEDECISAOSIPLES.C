export type PrintJob = {
  type: "ORDER" | "KITCHEN" | "RECEIPT";
  tenantId: string;
  payload: unknown;
};

export interface PrintProvider {
  print(job: PrintJob): Promise<void>;
}

export class NullPrintProvider implements PrintProvider {
  async print(): Promise<void> {
    return;
  }
}

export function getPrintProvider(): PrintProvider {
  return new NullPrintProvider();
}
