import { logger } from "@/lib/logger";
import { getEnv } from "@/lib/env";

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    logger.info("email.queued", {
      provider: "console",
      to: message.to,
      subject: message.subject,
      preview: message.text.slice(0, 280),
    });
  }
}

const provider: EmailProvider = new ConsoleEmailProvider();

export async function sendTransactionalEmail(message: EmailMessage) {
  const env = getEnv();
  if (env.EMAIL_API_KEY) {
    logger.warn("email.provider_not_wired", {
      message: "EMAIL_API_KEY está definido, mas o adapter de produção ainda não foi conectado. Usando console.",
    });
  }
  await provider.send(message);
}
