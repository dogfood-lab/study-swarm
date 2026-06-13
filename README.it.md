<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

**Fonda le decisioni di progettazione su ricerche citate — quindi verifica le citazioni con una *famiglia* di modelli diversa prima che tutto questo diventi parte integrante del progetto.**

`study-swarm` è un protocollo, non uno strumento. Quando si prende una decisione di progettazione importante con un LLM (Large Language Model) — un nuovo livello di prodotto, una scelta architettonica, una decisione sul fatto che "dovremmo fidarci del modello in questo caso" — improvvisare partendo dai principi fondamentali porta a progetti obsoleti e citare articoli dalla memoria porta a progetti basati su fonti che non esistono o che non dicono quello che si pensa. `study-swarm` sostituisce entrambi: invia agenti di ricerca paralleli, richiede risultati specifici dalle ricerche citate e sottopone ogni citazione a un **verificatore esterno proveniente da una famiglia di modelli diversa** prima che influenzi la progettazione.

Applica la propria medicina. Il protocollo prevede l'utilizzo di "buste" protette dal verificatore per i sistemi che aiuta a progettare, quindi lo applica anche a se stesso. **Nessun modello valuta il proprio lavoro, incluso quello che esegue il protocollo.**

## Il protocollo in cinque passaggi:

1. **Identifica** 3-5 domande di progettazione fondamentali a cui una prova empirica cambierebbe la risposta.
2. **Invia** un agente di ricerca per ogni domanda, in parallelo. Ognuno deve restituire titoli degli articoli + autori + anni + URL + un risultato riassunto in una frase (la specificità è più importante dell'ampiezza: "6-8 risultati ben documentati sono meglio di 20 affermazioni vaghe").
3. **Sintetizza** i risultati in una sezione intitolata *Fondamento della ricerca*: `N. **<risultato>.** <Autori> <anno> (<arXiv/DOI>). <implicazione per la progettazione>.`
4. **Verifica esternamente**: una *famiglia di modelli diversa*, priva di capacità di ragionamento, verifica ogni citazione in due fasi: un **oracolo di recupero** conferma che l'articolo esiste (non si basa mai sulla memoria del modello), quindi una "lente di fondatezza" conferma che il risultato corrisponde alla fonte. **Interrompi** se la citazione è fabbricata o attribuita erroneamente; **interrompi e segnala** se il verificatore o l'oracolo di recupero non sono disponibili (non interpretare mai l'assenza come "le citazioni sono corrette").
5. **Collega** ogni scelta architettonica a un risultato specifico, tramite numero. Le citazioni che non hanno implicazioni per la progettazione sono rumore.

I dettagli completi e eseguibili — la tabella di interruzione, lo standard di riferimento, la regola dell'insieme — si trovano in **[PROTOCOL.md](PROTOCOL.md)**.

## Perché una *famiglia* diversa, priva di capacità di ragionamento?

Perché le modalità di errore sono documentate, non ipotetiche:

- **Gli LLM non possono verificare in modo affidabile i propri risultati.** Huang et al. 2023 ([arXiv:2310.01798](https://arxiv.org/abs/2310.01798)); Kambhampati et al. 2024 ([arXiv:2402.01817](https://arxiv.org/abs/2402.01817), LLM-Modulo); Stechly et al. 2024 ([arXiv:2402.08115](https://arxiv.org/abs/2402.08115)) — il verificatore esterno offre i vantaggi; il contenuto di autocritica è inerte.
- **I giudici della stessa famiglia tendono ad auto-preferirsi.** Panickssery, Bowman & Feng 2024 ([arXiv:2404.13076](https://arxiv.org/abs/2404.13076)) — l'auto-riconoscimento è correlato *linearmente* con l'auto-preferenza, quindi un'attenuazione parziale non aiuta. Verga et al. 2024 ([arXiv:2404.18796](https://arxiv.org/abs/2404.18796), PoLL) — un gruppo proveniente da famiglie diverse è meno influenzato a un costo inferiore di circa 7 volte.
- **Le citazioni sono il punto in cui gli LLM mentono.** Walters & Wilder 2023 ([doi:10.1038/s41598-023-41032-5](https://doi.org/10.1038/s41598-023-41032-5)) — il 55% delle citazioni di GPT-3.5 / il 18% delle citazioni di GPT-4 sono fabbricate. Onweller et al. 2026 ([arXiv:2605.06635](https://arxiv.org/abs/2605.06635)) — i collegamenti risolvono il >94% delle volte, ma solo il 39-77% del contenuto citato supporta effettivamente l'affermazione. Pertanto, l'esistenza deve essere verificata tramite **recupero, non richiamo**.
- **Nascondi il ragionamento del generatore.** Khalifa et al. 2026 ([arXiv:2601.14691](https://arxiv.org/abs/2601.14691), "Gaming the Judge") — la sola manipolazione della catena di pensiero aumenta i falsi positivi di un giudice fino al 90%, mantenendo le azioni fisse. Turpin et al. 2023 ([arXiv:2305.04388](https://arxiv.org/abs/2305.04388)) — la catena di pensiero è una razionalizzazione post-hoc. Il verificatore vede solo l'affermazione della citazione, mai il "perché l'ho inclusa".
- **La diversità batte la quantità.** Rajan 2025 ([arXiv:2511.16708](https://arxiv.org/abs/2511.16708)) — quattro verificatori con una correlazione a coppie ρ ∈ [0.05, 0.25] superano qualsiasi singolo verificatore tramite copertura submodulare. Kim et al. 2025 ([arXiv:2506.07962](https://arxiv.org/abs/2506.07962)) — gli errori degli LLM sono *correlati*, quindi la variabile più importante è la diversità delle "lenti", non la quantità assoluta.

## Funziona davvero? (prova)

Come test, il protocollo è stato applicato alle proprie citazioni. Due famiglie di modelli decorrelate e diverse da Claude — **Mistral** (`mistral-small:24b`) e **IBM Granite** (`granite4.1:30b`) — hanno verificato un insieme di citazioni, senza capacità di ragionamento, con due "trappole" nascoste:

| Trappola piazzata | Mistral | IBM Granite | Verità |
|---|---|---|---|
| Il ragionamento della catena di pensiero è attribuito a "Nakamura & Olsen" | mancato | **rilevato** (attribuito erroneamente → in realtà Wei et al. 2022, arXiv:2201.11903) | attribuito erroneamente |
| un articolo fabbricato con la frase "il 98% degli errori è stato eliminato, non è necessario alcun oracolo" | **caught** (fabricated) | **caught** (fabricated) | fabbricato |

Nessuna delle due famiglie ha rilevato entrambe le trappole da sola, ma la loro **unione ha rilevato 2/2**. Un singolo giudice avrebbe accettato l'attribuzione errata. Inoltre, separatamente, l'oracolo di recupero ha individuato due *vere* attribuzioni errate nei nostri documenti di progettazione (articoli citati con il primo autore sbagliato) che nessun LLM parametrico avrebbe potuto segnalare e ha confermato correttamente articoli reali del 2026 che entrambi gli LLM hanno erroneamente contrassegnato come fabbricati semplicemente perché gli articoli sono successivi alla loro data di addestramento. Quest'ultimo punto è il motivo per cui il controllo dell'esistenza nel passaggio 4 **deve** essere effettuato tramite un oracolo di recupero, mai tramite un LLM.

Questa singola esecuzione rappresenta la tesi in miniatura: **lenti decorrelate + un oracolo di recupero per l'esistenza superano qualsiasi singolo giudice intelligente.**

## Come è strutturato

È possibile eseguire il protocollo manualmente: qualsiasi modello di famiglia diversa, insieme alla risoluzione autonoma di arXiv/DOI, soddisfa il passaggio 4. Due strumenti complementari lo rendono un unico comando:

- **[prism-verify](https://github.com/mcp-tool-shop-org/prism-verify)**: il verificatore in fase di esecuzione: instradamento tra famiglie diverse, ragionamento semplificato, valutazione multilente, un limite inferiore deterministico per l'esistenza dei risultati (arXiv → Crossref) e ricevute firmate.
- **[role-os](https://github.com/mcp-tool-shop-org/role-os)**: fornisce `roleos verify-citations <dispatch>`, lo strumento che estrae le citazioni di un documento e le elabora tramite prism.

Il passaggio è il formato del documento stesso: una scoperta scritta come `N. **scoperta.** Autori anno (arXiv|DOI). implicazione.` — con **un identificatore risolvibile per ogni scoperta** — è esattamente ciò che `roleos verify-citations` elabora e verifica. Un documento "pulito" secondo i criteri di linting viene elaborato correttamente; una citazione malformata è ciò che lo strumento segnala come non analizzata. Questo contratto è ciò che `study-swarm lint` controlla localmente, quindi il passaggio 3 e il passaggio 4 concordano su cosa sia una citazione.

## CLI

```bash
npm i -g @dogfood-lab/study-swarm     # or run ad-hoc: npx @dogfood-lab/study-swarm <command>
```

| Comando | Cosa fa |
|---|---|
| `study-swarm protocol` | Stampa l'intero protocollo: i cinque passaggi, la tabella di arresto, lo standard di riferimento. |
| `study-swarm new <slug>` | Crea uno scheletro `<slug>.dispatch.md` con i cinque passaggi da completare. |
| `study-swarm lint [--json] <path…>` | Verifica il *fondamento della ricerca* di un documento rispetto allo standard di riferimento: ogni scoperta deve avere un autore, un anno e un identificatore risolvibile (arXiv / DOI / URL); le affermazioni generiche del tipo "gli studi dimostrano..." vengono rifiutate. In caso di violazioni, viene restituito `1`, in modo da bloccare la CI. Un `<path>` può essere un file, una directory (analizzata ricorsivamente per i file `*.dispatch.md`) o `-` per l'input standard; `--json` emette un report leggibile dalla macchina. |

`lint` è deterministico: non effettua chiamate al modello, quindi è sicuro da utilizzare nella CI. Applica localmente lo **standard di riferimento del passaggio 3**; la verifica basata su modello del **passaggio 4** si affida ancora a [`roleos verify-citations`](https://github.com/mcp-tool-shop-org/role-os) → prism.

Un ciclo tipico:

```bash
study-swarm new my-decision                      # creates my-decision.dispatch.md
# …fill in the questions, run the research dispatch, write the findings…
study-swarm lint my-decision.dispatch.md         # enforce the sourcing standard (Step 3)
roleos verify-citations my-decision.dispatch.md  # model-based Step 4 (different family, via prism)
```

Un documento completo e "pulito" secondo i criteri di linting (study-swarm applicato al proprio design) è disponibile in [`examples/study-swarm-self.dispatch.md`](examples/study-swarm-self.dispatch.md) come riferimento pratico.

### Bloccalo nella CI

`lint` accetta un file, una directory (analizzata ricorsivamente per i file `*.dispatch.md`) o `-` per l'input standard e `--json` emette un report leggibile dalla macchina. Inseriscilo nel tuo repository per controllare il riferimento di ogni documento in ogni PR (un esempio di copia-incolla è disponibile anche in [`examples/study-swarm-ci.yml`](examples/study-swarm-ci.yml)):

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

## Perché funziona, in sintesi

**Attuale**: il settore si evolve rapidamente; richiedere studi specifici con indicazione dell'anno evita che i progetti siano pronti con 18 mesi di ritardo. **Funzionale**: le prove mostrano cosa *fallisce*, non solo cosa funziona (le spiegazioni possono aumentare l'eccessiva dipendenza da un'IA *errata* — Bansal et al. 2021, [arXiv:2006.14779](https://arxiv.org/abs/2006.14779)). **Sicuro**: l'ambito protetto dal verificatore è l'architettura supportata dalle prove e il protocollo lo applica ai propri risultati. Il riferimento non è un esercizio accademico; è la traccia delle prove.

## Sicurezza

`study-swarm` fornisce una **CLI sottile, con zero dipendenze** (`study-swarm`) insieme alla metodologia. Non effettua **chiamate di rete o al modello** e non raccoglie **dati di telemetria**: non ci sono segreti o credenziali nel codice sorgente. In fase di esecuzione legge solo il file che viene passato a `lint` e scrive un singolo file `<slug>.dispatch.md` nella directory corrente per `new` (rifiutando di sovrascriverlo e non scrivendo mai al di fuori della directory di lavoro). La verifica basata su modello descritta dalla metodologia (passaggio 4) viene eseguita dagli strumenti complementari, non da questo pacchetto. Vedere [SECURITY.md](SECURITY.md).

## Stato

Un protocollo funzionante, verificato esternamente dai propri meccanismi: una famiglia di modelli diversa controlla le sue citazioni (vedere la prova sopra). Questo repository è il riferimento pubblico; [PROTOCOL.md](PROTOCOL.md) è la forma eseguibile. Fa parte della famiglia [dogfood-lab](https://github.com/dogfood-lab): metodi e esempi per costruire nell'era dell'IA.

Con licenza MIT.

---

<p align="center"><sub>Part of the <a href="https://github.com/dogfood-lab">dogfood-lab</a> family — methods &amp; showcases for building in the AI era. Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.</sub></p>
