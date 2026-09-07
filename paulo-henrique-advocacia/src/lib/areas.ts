export type Area = {
  slug: string;
  title: string;
  short: string;
  icon:
    | "landmark"
    | "trees"
    | "heart"
    | "stethoscope"
    | "shield"
    | "baby"
    | "flower"
    | "scale";
  whatsappMessage: string;
  intro: string;
  paragraphs: string[];
  topics: string[];
};

export const areas: Area[] = [
  {
    slug: "aposentadorias",
    title: "Aposentadorias",
    short:
      "Planejamento e acompanhamento para aposentadorias urbanas e rurais.",
    icon: "landmark",
    whatsappMessage:
      "Olá, gostaria de orientação sobre aposentadoria.",
    intro:
      "A aposentadoria envolve regras específicas de tempo, idade, contribuições e, em alguns casos, condições especiais. Uma análise individual ajuda a compreender o momento adequado e os caminhos possíveis perante o INSS.",
    paragraphs: [
      "Cada trajetória profissional é diferente. Por isso, o escritório analisa a situação do segurado com atenção às particularidades do caso, à documentação disponível e às regras aplicáveis.",
      "O acompanhamento pode ocorrer tanto na via administrativa quanto, quando cabível, na via judicial, sempre com explicações claras sobre as etapas e as opções existentes.",
      "O objetivo é oferecer orientação responsável, sem promessas de resultado, para que a pessoa decida com segurança sobre os próximos passos.",
    ],
    topics: [
      "Aposentadoria por idade",
      "Aposentadoria por tempo de contribuição",
      "Regras de transição",
      "Planejamento previdenciário",
    ],
  },
  {
    slug: "aposentadoria-rural",
    title: "Aposentadoria Rural",
    short:
      "Orientação para trabalhadores rurais na comprovação da atividade e reconhecimento dos seus direitos.",
    icon: "trees",
    whatsappMessage:
      "Olá, gostaria de orientação sobre aposentadoria rural.",
    intro:
      "Trabalhadores rurais frequentemente enfrentam dificuldades para comprovar o tempo de atividade. A organização da prova e o entendimento das regras específicas são essenciais para o reconhecimento do direito.",
    paragraphs: [
      "A aposentadoria rural exige atenção à qualidade de segurado especial, ao período de atividade e aos documentos que possam demonstrar o trabalho no campo.",
      "Declarações, documentos de imóvel, notas, cadastros e testemunhas podem ser relevantes, conforme o caso. Cada conjunto de provas precisa ser avaliado com cuidado.",
      "O escritório orienta o cliente sobre o que pode ser reunido e como conduzir o pedido com clareza, tanto no INSS quanto, se necessário, na Justiça.",
    ],
    topics: [
      "Segurado especial",
      "Comprovação de atividade rural",
      "Documentos e início de prova material",
      "Pedidos administrativos e judiciais",
    ],
  },
  {
    slug: "bpc-loas",
    title: "BPC/LOAS",
    short:
      "Orientação para pessoas que precisam buscar o benefício assistencial e possuem os requisitos legais.",
    icon: "heart",
    whatsappMessage: "Olá, gostaria de orientação sobre o BPC/LOAS.",
    intro:
      "O Benefício de Prestação Continuada (BPC/LOAS) é um benefício assistencial destinado a pessoas idosas ou com deficiência que preencham os requisitos legais, inclusive os critérios de renda previstos na legislação.",
    paragraphs: [
      "Não se trata de aposentadoria. O BPC possui regras próprias, avaliação social e, nos casos de deficiência, avaliação da condição de saúde e de barreiras enfrentadas pela pessoa.",
    "Uma orientação adequada ajuda a compreender se os requisitos aparentam estar presentes e quais documentos costumam ser necessários para o pedido.",
      "Quando o INSS indefere o benefício, é possível analisar a negativa e avaliar as medidas administrativas ou judiciais cabíveis.",
    ],
    topics: [
      "Idoso com 65 anos ou mais",
      "Pessoa com deficiência",
      "Critério de renda familiar",
      "Cadastro e avaliação social",
    ],
  },
  {
    slug: "auxilio-doenca",
    title: "Auxílio-Doença",
    short:
      "Atuação para segurados que precisam se afastar do trabalho por incapacidade.",
    icon: "stethoscope",
    whatsappMessage:
      "Olá, gostaria de orientação sobre auxílio-doença / benefício por incapacidade.",
    intro:
      "O benefício por incapacidade temporária (auxílio-doença) destina-se a segurados que, por motivo de saúde, estejam temporariamente incapazes para o trabalho, observadas as regras de qualidade de segurado e carência, quando exigidas.",
    paragraphs: [
      "Laudos, exames e a história clínica são elementos importantes. A perícia do INSS avalia a incapacidade, e o resultado pode ser favorável ou não.",
      "Em caso de negativa ou cessação, o escritório analisa o conjunto de documentos e explica as alternativas possíveis, sempre com linguagem acessível.",
      "Cada caso depende das circunstâncias médicas e previdenciárias da pessoa. Por isso, a conversa inicial é o primeiro passo para uma orientação responsável.",
    ],
    topics: [
      "Incapacidade temporária",
      "Perícia médica",
      "Documentação médica",
      "Recurso ou ação, quando cabível",
    ],
  },
  {
    slug: "auxilio-acidente",
    title: "Auxílio-Acidente",
    short:
      "Defesa dos direitos de trabalhadores que tiveram redução da capacidade laboral.",
    icon: "shield",
    whatsappMessage:
      "Olá, gostaria de orientação sobre auxílio-acidente.",
    intro:
      "O auxílio-acidente pode ser devido quando o segurado, após acidente, permanece com sequela que reduz a capacidade para o trabalho que habitualmente exercia, nos termos da legislação.",
    paragraphs: [
      "Muitas pessoas não sabem que o benefício pode ser pago mesmo após o retorno ao trabalho, se houver redução permanente da capacidade.",
      "A análise envolve o nexo com o acidente, a existência de sequela e o impacto na atividade habitual. Documentos médicos e o histórico laboral ajudam nessa avaliação.",
      "O escritório explica o que a lei prevê e quais caminhos existem para buscar o reconhecimento do direito, sem garantir resultado.",
    ],
    topics: [
      "Sequela permanente",
      "Redução da capacidade laboral",
      "Acidente de qualquer natureza ou de trabalho",
      "Revisão de negativas",
    ],
  },
  {
    slug: "salario-maternidade",
    title: "Salário-Maternidade",
    short:
      "Orientação para garantir o acesso ao benefício dentro das regras aplicáveis.",
    icon: "baby",
    whatsappMessage:
      "Olá, gostaria de orientação sobre salário-maternidade.",
    intro:
      "O salário-maternidade é um benefício previdenciário devido em situações previstas em lei, como parto, adoção e outras hipóteses legais, desde que preenchidos os requisitos de cada categoria de segurado.",
    paragraphs: [
      "As regras de carência, qualidade de segurado e forma de requerimento variam conforme a situação da pessoa — empregada, contribuinte individual, segurada especial, entre outras.",
      "Uma orientação clara ajuda a entender documentos, prazos e o procedimento perante o INSS ou a empresa, quando for o caso.",
      "O escritório atua para esclarecer a situação e acompanhar o pedido com responsabilidade.",
    ],
    topics: [
      "Parto e adoção",
      "Carência e qualidade de segurado",
      "Segurada empregada e demais categorias",
      "Pedidos e recursos",
    ],
  },
  {
    slug: "pensao-por-morte",
    title: "Pensão por Morte",
    short:
      "Orientação e acompanhamento para dependentes que buscam o benefício.",
    icon: "flower",
    whatsappMessage:
      "Olá, gostaria de orientação sobre pensão por morte.",
    intro:
      "A pensão por morte é o benefício pago aos dependentes do segurado falecido, observadas as regras de habilitação, qualidade de dependente e demais requisitos legais.",
    paragraphs: [
      "Cônjuge, companheiro(a), filhos e, em hipóteses específicas, outros dependentes podem ter direito, conforme a legislação e a comprovação do vínculo.",
      "Documentos civis, comprovação de união estável e a qualidade de segurado da pessoa falecida costumam ser pontos centrais da análise.",
      "O escritório trata o tema com respeito e clareza, reconhecendo a delicadeza do momento e a importância de uma orientação segura.",
    ],
    topics: [
      "Dependentes habilitados",
      "União estável",
      "Qualidade de segurado do falecido",
      "Cotas e duração do benefício",
    ],
  },
  {
    slug: "revisoes-inss",
    title: "Revisões e ações contra o INSS",
    short:
      "Análise de negativas, revisões e medidas administrativas ou judiciais cabíveis.",
    icon: "scale",
    whatsappMessage:
      "Olá, gostaria de analisar uma negativa ou revisão de benefício do INSS.",
    intro:
      "Nem todo indeferimento está encerrado. Em muitos casos, é possível compreender o motivo da negativa, reunir documentos e avaliar se cabe recurso administrativo ou medida judicial.",
    paragraphs: [
      "Revisões de benefícios já concedidos também podem ser analisadas quando há indícios de cálculo inadequado, tempo não reconhecido ou mudança de entendimento aplicável ao caso.",
      "Cada situação exige leitura atenta da carta de indeferimento, do processo administrativo e da documentação do segurado.",
      "O escritório apresenta as opções com transparência, prazos e riscos, para que a pessoa decida com informação.",
    ],
    topics: [
      "Negativas do INSS",
      "Recursos administrativos",
      "Ações judiciais previdenciárias",
      "Revisão de benefício",
    ],
  },
];

export function getArea(slug: string): Area | undefined {
  return areas.find((area) => area.slug === slug);
}
