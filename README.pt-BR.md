<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/dogfood-lab/study-swarm/main/assets/study-swarm.png" alt="study-swarm" width="360">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@dogfood-lab/study-swarm"><img src="https://img.shields.io/npm/v/@dogfood-lab/study-swarm" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License"></a>
  <a href="https://dogfood-lab.github.io/study-swarm/"><img src="https://img.shields.io/badge/handbook-live-purple" alt="Handbook"></a>
  <img src="https://img.shields.io/badge/cited%20research-verified-1f6feb" alt="Cited research, verified">
</p>

**Baseie as decisões de design em pesquisa citada — e depois verifique as citações com uma família de modelos *diferente* antes que qualquer parte disso se torne canônica.**

`study-swarm` é um protocolo, não uma ferramenta. Quando você está tomando uma decisão de design substancial com um LLM — uma nova camada de produto, uma escolha de arquitetura, uma decisão de "devemos confiar no modelo aqui" — improvisar a partir de primeiros princípios entrega designs que estão desatualizados, e citar artigos de memória entrega designs que se baseiam em fontes que não existem ou não dizem o que você pensa. study-swarm substitui ambos: despache agentes de pesquisa paralelos, exija descobertas citadas específicas e submeta cada citação a um **verificador externo de uma família de modelos diferente** antes que ela informe o design.

Ele aplica seu próprio remédio. O protocolo prescreve envelopes protegidos por verificador para os sistemas que ajuda a projetar — então ele executa um em si mesmo. **Nenhum modelo corrige sua própria tarefa, incluindo aquele que executa o protocolo.**

## O protocolo em cinco passos

1. **Identifique** 3–5 questões de design cruciais onde evidências empíricas mudariam a resposta.
2. **Despache** um agente de pesquisa por questão, em paralelo. Cada um deve retornar títulos de artigos + autores + anos + URLs + uma descoberta em uma frase — especificidade em vez de amplitude ("6–8 descobertas bem fundamentadas valem mais que 20 gestos vagos").
3. **Sintetize** as descobertas em uma seção de *Base de pesquisa*: `N. **<descoberta>.** <Autores> <ano> (<arXiv/DOI>). <implicação de design>.`
4. **Verifique externamente** — uma *família de modelos diferente*, sem raciocínio, verifica cada citação em duas etapas: um **oráculo de recuperação** confirma que o artigo existe (nunca a memória do modelo), e então uma **lente de fundamentação** confirma que a descoberta corresponde à fonte. **Pare** em caso de fabricação/má atribuição; **pare e escale** se o verificador ou o oráculo de recuperação estiver indisponível (nunca interprete a ausência como "citações estão ok").
5. **Conecte** cada escolha arquitetônica a uma descoberta pelo número. Citações sem uma implicação de design são ruído.

O detalhe executável completo — a tabela de paradas, o padrão de fontes, a regra de conjunto — está em **[PROTOCOL.md](PROTOCOL.md)**.

## Por que uma família *diferente*, sem raciocínio?

Porque os modos de falha são documentados, não hipotéticos:

- **Os LLMs não conseguem verificar de forma confiável suas próprias saídas.** Huang et al. 2023 ([arXiv:2310.01798](https://arxiv.org/abs/2310.01798)); Kambhampati et al. 2024 ([arXiv:2402.01817](https://arxiv.org/abs/2402.01817), LLM-Modulo); Stechly et al. 2024 ([arXiv:2402.08115](https://arxiv.org/abs/2402.08115)) — o verificador externo é responsável pelos ganhos; o conteúdo de autocrítica é inerte.
- **Juízes da mesma família preferem a si mesmos.** Panickssery, Bowman & Feng 2024 ([arXiv:2404.13076](https://arxiv.org/abs/2404.13076)) — o autorreconhecimento correlaciona-se *linearmente* com a autopreferência, portanto, o cegamento parcial não ajuda. Verga et al. 2024 ([arXiv:2404.18796](https://arxiv.org/abs/2404.18796), PoLL) — um painel entre famílias distintas é menos tendencioso a um custo ~7× menor.
- **Citações são onde os LLMs mentem.** Walters & Wilder 2023 ([doi:10.1038/s41598-023-41032-5](https://doi.org/10.1038/s41598-023-41032-5)) — 55% das citações do GPT-3.5 / 18% das citações do GPT-4 são fabricadas. Onweller et al. 2026 ([arXiv:2605.06635](https://arxiv.org/abs/2605.06635)) — os links resolvem >94% das vezes, mas apenas 39–77% do conteúdo citado realmente apoia a afirmação. Portanto, a existência deve ser verificada por **recuperação, não por recordação**.
- **Oculte o raciocínio do gerador.** Khalifa et al. 2026 ([arXiv:2601.14691](https://arxiv.org/abs/2601.14691), "Gaming the Judge") — o raciocínio em cadeia (chain-of-thought) manipulado por si só infla os falsos positivos de um juiz em até 90% com as ações mantidas fixas. Turpin et al. 2023 ([arXiv:2305.04388](https://arxiv.org/abs/2305.04388)) — CoT é uma racionalização a posteriori. O verificador vê a afirmação da citação em si, nunca o 'por que incluí isto'.
- **Diversidade supera quantidade.** Rajan 2025 ([arXiv:2511.16708](https://arxiv.org/abs/2511.16708)) — quatro verificadores com correlação par a par ρ ∈ [0.05, 0.25] superam qualquer um individualmente através de cobertura submodular. Kim et al. 2025 ([arXiv:2506.07962](https://arxiv.org/abs/2506.07962)) — os erros dos LLMs são *correlacionados*, portanto, a variável crucial é a diversidade das lentes, não a quantidade bruta.

## Funciona de verdade? (prova)

Como teste, o protocolo foi executado contra suas próprias citações. Duas famílias não Claude e decorrelacionadas — **Mistral** (`mistral-small:24b`) e **IBM Granite** (`granite4.1:30b`) — verificaram um conjunto de citações, sem o raciocínio, plantadas com duas armadilhas cegas:

| Armadilha plantada | Mistral | IBM Granite | Verdade fundamental |
|---|---|---|---|
| Prompt de raciocínio em cadeia atribuído a "Nakamura & Olsen" | perdida | **apanhada** (atribuída incorretamente → na verdade Wei et al. 2022, arXiv:2201.11903) | atribuída incorretamente |
| um artigo fabricado "98% dos erros removidos, sem necessidade de oráculo" | **caught** (fabricated) | **caught** (fabricated) | fabricado |

Nenhuma das famílias apanhou ambas as armadilhas sozinha — mas a sua **união apanhou 2/2**. Um único juiz teria deixado passar a atribuição incorreta. Separadamente, o oráculo de recuperação apanhou duas atribuições incorretas *reais* nos nossos próprios documentos de projeto (artigos citados com o primeiro autor incorreto) que nenhum LLM paramétrico poderia ter sinalizado — e confirmou corretamente artigos genuínos de 2026 que ambos os LLMs sinalizaram falsamente como fabricados simplesmente porque os artigos são posteriores ao seu treinamento. Esse último ponto é a razão pela qual a verificação de existência da Etapa 4 **deve** ser um oráculo de recuperação, nunca um LLM.

Essa única execução é a tese em miniatura: **lentes decorrelacionadas + um oráculo de recuperação para existência superam qualquer juiz inteligente.**

## Como funciona

Pode executar o protocolo manualmente — qualquer modelo de família diferente, além de resolver o arXiv/DOI você mesmo, satisfaz a Etapa 4. Duas ferramentas irmãs tornam isso um único comando:

- **[prism-verify](https://github.com/mcp-tool-shop-org/prism-verify)** — o verificador em tempo de execução: roteamento diferenciado por família, sem raciocínio, adjudicação multilente, um piso determinístico de existência de recuperação (arXiv → Crossref) e recibos assinados.
- **[role-os](https://github.com/mcp-tool-shop-org/role-os)** — fornece `roleos verify-citations <dispatch>`, o executor que extrai as citações de um despacho e as encaminha através do prism.

A transferência é o próprio formato do despacho: uma descoberta escrita como `N. **descoberta.** Autores ano (arXiv|DOI). implicação.` — com **um identificador resolvível por descoberta** — é exatamente o que `roleos verify-citations` extrai e encaminha. Um despacho limpo pelo `lint` é transferido sem problemas; uma citação malformada é o que o executor sinaliza como não analisada. Esse contrato é o que `study-swarm lint` verifica localmente, para que o Passo 3 e o Passo 4 concordem sobre o que é uma citação.

## CLI

```bash
npm i -g @dogfood-lab/study-swarm     # or run ad-hoc: npx @dogfood-lab/study-swarm <command>
```

| Comando | O que faz |
|---|---|
| `study-swarm protocol` | Imprime o protocolo completo — os cinco passos, a tabela de parada, o padrão de fontes. |
| `study-swarm new <slug>` | Gera o esqueleto de um `<slug>.dispatch.md` com a estrutura de cinco passos para preencher. |
| `study-swarm lint [--json] <path…>` | Verifica a *Base de pesquisa* de um despacho em relação ao padrão de fontes — cada descoberta precisa de um autor, um ano e um identificador resolvível (arXiv / DOI / URL); o discurso vago de "estudos mostram..." é rejeitado. Sai com `1` em caso de violações, para que bloqueie a CI. Um `<path>` pode ser um arquivo, um diretório (verificado recursivamente para `*.dispatch.md`), ou `-` para stdin; `--json` emite um relatório legível por máquina. |

`lint` é determinístico — zero chamadas ao modelo — portanto, é seguro na CI. Ele impõe o **padrão de fontes do Passo 3** localmente; a verificação baseada em modelo do **Passo 4** ainda depende de [`roleos verify-citations`](https://github.com/mcp-tool-shop-org/role-os) → prism.

Um ciclo típico:

```bash
study-swarm new my-decision                      # creates my-decision.dispatch.md
# …fill in the questions, run the research dispatch, write the findings…
study-swarm lint my-decision.dispatch.md         # enforce the sourcing standard (Step 3)
roleos verify-citations my-decision.dispatch.md  # model-based Step 4 (different family, via prism)
```

Um despacho completo e limpo pelo `lint` — study-swarm aplicado ao seu próprio design — está disponível em [`examples/study-swarm-self.dispatch.md`](examples/study-swarm-self.dispatch.md) como uma referência prática.

### Bloqueie na CI

`lint` aceita um arquivo, um diretório (verificado recursivamente para `*.dispatch.md`), ou `-` para stdin, e `--json` emite um relatório legível por máquina. Adicione isto ao seu repositório para bloquear as fontes de cada despacho em cada PR (um exemplo para copiar e colar também está em [`examples/study-swarm-ci.yml`](examples/study-swarm-ci.yml)):

```yaml
# .github/workflows/dispatches.yml
name: study-swarm lint
on:
  pull_request:
    paths: ['**/*.dispatch.md', '.github/workflows/dispatches.yml']
  workflow_dispatch:
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npx @dogfood-lab/study-swarm@latest lint dispatches/
```

## Por que funciona, em uma só frase

**Atual** — o campo avança rapidamente; exigir estudos específicos com anos impede que os designs fiquem 18 meses atrasados. **Funcional** — as evidências mostram o que *falha*, não apenas o que funciona (explicações podem aumentar a confiança excessiva em IA *errada* — Bansal et al. 2021, [arXiv:2006.14779](https://arxiv.org/abs/2006.14779)). **Seguro** — o envelope protegido pelo verificador é a arquitetura que as evidências suportam, e o protocolo a impõe em sua própria saída. A citação de fontes não é teatro acadêmico; é o rastro de evidências.

## Segurança

`study-swarm` é fornecido com uma **CLI leve e sem dependências** (`study-swarm`) juntamente com a metodologia. Ele não faz **nenhuma chamada de rede ou de modelo** e não coleta **telemetria**; não há segredos ou credenciais no código-fonte. Em tempo de execução, ele apenas lê o arquivo que você passa para `lint` e escreve um único `<slug>.dispatch.md` no diretório atual para `new` (recusando sobrescrever e nunca fora do diretório de trabalho). A verificação baseada em modelo que a metodologia descreve (Passo 4) é executada pelas ferramentas irmãs, não por este pacote. Consulte [SECURITY.md](SECURITY.md).

## Status

Um protocolo funcional, verificado externamente por sua própria maquinaria — uma família de modelos diferente verifica suas citações (veja a prova acima). Este repositório é a referência pública; [PROTOCOL.md](PROTOCOL.md) é a forma executável. Parte da família [dogfood-lab](https://github.com/dogfood-lab) — métodos e vitrines para construir na era da IA.

Licenciado pelo MIT.

---

<p align="center"><sub>Part of the <a href="https://github.com/dogfood-lab">dogfood-lab</a> family — methods &amp; showcases for building in the AI era. Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.</sub></p>
