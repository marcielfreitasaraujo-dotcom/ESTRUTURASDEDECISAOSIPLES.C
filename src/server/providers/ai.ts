export type AIPrompt = {
  tenantId: string;
  userId: string;
  prompt: string;
  allowedData: unknown;
};

export interface AIProvider {
  complete(input: AIPrompt): Promise<string>;
}

export class UnconfiguredAIProvider implements AIProvider {
  async complete(): Promise<string> {
    throw new Error("Nenhum provedor de IA configurado.");
  }
}

export function getAIProvider(): AIProvider {
  return new UnconfiguredAIProvider();
}
