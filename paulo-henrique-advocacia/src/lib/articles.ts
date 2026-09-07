export type Article = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  date: string;
  dateIso: string;
  image: string;
  imageAlt: string;
  relatedArea?: string;
  paragraphs: string[];
};

export const articles: Article[] = [
  {
    slug: "aposentadoria-rural",
    title: "Aposentadoria rural: o que o trabalhador do campo precisa saber",
    category: "Aposentadoria Rural",
    excerpt:
      "Entenda, em linguagem simples, como funciona o reconhecimento da atividade rural e quais cuidados ajudar na hora de reunir documentos.",
    date: "7 de setembro de 2026",
    dateIso: "2026-09-07",
    image: "/images/rural-landscape.webp",
    imageAlt:
      "Paisagem rural ilustrativa — imagem institucional para substituição",
    relatedArea: "aposentadoria-rural",
    paragraphs: [
      "A aposentadoria rural existe para reconhecer o trabalho no campo. Ainda assim, o INSS costuma exigir provas de que a atividade realmente ocorreu no período informado.",
      "Documentos como notas fiscais, contratos, cadastros, declarações e registros em órgãos públicos podem ajudar, mas nenhum papel, isoladamente, resolve todos os casos. O conjunto da prova é que importa.",
      "Trabalhadores que exerceram atividade urbana e rural em momentos diferentes também podem precisar de uma análise combinada do tempo. Por isso, vale conversar com um profissional antes de protocolar o pedido.",
      "Este conteúdo é informativo e não substitui orientação jurídica sobre o seu caso concreto.",
    ],
  },
  {
    slug: "bpc-loas",
    title: "BPC/LOAS: benefício assistencial e requisitos legais",
    category: "BPC/LOAS",
    excerpt:
      "Saiba a diferença entre o BPC e a aposentadoria, e quais pontos costumam ser avaliados no pedido do benefício assistencial.",
    date: "7 de setembro de 2026",
    dateIso: "2026-09-07",
    image: "/images/about-office.webp",
    imageAlt:
      "Sala de atendimento ilustrativa — imagem institucional para substituição",
    relatedArea: "bpc-loas",
    paragraphs: [
      "O BPC/LOAS não é aposentadoria. É um benefício assistencial pago a pessoas idosas (a partir de 65 anos) ou com deficiência, desde que preencham os requisitos previstos em lei, inclusive o critério de renda familiar.",
      "Além da renda, o INSS avalia cadastros, composição familiar e, nos casos de deficiência, a condição de saúde e as barreiras enfrentadas no dia a dia.",
      "Negativas são comuns quando a documentação está incompleta ou quando o órgão entende que a renda ultrapassa o limite legal. Nesses casos, é possível analisar a decisão e verificar se cabe recurso ou outra medida.",
      "Este conteúdo é informativo e não substitui orientação jurídica individualizada.",
    ],
  },
  {
    slug: "auxilio-doenca",
    title: "Auxílio-doença: afastamento por incapacidade e o papel da perícia",
    category: "Auxílio-doença",
    excerpt:
      "Veja como o benefício por incapacidade temporária é analisado e por que laudos e exames fazem diferença no pedido.",
    date: "7 de setembro de 2026",
    dateIso: "2026-09-07",
    image: "/images/desk-still.webp",
    imageAlt:
      "Mesa de trabalho jurídica ilustrativa — imagem institucional para substituição",
    relatedArea: "auxilio-doenca",
    paragraphs: [
      "O auxílio-doença, hoje chamado benefício por incapacidade temporária, depende da comprovação de que a pessoa não pode trabalhar por um período, observadas as regras de segurado e, em geral, de carência.",
      "A perícia médica do INSS é uma etapa central. Levar exames atualizados, laudos e relatórios com data, diagnóstico e restrições funcionais ajuda a explicar a situação com mais clareza.",
      "Se o benefício for negado ou cessado, a carta de decisão deve ser lida com atenção: ela indica o motivo e os prazos. A partir daí, é possível avaliar recurso administrativo ou medida judicial.",
      "Este conteúdo é informativo e não substitui avaliação do caso concreto.",
    ],
  },
  {
    slug: "salario-maternidade",
    title: "Salário-maternidade: quem pode pedir e como se organizar",
    category: "Salário-maternidade",
    excerpt:
      "Um guia objetivo sobre o benefício, as diferenças entre categorias de seguradas e a importância de reunir os documentos certos.",
    date: "7 de setembro de 2026",
    dateIso: "2026-09-07",
    image: "/images/about-office.webp",
    imageAlt:
      "Ambiente de atendimento ilustrativo — imagem institucional para substituição",
    relatedArea: "salario-maternidade",
    paragraphs: [
      "O salário-maternidade é devido em hipóteses previstas em lei, como parto e adoção, desde que a pessoa mantenha a qualidade de segurada e cumpra a carência, quando exigida.",
      "Empregadas em geral recebem o benefício pela empresa. Contribuintes individuais, MEIs, desempregadas e seguradas especiais normalmente pedem diretamente ao INSS.",
      "Certidão de nascimento, documentos pessoais e comprovantes de contribuição ou de atividade rural costumam ser solicitados. A lista exata depende da categoria.",
      "Este conteúdo é informativo e não substitui orientação jurídica.",
    ],
  },
  {
    slug: "pensao-por-morte",
    title: "Pensão por morte: dependentes, documentos e prazos",
    category: "Pensão por morte",
    excerpt:
      "Orientações iniciais para famílias que precisam compreender quem pode ser dependente e quais provas o INSS costuma exigir.",
    date: "7 de setembro de 2026",
    dateIso: "2026-09-07",
    image: "/images/desk-still.webp",
    imageAlt:
      "Documentos sobre mesa — imagem institucional para substituição",
    relatedArea: "pensao-por-morte",
    paragraphs: [
      "A pensão por morte destina-se aos dependentes do segurado falecido. Cônjuge, companheiro(a) e filhos menores ou inválidos estão entre as hipóteses mais comuns, mas cada situação precisa ser conferida na lei.",
      "A comprovação de união estável, quando não há casamento, exige documentos que demonstrem a vida em comum. Certidão de óbito, documentos pessoais e a qualidade de segurado da pessoa falecida também são analisados.",
      "O momento do pedido pode influenciar o início do pagamento. Por isso, buscar orientação cedo ajuda a evitar perda de prazos e a organizar a documentação com calma.",
      "Este conteúdo é informativo e não substitui atendimento jurídico personalizado.",
    ],
  },
  {
    slug: "revisao-de-beneficios",
    title: "Revisão de benefícios: quando vale analisar o cálculo do INSS",
    category: "Revisões",
    excerpt:
      "Nem toda revisão é automática. Entenda em quais situações uma análise do processo e da memória de cálculo pode ser útil.",
    date: "7 de setembro de 2026",
    dateIso: "2026-09-07",
    image: "/images/desk-still.webp",
    imageAlt:
      "Análise de documentos — imagem institucional para substituição",
    relatedArea: "revisoes-inss",
    paragraphs: [
      "Depois que o benefício é concedido, ainda é possível verificar se o tempo de contribuição, os salários e as regras aplicadas foram considerados corretamente.",
      "Revisões não devem ser pedidas por impulso. É preciso olhar o processo administrativo, a carta de concessão e a legislação vigente na data do pedido original.",
      "Quando existe tempo rural, vínculos sem registro ou períodos especiais, a conferência ganha ainda mais importância. Uma análise prévia evita pedidos genéricos e sem fundamento.",
      "Este conteúdo é informativo e não garante direito à revisão em nenhum caso específico.",
    ],
  },
  {
    slug: "direitos-dos-segurados-do-inss",
    title: "Direitos dos segurados do INSS: clareza para decidir com segurança",
    category: "INSS",
    excerpt:
      "Um panorama acessível sobre qualidade de segurado, carência, recursos e a importância de não assinar nada sem compreender.",
    date: "7 de setembro de 2026",
    dateIso: "2026-09-07",
    image: "/images/hero-office.webp",
    imageAlt:
      "Ambiente institucional ilustrativo — imagem institucional para substituição",
    paragraphs: [
      "Todo segurado tem o direito de ser informado com clareza sobre o andamento do seu pedido, de apresentar documentos e de recorrer quando não concordar com a decisão do INSS.",
      "Qualidade de segurado, carência e tempo de contribuição são conceitos diferentes. Misturá-los é uma das razões mais comuns de pedidos incompletos.",
      "Antes de aceitar uma proposta, desistir de um recurso ou protocolar um novo benefício, vale entender as consequências. Uma conversa objetiva com um advogado previdenciário ajuda a organizar prioridades.",
      "Este conteúdo é informativo e não substitui consulta jurídica.",
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}
