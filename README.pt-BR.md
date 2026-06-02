<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/dogfood-lab/study-swarm/main/assets/study-swarm.png" alt="study-swarm" width="360">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License"></a>
  <a href="https://dogfood-lab.github.io/study-swarm/"><img src="https://img.shields.io/badge/handbook-live-purple" alt="Handbook"></a>
  <img src="https://img.shields.io/badge/cited%20research-verified-1f6feb" alt="Cited research, verified">
</p>

**Baseie as decisões de design em pesquisas citadas — e, em seguida, verifique as citações com um *modelo diferente* antes que qualquer coisa se torne um padrão.**

`study-swarm` é um protocolo, não uma ferramenta. Ao tomar uma decisão de design importante com um LLM — uma nova camada de produto, uma escolha de arquitetura, uma decisão sobre "se devemos confiar no modelo aqui" — improvisar a partir de princípios básicos resulta em designs desatualizados, e citar artigos de memória resulta em designs que se baseiam em fontes que não existem ou que não dizem o que você pensa. O `study-swarm` substitui ambos: envie agentes de pesquisa em paralelo, exija descobertas específicas citadas e valide cada citação por meio de um **verificador externo de uma família de modelos diferente** antes que ela influencie o design.

Ele aplica sua própria abordagem. O protocolo prescreve "envelopes" protegidos por verificadores para os sistemas que ele ajuda a projetar — portanto, ele executa um deles em si mesmo. **Nenhum modelo avalia seu próprio trabalho, incluindo o que executa o protocolo.**

## O protocolo em cinco etapas

1. **Identifique** 3 a 5 questões de design cruciais, nas quais evidências empíricas mudariam a resposta.
2. **Envie** um agente de pesquisa por questão, em paralelo. Cada um deve retornar títulos de artigos + autores + anos + URLs + uma descoberta em uma frase — especificidade em vez de amplitude ("6 a 8 descobertas bem fundamentadas superam 20 observações vagas").
3. **Sintetize** as descobertas em uma seção de *Fundamentação da pesquisa*: `N. **<descoberta>.** <Autores> <ano> (<arXiv/DOI>). <implicação para o design>.`
4. **Verifique externamente** — uma *família de modelos diferente*, sem raciocínio, verifica cada citação em duas etapas: um **oráculo de recuperação** confirma que o artigo existe (nunca a memória do modelo) e, em seguida, uma lente de **fundamentação** confirma que a descoberta corresponde à fonte. **Interrompa** se for fabricada/atribuída incorretamente; **interrompa e alerte** se o verificador ou o oráculo de recuperação não estiverem disponíveis (nunca interprete a ausência como "citações válidas").
5. **Conecte** cada escolha arquitetônica a uma descoberta por número. Citações sem uma implicação para o design são ruído.

Os detalhes completos e executáveis — a tabela de interrupção, o padrão de referência e a regra de conjunto — estão em **[PROTOCOL.md](PROTOCOL.md)**.

## Por que uma *família diferente*, sem raciocínio?

Porque os modos de falha são documentados, não hipotéticos:

- **Os LLMs não conseguem verificar de forma confiável sua própria saída.** Huang et al. 2023 ([arXiv:2310.01798](https://arxiv.org/abs/2310.01798)); Kambhampati et al. 2024 ([arXiv:2402.01817](https://arxiv.org/abs/2402.01817), LLM-Modulo); Stechly et al. 2024 ([arXiv:2402.08115](https://arxiv.org/abs/2402.08115)) — o verificador externo traz os benefícios; o conteúdo de autocrítica é inerte.
- **Juízes da mesma família se auto favorecem.** Panickssery, Bowman & Feng 2024 ([arXiv:2404.13076](https://arxiv.org/abs/2404.13076)) — o auto reconhecimento se correlaciona *linearmente* com a auto preferência, portanto, o obscurecimento parcial não ajuda. Verga et al. 2024 ([arXiv:2404.18796](https://arxiv.org/abs/2404.18796), PoLL) — um painel em famílias distintas é menos tendencioso, com um custo ~7 vezes menor.
- **As citações são onde os LLMs mentem.** Walters & Wilder 2023 ([doi:10.1038/s41598-023-41032-5](https://doi.org/10.1038/s41598-023-41032-5)) — 55% das citações do GPT-3.5 / 18% do GPT-4 são fabricadas. Onweller et al. 2026 ([arXiv:2605.06635](https://arxiv.org/abs/2605.06635)) — os links resolvem >94% das vezes, mas apenas 39–77% do conteúdo citado realmente sustentam a afirmação. Portanto, a existência deve ser verificada por **recuperação, não por recordação**.
- **Oculte o raciocínio do gerador.** Khalifa et al. 2026 ([arXiv:2601.14691](https://arxiv.org/abs/2601.14691), "Gaming the Judge") — a manipulação do raciocínio em cadeia, por si só, inflaciona os falsos positivos de um juiz em até 90%, com as ações mantidas fixas. Turpin et al. 2023 ([arXiv:2305.04388](https://arxiv.org/abs/2305.04388)) — o raciocínio em cadeia é uma racionalização *a posteriori*. O verificador vê apenas a afirmação da citação, nunca o "por que eu incluí isso".
- **Diversidade supera a quantidade.** Rajan 2025 ([arXiv:2511.16708](https://arxiv.org/abs/2511.16708)) — quatro verificadores com correlação pareada ρ ∈ [0.05, 0.25] superam qualquer um deles por meio da cobertura submodular. Kim et al. 2025 ([arXiv:2506.07962](https://arxiv.org/abs/2506.07962)) — os erros do LLM são *correlacionados*, portanto, a variável crucial é a diversidade das lentes, não a quantidade bruta.

## Ele realmente funciona? (prova)

Como teste, o protocolo foi executado em suas próprias citações. Duas famílias não correlacionadas, diferentes do Claude — **Mistral** (`mistral-small:24b`) e **IBM Granite** (`granite4.1:30b`) — verificaram um conjunto de citações, sem raciocínio, com duas armadilhas ocultas:

| Armadilha plantada | Mistral | IBM Granite | Verdade |
|---|---|---|---|
| O raciocínio em cadeia atribuído a "Nakamura & Olsen" | não detectado | **detectado** (atribuído incorretamente → na verdade, Wei et al. 2022) | atribuído incorretamente |
| um artigo fabricado com "98% dos erros removidos, nenhum oráculo necessário" | **caught** (fabricated) | **caught** (fabricated) | fabricado |

Nenhuma das famílias detectou as duas armadilhas sozinha — mas a **união detectou 2/2**. Um único juiz teria validado a atribuição incorreta. Separadamente, o oráculo de recuperação detectou duas *atribuições incorretas reais* em nossos próprios documentos de design (artigos citados sob o autor principal errado) que nenhum LLM paramétrico poderia ter sinalizado — e ele confirmou corretamente artigos genuínos de 2026 que ambos os LLMs sinalizaram falsamente como fabricados, simplesmente porque os artigos são posteriores ao seu treinamento. Esse último ponto é a razão pela qual a verificação de existência na etapa 4 **deve** ser um oráculo de recuperação, nunca um LLM.

Essa única execução é a tese em miniatura: **lentes descoordenadas + um oráculo de recuperação para existência superam qualquer juiz inteligente.**

## Como está conectado

Você pode executar o protocolo manualmente — qualquer modelo de família diferente, juntamente com a resolução do arXiv/DOI, satisfaz a etapa 4. Duas ferramentas auxiliares tornam isso um único comando:

- **[prism-verify](https://github.com/mcp-tool-shop-org/prism-verify)** — o verificador em tempo de execução: roteamento diferenciado por família, sem inferências, adjudicação multi-lente, um limite determinístico de existência de recuperação (arXiv → Crossref) e recibos assinados.
- **[role-os](https://github.com/mcp-tool-shop-org/role-os)** — fornece `roleos verify-citations <dispatch>`, o executor que extrai as citações de um documento e as valida através do prism.

## Por que funciona, em poucas palavras

**Atual** — o campo evolui rapidamente; exigir estudos específicos com anos de duração impede que os projetos sejam lançados com 18 meses de atraso. **Funcional** — a evidência mostra o que *falha*, não apenas o que funciona (as explicações podem aumentar a dependência excessiva de uma IA *incorreta* — Bansal et al. 2021). **Seguro** — o envelope protegido pelo verificador é a arquitetura que a evidência suporta, e o protocolo a impõe em sua própria saída. A obtenção de fontes não é um exercício acadêmico; é o rastro da evidência.

## Segurança

`study-swarm` é um repositório de documentação — Markdown e um logotipo. Não contém código executável e não instala nada deste repositório. Não acessa dados, não requer permissões e não coleta dados de telemetria; não há segredos ou credenciais no código-fonte. A metodologia *descreve* um fluxo de trabalho que usa recuperação da web e verificação baseada em modelo, mas este repositório não o implementa nem o executa. Consulte [SECURITY.md](SECURITY.md).

## Status

Um protocolo funcional, verificado externamente por sua própria ferramenta — uma família de modelos diferente verifica suas citações (veja a prova acima). Este repositório é a referência pública; [PROTOCOL.md](PROTOCOL.md) é a forma executável. Parte da família [dogfood-lab](https://github.com/dogfood-lab) — métodos e demonstrações para construir na era da IA.

Licenciado sob a licença MIT.

---

<p align="center"><sub>Part of the <a href="https://github.com/dogfood-lab">dogfood-lab</a> family — methods &amp; showcases for building in the AI era. Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.</sub></p>
