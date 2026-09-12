export type WhatsAppMessage = {
  to: string;
  text: string;
};

export interface WhatsAppProvider {
  send(message: WhatsAppMessage): Promise<void>;
}

export class NullWhatsAppProvider implements WhatsAppProvider {
  async send(): Promise<void> {
    return;
  }
}

export function getWhatsAppProvider(): WhatsAppProvider {
  return new NullWhatsAppProvider();
}
