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

**Fondi le decisioni di progettazione su ricerche citate, quindi verifica le citazioni con un *modello* diverso prima che diventino parte integrante del progetto.**

`study-swarm` è un protocollo, non uno strumento. Quando si prende una decisione di progettazione importante con un LLM (un nuovo livello di prodotto, una scelta architettonica, una decisione del tipo "dovremmo fidarci del modello in questo caso"), improvvisare partendo da principi fondamentali porta a progetti obsoleti e citare articoli a memoria porta a progetti basati su fonti inesistenti o che non dicono ciò che si pensa. `study-swarm` sostituisce entrambi: invia agenti di ricerca in parallelo, richiede risultati specifici dalle fonti citate e sottopone ogni citazione a un **verificatore esterno di un modello diverso** prima che influenzi la progettazione.

Applica la propria "medicina". Il protocollo prevede l'utilizzo di verificatori per proteggere i sistemi che aiuta a progettare, quindi lo applica anche a se stesso. **Nessun modello valuta il proprio lavoro, incluso quello che esegue il protocollo.**

## Il protocollo in cinque passaggi

1. **Identificare** 3-5 domande di progettazione fondamentali, in cui prove empiriche cambierebbero la risposta.
2. **Inviare** un agente di ricerca per ogni domanda, in parallelo. Ognuno deve restituire titoli di articoli + autori + anni + URL + un risultato in una frase: dare priorità alla specificità rispetto all'ampiezza ("6-8 risultati ben documentati sono meglio di 20 affermazioni vaghe").
3. **Sintetizzare** i risultati in una sezione "Fondamento della ricerca": `N. **<risultato>.** <Autori> <anno> (<arXiv/DOI>). <implicazione per la progettazione>.`
4. **Verificare esternamente** — un *modello diverso*, senza ragionamento, controlla ogni citazione in due fasi: un **oracolo di recupero** conferma che l'articolo esiste (mai dalla memoria del modello), quindi una "lente di fondamento" conferma che il risultato corrisponde alla fonte. **Interrompere** in caso di fabbricazioni/attribuzioni errate; **interrompere e segnalare** se il verificatore o l'oracolo di recupero non sono disponibili (non interpretare mai l'assenza come "le citazioni sono corrette").
5. **Collegare** ogni scelta architettonica a un risultato specifico tramite numero. Le citazioni senza un'implicazione per la progettazione sono rumore.

I dettagli completi e eseguibili (la tabella di interruzione, lo standard di riferimento, la regola di insieme) sono disponibili in **[PROTOCOL.md](PROTOCOL.md)**.

## Perché un *modello diverso*, senza ragionamento?

Perché le modalità di errore sono documentate, non ipotetiche:

- **Gli LLM non possono verificare in modo affidabile i propri risultati.** Huang et al. 2023 ([arXiv:2310.01798](https://arxiv.org/abs/2310.01798)); Kambhampati et al. 2024 ([arXiv:2402.01817](https://arxiv.org/abs/2402.01817), LLM-Modulo); Stechly et al. 2024 ([arXiv:2402.08115](https://arxiv.org/abs/2402.08115)) — il verificatore esterno offre i vantaggi; il contenuto di autocritica è inerte.
- **I giudici della stessa famiglia tendono ad auto-preferirsi.** Panickssery, Bowman & Feng 2024 ([arXiv:2404.13076](https://arxiv.org/abs/2404.13076)) — l'auto-riconoscimento è correlato *linearmente* con l'auto-preferenza, quindi un'occlusione parziale non aiuta. Verga et al. 2024 ([arXiv:2404.18796](https://arxiv.org/abs/2404.18796), PoLL) — un gruppo di esperti provenienti da famiglie diverse è meno influenzato a un costo inferiore di circa 7 volte.
- **Le citazioni sono il punto in cui gli LLM mentono.** Walters & Wilder 2023 ([doi:10.1038/s41598-023-41032-5](https://doi.org/10.1038/s41598-023-41032-5)) — il 55% delle citazioni di GPT-3.5 / il 18% di GPT-4 sono fabbricate. Onweller et al. 2026 ([arXiv:2605.06635](https://arxiv.org/abs/2605.06635)) — i collegamenti risolvono il >94% delle volte, ma solo il 39-77% del contenuto citato supporta effettivamente l'affermazione. Pertanto, l'esistenza deve essere verificata tramite **recupero, non richiamo**.
- **Nascondere il ragionamento del generatore.** Khalifa et al. 2026 ([arXiv:2601.14691](https://arxiv.org/abs/2601.14691), "Gaming the Judge") — la sola manipolazione della catena di pensiero aumenta i falsi positivi di un giudice fino al 90% con azioni mantenute fisse. Turpin et al. 2023 ([arXiv:2305.04388](https://arxiv.org/abs/2305.04388)) — la catena di pensiero è una razionalizzazione post-hoc. Il verificatore vede solo la citazione, mai il "perché l'ho inclusa".
- **La diversità è più importante della quantità.** Rajan 2025 ([arXiv:2511.16708](https://arxiv.org/abs/2511.16708)) — quattro verificatori con correlazione a coppie ρ ∈ [0.05, 0.25] superano qualsiasi singolo verificatore tramite copertura submodulare. Kim et al. 2025 ([arXiv:2506.07962](https://arxiv.org/abs/2506.07962)) — gli errori degli LLM sono *correlati*, quindi la variabile più importante è la diversità delle "lenti", non la quantità.

## Funziona davvero? (prova)

Come test, il protocollo è stato eseguito sulle proprie citazioni. Due famiglie non correlate di Claude — **Mistral** (`mistral-small:24b`) e **IBM Granite** (`granite4.1:30b`) — hanno controllato un insieme di citazioni, senza ragionamento, con due "trappole" nascoste:

| Trappola preparata | Mistral | IBM Granite | Verità |
|---|---|---|---|
| Il ragionamento della catena di pensiero è attribuito a "Nakamura & Olsen" | mancato | **rilevato** (attribuzione errata → in realtà Wei et al. 2022) | attribuzione errata |
| un articolo fabbricato con la dicitura "98% degli errori eliminati, non è necessario alcun oracolo" | **caught** (fabricated) | **caught** (fabricated) | fabbricato |

Nessuna delle due famiglie ha rilevato entrambe le trappole da sola, ma la loro **unione ha rilevato 2/2**. Un singolo giudice avrebbe accettato l'attribuzione errata. Separatamente, l'oracolo di recupero ha rilevato due *vere* attribuzioni errate nei nostri documenti di progettazione (articoli citati con il primo autore sbagliato) che nessun LLM parametrico avrebbe potuto segnalare, e ha confermato correttamente gli articoli genuini del 2026 che entrambi gli LLM hanno erroneamente segnalato come fabbricati semplicemente perché gli articoli sono successivi alla loro data di addestramento. Quest'ultimo punto è la ragione principale per cui il controllo dell'esistenza nel passaggio 4 **deve** essere un oracolo di recupero, mai un LLM.

Questa singola esecuzione è la tesi in miniatura: **"lenti" non correlate + un oracolo di recupero per l'esistenza superano qualsiasi singolo giudice esperto.**

## Come è strutturato

È possibile eseguire il protocollo manualmente: qualsiasi modello di famiglia diversa più la risoluzione di arXiv/DOI da parte dell'utente soddisfa il passaggio 4. Due strumenti complementari lo rendono un unico comando:

- **[prism-verify](https://github.com/mcp-tool-shop-org/prism-verify)** — il verificatore in fase di esecuzione: instradamento differenziato per famiglia, ragionamento semplificato, arbitraggio multi-lente, un limite inferiore deterministico per il recupero dell'esistenza (arXiv → Crossref) e ricevute firmate.
- **[role-os](https://github.com/mcp-tool-shop-org/role-os)** — fornisce `roleos verify-citations <dispatch>`, lo strumento che estrae le citazioni di un documento e le elabora tramite prism.

## CLI

```bash
npm i -g @dogfood-lab/study-swarm     # or run ad-hoc: npx @dogfood-lab/study-swarm <command>
```

| Comando | Funzione |
|---|---|
| `study-swarm protocol` | Stampa l’intero protocollo: le cinque fasi, la tabella di controllo e lo standard di riferimento. |
| `study-swarm new <slug>` | Crea un file `<slug>.dispatch.md` con la struttura delle cinque fasi, da completare. |
| `study-swarm lint <file>` | Verifica la sezione *Base di ricerca* di un documento rispetto allo standard di riferimento: ogni dato deve avere un autore, un anno e un identificatore univoco (arXiv / DOI / URL); le affermazioni generiche del tipo "gli studi dimostrano..." non sono accettate. In caso di violazioni, il comando termina con codice di uscita `1`, bloccando quindi il processo di CI. |

`lint` è deterministico (non effettua chiamate al modello), quindi è sicuro da utilizzare in CI. Applica localmente lo **standard di riferimento della fase 3**; la verifica basata sul modello della **fase 4** viene comunque eseguita tramite [`roleos verify-citations`](https://github.com/mcp-tool-shop-org/role-os) → prism.

## In sintesi, perché funziona

**Efficienza** — il settore è in rapida evoluzione; richiedere studi specifici e approfonditi rallenta lo sviluppo dei progetti di 18 mesi. **Funzionalità** — i dati mostrano cosa *non* funziona, non solo cosa funziona (le spiegazioni possono portare a un'eccessiva dipendenza da un'IA *errata* — Bansal et al. 2021). **Sicurezza** — l'ambiente protetto dal verificatore è l'architettura supportata dai dati, e il protocollo la applica ai propri risultati. La verifica non è un esercizio accademico; è la traccia dei dati.

## Sicurezza

`study-swarm` è un repository di documentazione: contiene file Markdown e un logo. Non include codice eseguibile e non installa nulla da questo repository. Non accede a dati, non richiede autorizzazioni e non raccoglie dati di telemetria; non ci sono segreti o credenziali nel codice sorgente. La metodologia *descrive* un flusso di lavoro che utilizza il recupero di informazioni dal web e la verifica basata su modelli, ma questo repository non lo implementa né lo esegue. Consultare [SECURITY.md](SECURITY.md).

## Stato

Un protocollo funzionante, verificato esternamente dai propri strumenti: una famiglia di modelli diversa verifica le sue citazioni (vedere la prova sopra). Questo repository è il riferimento pubblico; [PROTOCOL.md](PROTOCOL.md) è la forma eseguibile. Parte della famiglia [dogfood-lab](https://github.com/dogfood-lab): metodi e esempi per lo sviluppo nell'era dell'IA.

Licenza MIT.

---

<p align="center"><sub>Part of the <a href="https://github.com/dogfood-lab">dogfood-lab</a> family — methods &amp; showcases for building in the AI era. Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.</sub></p>
