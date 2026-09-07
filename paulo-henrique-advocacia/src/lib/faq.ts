export type FaqItem = {
  question: string;
  answer: string;
};

export const faqItems: FaqItem[] = [
  {
    question: "Como saber se tenho direito à aposentadoria?",
    answer:
      "O direito à aposentadoria depende de fatores como idade, tempo de contribuição, categoria do segurado e as regras vigentes no seu caso. A forma mais segura é reunir documentos de trabalho e contribuições e solicitar uma análise individual. O escritório explica as possibilidades com clareza, sem prometer resultado.",
  },
  {
    question: "Quem pode receber o BPC/LOAS?",
    answer:
      "O BPC/LOAS é um benefício assistencial para pessoas com 65 anos ou mais ou pessoas com deficiência que preencham os requisitos legais, inclusive o critério de renda familiar. Não é aposentadoria e não exige contribuições ao INSS. Cada pedido passa por avaliação cadastral e, quando for o caso, avaliação da deficiência.",
  },
  {
    question: "Posso solicitar atendimento online?",
    answer:
      "Sim. O escritório realiza atendimento online para clientes de diferentes regiões do Brasil. O primeiro contato pode ser feito pelo WhatsApp. Quando necessário, o atendimento presencial em Estreito - MA também está disponível no horário de expediente.",
  },
  {
    question: "O escritório atende pessoas de outras cidades?",
    answer:
      "Sim. Há atendimento remoto para quem reside em outras cidades e estados. Demandas previdenciárias frequentemente podem ser acompanhadas à distância, com envio de documentos de forma organizada e orientação contínua.",
  },
  {
    question: "O que fazer quando o INSS nega um benefício?",
    answer:
      "Guarde a carta de indeferimento, os protocolos e os documentos apresentados. A negativa traz o motivo da decisão e os prazos para recurso. Um advogado previdenciário pode analisar o processo administrativo e indicar se cabe recurso no INSS ou medida judicial.",
  },
  {
    question: "Posso buscar ajuda para aposentadoria rural?",
    answer:
      "Sim. O escritório atua em aposentadoria rural, inclusive na orientação sobre comprovação da atividade no campo. Documentos, cadastros e o histórico de trabalho são avaliados com atenção às particularidades de cada família e região.",
  },
  {
    question: "Quais documentos devo apresentar?",
    answer:
      "A lista varia conforme o benefício. Em geral, são úteis RG, CPF, comprovante de residência, carteira de trabalho, carnês de contribuição, extratos do CNIS, certidões, laudos médicos e documentos que comprovem atividade rural ou o vínculo familiar. Na conversa inicial, orientamos o que faz sentido no seu caso. Não é necessário reunir tudo antes do primeiro contato.",
  },
];
