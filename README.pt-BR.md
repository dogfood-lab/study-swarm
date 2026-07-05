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

**Baseie as decisões de projeto em pesquisas citadas — e, em seguida, verifique as citações com um *modelo diferente* antes que qualquer coisa se torne parte do cânone.**

`study-swarm` é um protocolo, não uma ferramenta. Ao tomar uma decisão de projeto importante com um LLM — uma nova camada de produto, uma escolha arquitetural, uma decisão sobre "se devemos confiar no modelo aqui" — improvisar a partir de princípios básicos resulta em projetos desatualizados e citar artigos de memória leva a projetos baseados em fontes que não existem ou que não dizem o que você pensa. O `study-swarm` substitui ambos: ele envia agentes de pesquisa paralelos, exige descobertas específicas citadas e valida cada citação por meio de um **verificador externo de uma família de modelos diferente** antes que ela influencie o projeto.

Ele aplica sua própria abordagem. O protocolo prescreve "envelopes" protegidos por verificadores para os sistemas que ele ajuda a projetar — portanto, ele executa um deles em si mesmo. **Nenhum modelo avalia seu próprio trabalho, incluindo o que está executando o protocolo.**

## O protocolo em cinco etapas:

1. **Identifique** 3 a 5 questões de projeto cruciais, nas quais evidências empíricas mudariam a resposta.
2. **Envie** um agente de pesquisa por questão, em paralelo. Cada um deve retornar títulos de artigos + autores + anos + URLs + uma descoberta em uma frase — especificidade em vez de amplitude ("6 a 8 descobertas bem fundamentadas superam 20 observações vagas").
3. **Sintetize** as descobertas em uma seção de *fundamentação da pesquisa*: `N. **<descoberta>.** <Autores> <ano> (<arXiv/DOI>). <implicação para o projeto>.`
4. **Verifique externamente** — uma *família de modelos diferente*, sem raciocínio, verifica cada citação em duas etapas: um **oráculo de recuperação** confirma que o artigo existe (nunca a memória do modelo) e, em seguida, uma lente de **validação** confirma que a descoberta corresponde à fonte. **Interrompa** se for fabricada/atribuída incorretamente; **interrompa e alerte** se o verificador ou o oráculo de recuperação não estiverem disponíveis (nunca interprete a ausência como "citações válidas").
5. **Conecte** cada escolha arquitetural a uma descoberta por meio de um número. Citações sem implicação para o projeto são ruído.

Os detalhes completos e executáveis — a tabela de interrupção, o padrão de referência e a regra do conjunto — estão em **[PROTOCOL.md](PROTOCOL.md)**.

## Por que uma *família diferente*, sem raciocínio?

Porque os modos de falha são documentados, não hipotéticos:

- **Os LLMs não conseguem verificar de forma confiável sua própria saída.** Huang et al. 2023 ([arXiv:2310.01798](https://arxiv.org/abs/2310.01798)); Kambhampati et al. 2024 ([arXiv:2402.01817](https://arxiv.org/abs/2402.01817), LLM-Modulo); Stechly et al. 2024 ([arXiv:2402.08115](https://arxiv.org/abs/2402.08115)) — o verificador externo traz os benefícios; o conteúdo de autocrítica é inerte.
- **Juízes da mesma família se auto favorecem.** Panickssery, Bowman & Feng 2024 ([arXiv:2404.13076](https://arxiv.org/abs/2404.13076)) — o autorreconhecimento está correlacionado *linearmente* com a autopreferência, portanto, o bloqueio parcial não ajuda. Verga et al. 2024 ([arXiv:2404.18796](https://arxiv.org/abs/2404.18796), PoLL) — um painel de famílias distintas é menos tendencioso, com um custo cerca de 7 vezes menor.
- **As citações são onde os LLMs mentem.** Walters & Wilder 2023 ([doi:10.1038/s41598-023-41032-5](https://doi.org/10.1038/s41598-023-41032-5)) — 55% das citações do GPT-3.5 / 18% do GPT-4 são fabricadas. Onweller et al. 2026 ([arXiv:2605.06635](https://arxiv.org/abs/2605.06635)) — os links resolvem >94% das vezes, mas apenas 39–77% do conteúdo citado realmente sustentam a afirmação. Portanto, a existência deve ser verificada por meio de **recuperação, não de recordação**.
- **Oculte o raciocínio do gerador.** Khalifa et al. 2026 ([arXiv:2601.14691](https://arxiv.org/abs/2601.14691), "Gaming the Judge") — a manipulação da cadeia de pensamento sozinha aumenta os falsos positivos de um juiz em até 90%, com as ações mantidas fixas. Turpin et al. 2023 ([arXiv:2305.04388](https://arxiv.org/abs/2305.04388)) — a cadeia de pensamento é uma racionalização *a posteriori*. O verificador vê apenas a afirmação da citação, nunca o "por que eu incluí isso".
- **A diversidade supera a quantidade.** Rajan 2025 ([arXiv:2511.16708](https://arxiv.org/abs/2511.16708)) — quatro verificadores com correlação de pares ρ ∈ [0,05, 0,25] superam qualquer um deles por meio da cobertura submodular. Kim et al. 2025 ([arXiv:2506.07962](https://arxiv.org/abs/2506.07962)) — os erros do LLM são *correlacionados*, portanto, a variável crucial é a diversidade das lentes, não a quantidade bruta.

## Ele realmente funciona? (prova)

Como teste, o protocolo foi executado em suas próprias citações. Duas famílias decorrelacionadas e diferentes do Claude — **Mistral** (`mistral-small:24b`) e **IBM Granite** (`granite4.1:30b`) — verificaram um conjunto de citações, sem raciocínio, com duas armadilhas ocultas:

| Armadilha plantada | Mistral | IBM Granite | Verdade factual |
|---|---|---|---|
| O raciocínio da cadeia de pensamento foi atribuído a "Nakamura & Olsen" | não detectada | **detectada** (atribuição incorreta → na verdade, Wei et al. 2022, arXiv:2201.11903) | atribuída incorretamente |
| um artigo fabricado com a afirmação de que "98% dos erros foram removidos, nenhum oráculo é necessário" | **caught** (fabricated) | **caught** (fabricated) | fabricado |

Nenhuma das famílias detectou as duas armadilhas sozinha — mas sua **união detectou 2/2**. Um único juiz teria aceitado a atribuição incorreta. Separadamente, o oráculo de recuperação detectou duas *atribuições incorretas reais* em nossos próprios documentos de projeto (artigos citados sob o autor principal errado) que nenhum LLM paramétrico poderia ter sinalizado — e ele confirmou corretamente artigos genuínos de 2026 que ambos os LLMs marcaram falsamente como fabricados, simplesmente porque os artigos são posteriores ao seu treinamento. Esse último ponto é a razão pela qual a verificação da existência na etapa 4 **deve** ser um oráculo de recuperação, nunca um LLM.

Essa única execução é a tese em miniatura: **lentes decorrelacionadas + um oráculo de recuperação para a existência superam qualquer juiz inteligente.**

### …e novamente, para projetar a v1.1

As melhorias da versão 1.1 foram escolhidas da mesma forma – executando o `study-swarm` no próprio `study-swarm`. Quatro questões que a primeira versão deixou em aberto (“Acho que…” – como *mecanizar* a verificação da fundamentação, se a fundamentação deve ser feita no momento da geração, como *combinar* as lentes, se deve abster-se na incerteza calibrada) foram encaminhadas para agentes de pesquisa paralelos, e todas as **27 citações resultantes** foram validadas na Etapa 4 antes que qualquer uma delas influenciasse o projeto. O oráculo de recuperação confirmou que **27/27 existem** – incluindo seis artigos de 2025–2026 que um modelo paramétrico teria classificado erroneamente como fabricados – e corrigiu cinco atribuições que um modelo não conseguiria, entre elas uma real má atribuição do primeiro autor que o agente de pesquisa identificou em si mesmo. Executando sem raciocínio, as lentes de fundamentação até reproduziram seus próprios modos de falha documentados em nossa análise: uma delas rotulou incorretamente um artigo real com confiança, e sua *discordância* desencadeou a escalada – exatamente como o processo estabelece. A análise completa está disponível em [`examples/study-swarm-v1_1.dispatch.md`](examples/study-swarm-v1_1.dispatch.md); as melhorias que foram implementadas – fundamentação decomposta/ternária, fundamentação no momento da geração, a cascata validada pelo oráculo e a abstinência calibrada – estão em [PROTOCOL.md](PROTOCOL.md).

## Como funciona

Você pode executar o protocolo manualmente – qualquer modelo de família diferente mais a resolução do arXiv/DOI por conta própria satisfaz a Etapa 4. Duas ferramentas complementares tornam isso um único comando:

- **[prism-verify](https://github.com/mcp-tool-shop-org/prism-verify)** – o verificador em tempo de execução: roteamento entre famílias diferentes, sem raciocínio, adjudicação multi-lente, um limite determinístico para a existência da recuperação (arXiv → Crossref) e recibos assinados.
- **[role-os](https://github.com/mcp-tool-shop-org/role-os)** – fornece `roleos verify-citations <dispatch>`, o executor que extrai as citações de uma análise e as valida por meio do prism.

A transferência é o próprio formato da análise: um achado escrito como `N. **achado.** Autores ano (arXiv|DOI). implicação.` – com **um identificador resolvível por achado** – é exatamente o que `roleos verify-citations` extrai e valida. Uma análise “limpa” passa facilmente; uma citação malformada é o que o executor sinaliza como não analisada. Esse contrato é o que `study-swarm lint` verifica localmente, para que as Etapas 3 e 4 concordem sobre o que é uma citação.

## CLI

```bash
npm i -g @dogfood-lab/study-swarm     # or run ad-hoc: npx @dogfood-lab/study-swarm <command>
```

| Comando | O que ele faz |
|---|---|
| `study-swarm protocol` | Imprime o protocolo completo – as cinco etapas, a tabela de interrupção e o padrão de referência. |
| `study-swarm new <slug>` | Cria um arquivo `<slug>.dispatch.md` com o esqueleto das cinco etapas para preencher. |
| `study-swarm lint [--json] [--strict] <path…>` | Verifique a *base de pesquisa* de um relatório em relação ao padrão de fontes – cada conclusão deve ter um autor, um ano e um identificador que possa ser localizado (arXiv / DOI / URL / RFC); argumentos vagos do tipo "estudos mostram…" são rejeitados. Retorne `1` em caso de violações, para que isso impeça a execução do CI. Um `<caminho>` pode ser um arquivo, um diretório (verificado recursivamente para `*.dispatch.md`) ou `-` para entrada padrão; `--json` gera um relatório legível por máquina. `--strict` também sinaliza **citações órfãs** – uma conclusão que nenhuma escolha da Etapa 5 referencia –, já que "citações sem conexão são ruído" (opcional, portanto, a configuração padrão do CI permanece inalterada). |
| `study-swarm lock --init <dispatch>` | Crie o arquivo `<dispatch>.orchestration.json` – um modelo de registro para preencher os campos (uma etapa por agente da Etapa 2) para fornecer ao comando `lock … --from`. |
| `study-swarm lock <dispatch> --from <orchestration.json>` | Fixe um envio para reprodução – crie o arquivo `<dispatch>.lock.json` com informações de conteúdo, conforme o agente da Etapa 2, incluindo o **ID do modelo resolvido** + o **SHA-256 do prompt exato em bytes** + o **SHA-256 do esquema da ferramenta**, mais o **comprovante do verificador** da Etapa 4, tudo reunido em um único arquivo `lock_sha256`. |
| `study-swarm lock --verify <dispatch> [--from …]` | Recalcule esses hashes e verifique se correspondem ao bloqueio; qualquer desvio resulta em saída `1`, portanto, controla o CI como um arquivo de bloqueio de pacote. Sem `--from`, verifica a própria integridade do bloqueio. |
| `study-swarm withdraw <id> --reason <reason> [--from <dir>] [--receipt <path>]` | **Mecanismo de compensação para reversão do canon.** Marcar cada registro no corpus cujo *fundamento da pesquisa* cite `<id>` como `evidência-retirada` (um arquivo auxiliar `<slug>.withdrawn.json` — marcar, nunca excluir) e emitir um comprovante de retirada com base no conteúdo. `--reason` ∈ `fabricado · atribuído incorretamente · revogado · verificador alterado · outro`. |
| `study-swarm requalify --check <corpus-dir>` | Falhar em modo fechado (sair com código `1`) para qualquer registro que contenha uma marcação `evidência-retirada` não resolvida — o sinalizador que **interrompe** os elementos dependentes de um resultado retirado até que seja removido ou reavaliado. Gates CI. |
| `study-swarm requalify --status <corpus-dir> [--json]` | Visualização somente leitura do estado de validade das evidências de um corpus – contagem de conclusões retiradas versus resolvidas, uma divisão por motivo e modo de resolução, linhas por relatório. Informativo (retorna `0`), diferente da verificação `--check`. |
| `study-swarm requalify --resolve <registro> <id> --mode removed\ | regrounded [--note …]` | Remover uma marcação assim que o resultado for removido (a citação desaparecer) ou reavaliado (reverificado e validado pelo executor irmão; `--note` registra a confirmação). Idempotente; adiciona ao histórico de auditoria do arquivo auxiliar. |

`lint` é determinístico – sem chamadas de modelo – portanto, é seguro no CI. Ele aplica o **padrão de referência da Etapa 3** localmente; a verificação baseada em modelo da **Etapa 4** ainda depende de [`roleos verify-citations`](https://github.com/mcp-tool-shop-org/role-os) → prism.

Um ciclo típico:

```bash
study-swarm new my-decision                      # creates my-decision.dispatch.md
# …fill in the questions, run the research dispatch, write the findings…
study-swarm lint my-decision.dispatch.md         # enforce the sourcing standard (Step 3)
roleos verify-citations my-decision.dispatch.md  # model-based Step 4 (different family, via prism)
```

Quatro registros completos, limpos e funcionais são enviados como referência: [`examples/study-swarm-self.dispatch.md`](examples/study-swarm-self.dispatch.md) (a decisão central do protocolo, concisa), [`examples/study-swarm-v1_1.dispatch.md`](examples/study-swarm-v1_1.dispatch.md) (o design completo da versão 1.1 — 27 citações, todas verificadas externamente), [`examples/study-swarm-lock.dispatch.md`](examples/study-swarm-lock.dispatch.md) (o design de bloqueio da versão 1.2 — 39 citações, controlado pelo executor e o primeiro registro a enviar seu próprio bloqueio) e [`examples/study-swarm-canon-rollback.dispatch.md`](examples/study-swarm-canon-rollback.dispatch.md) (o design de reversão do canon da versão 1.3 — 27 citações em relação à revogação, retração, sequências e invalidação da construção, e o primeiro registro a ser retirado e depois reavaliado).

### Valide no CI

`lint` recebe um arquivo, um diretório (analisado recursivamente para `*.dispatch.md`) ou `-` para stdin, e `--json` emite um relatório legível por máquina. Adicione isso ao seu repositório para validar a referência de cada análise em cada PR (uma amostra de cópia e colagem também está em [`examples/study-swarm-ci.yml`](examples/study-swarm-ci.yml)):

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
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npx @dogfood-lab/study-swarm@latest lint dispatches/
      # Halt the build while any finding that became canon is withdrawn and not yet
      # removed or re-grounded — the canon-rollback andon (exit 1 on any unresolved flag).
      - run: npx @dogfood-lab/study-swarm@latest requalify --check dispatches/
```

### Fixe um envio para reprodução (`dispatch.lock.json`)

Um envio validado e comprovado só pode ser auditado se você puder dizer *o que o gerou*. `study-swarm lock` cria um arquivo de bloqueio complementar que, por meio do agente de pesquisa, contém informações sobre o **ID do modelo resolvido** (nunca um alias flutuante), o **SHA-256 do prompt exato em bytes** e o **SHA-256 do esquema da ferramenta** fornecido, mais o **comprovante externo do verificador** – tudo reunido em um único arquivo `lock_sha256`. `study-swarm lock --verify` recalcula esses hashes e falha se houver qualquer desvio, portanto, um prompt alterado, um modelo substituído ou uma ferramenta modificada são detectados – o padrão de reprodutibilidade [PIN_PER_STEP](https://github.com/dogfood-lab/study-swarm), que pode ser executado. O sistema emite o registro; a CLI permanece sem dependências e independente da rede, apenas normalizando (RFC 8785), calculando hashes e validando.

**Ele fixa as entradas, não as saídas.** Fixar modelo + prompt + temperatura *não* torna a saída de um LLM bit a bit idêntica – invariância em lote, não associatividade de ponto flutuante, roteamento de mistura de especialistas e desvio silencioso do provedor estão todos fora do controle de uma ferramenta offline. Portanto, o bloqueio fornece **entradas reproduzíveis e saídas com detecção de desvio**, nunca "reprodução determinística". O design é fundamentado, citação por citação, em [`examples/study-swarm-lock.dispatch.md`](examples/study-swarm-lock.dispatch.md) – o primeiro envio a incluir seu próprio bloqueio ([`examples/study-swarm-lock.lock.json`](examples/study-swarm-lock.lock.json)).

### Reverter um resultado retirado (`withdraw` / `requalify`)

Um resultado verificado torna-se **canon** — ele informa uma decisão subsequente. Então, o que acontece quando ele é posteriormente **retirado** (uma citação se revela fabricada/atribuída incorretamente em uma nova execução, um artigo citado é retirado ou o controle o altera)? Um `git revert` não é suficiente, porque o resultado já foi propagado. O mecanismo de compensação para reversão do canon torna a limpeza executável:

```bash
study-swarm withdraw arXiv:2402.15089 --reason misattributed --from dispatches/ --receipt rollback.json
#   → flags every dispatch citing it `evidence-withdrawn` (a tombstone sidecar — flag, never delete)
#     and writes a content-addressed withdrawal receipt naming every dependent.
study-swarm requalify --check dispatches/          # exit 1 while any flag is unresolved — the andon HALT
study-swarm requalify --resolve d.dispatch.md arXiv:2402.15089 --mode removed   # or: --mode regrounded --note "<attestation>"
```

`requalify --check` **falha em modo fechado** até que cada resultado marcado seja removido ou **reavaliado** (reverificado e validado pelo executor irmão — a CLI registra a confirmação, não o faz por conta própria). A retirada é apresentada de forma **contrastante**, nunca como uma remoção silenciosa. Tudo — o arquivo auxiliar e o comprovante — tem base no conteúdo e pode ser detectado em caso de desvio, e opera apenas na camada de *evidência*: `lock --verify` não é afetado por uma retirada. O design é baseado em [`examples/study-swarm-canon-rollback.dispatch.md`](examples/study-swarm-canon-rollback.dispatch.md), e o [PROTOCOL.md](PROTOCOL.md) §"Compensando um resultado retirado" é a forma executável. Este é o padrão **NAMED_COMPENSATORS** tornado executável: uma operação de desfazer nomeada e idempotente que deixa um estado pós-operacional conhecido e um comprovante.

## Por que funciona, em poucas palavras

**Atual** – o campo evolui rapidamente; exigir estudos específicos com anos evita que os projetos sejam lançados com 18 meses de atraso. **Funcional** – a evidência mostra o que *falha*, não apenas o que funciona (explicações podem aumentar a dependência excessiva em IA *incorreta* – Bansal et al. 2021, [arXiv:2006.14779](https://arxiv.org/abs/2006.14779)). **Seguro** – o envelope protegido pelo verificador é a arquitetura que a evidência suporta, e o protocolo a aplica em sua própria saída. A referência não é um exercício acadêmico; é o rastro da evidência.

## Segurança

`study-swarm` fornece uma **CLI fina e com poucas dependências** (`study-swarm`) junto com a metodologia. Ele não faz **chamadas de rede ou modelo** e não coleta **telemetria**; não há segredos ou credenciais no código-fonte. Em tempo de execução, ele lê apenas o arquivo que você passa para `lint` e grava um único arquivo `<slug>.dispatch.md` no diretório atual para `new` (recusando-se a sobrescrever e nunca fora do diretório de trabalho). A verificação baseada em modelo descrita na metodologia (Etapa 4) é executada pelas ferramentas complementares, não por este pacote. Consulte [SECURITY.md](SECURITY.md).

## Status

Um protocolo funcional, verificado externamente por seu próprio mecanismo – uma família de modelos diferente verifica suas citações (veja a prova acima). A **versão 1.1** aprimora o verificador, onde a primeira versão estava silenciosa: base de pesquisa decomposta/ternária, base de pesquisa no momento da geração, um sistema em cascata controlado por um oráculo para combinar lentes e abstinência calibrada – cada um baseado na verificação da versão 1.1 do relatório. A **versão 1.2** torna um relatório reproduzível: `study-swarm lock` fixa o modelo, o prompt e o esquema de ferramentas resolvidos por etapa, além do recibo do verificador, e `lock --verify` falha se houver desvio. A **versão 1.3** torna a reversão executável: quando uma conclusão que já se tornou um padrão é retirada, `study-swarm withdraw` sinaliza todas as dependências e `requalify --check` interrompe sua execução até que sejam removidas ou reavaliadas – um compensador nomeado, com recibo e idempotente. A **versão 2.0** torna mais partes do protocolo executáveis e reforça o bloqueio: `lint --strict` sinaliza citações órfãs – a única falha detectável pela CLI –, `lock --init` cria o modelo de registro, `requalify --status` lê o estado de validade das evidências de um corpus e o endereçamento de conteúdo do bloqueio é separado por domínio (esquema de artefato v2 – um bloqueio de uma versão anterior é regenerado em vez de ser sinalizado incorretamente como adulterado; a interface de linha de comando permanece compatível com versões anteriores). Este repositório é a referência pública; [PROTOCOL.md](PROTOCOL.md) é a forma executável. Parte da família [dogfood-lab](https://github.com/dogfood-lab) – métodos e demonstrações para construir na era da IA.

Licenciado sob MIT.

---

<p align="center"><sub>Part of the <a href="https://github.com/dogfood-lab">dogfood-lab</a> family — methods &amp; showcases for building in the AI era. Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.</sub></p>
