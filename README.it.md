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

**Fondi le decisioni progettuali su ricerche citate — quindi verifica le citazioni con un *modello* diverso prima che diventino parte integrante del progetto.**

`study-swarm` è un protocollo, non uno strumento. Quando si prende una decisione progettuale importante con un LLM (un nuovo livello di prodotto, una scelta architettonica, una valutazione sul fatto se fidarsi o meno del modello), improvvisare partendo da principi generali porta a progetti obsoleti e citare articoli a memoria porta a progetti basati su fonti inesistenti o che non dicono ciò che si pensa. `study-swarm` sostituisce entrambi: attiva agenti di ricerca paralleli, richiede risultati specifici dalle ricerche citate e sottopone ogni citazione a un **verificatore esterno appartenente a una famiglia di modelli diversa** prima che influenzi il progetto.

Applica la propria "medicina". Il protocollo prevede l'utilizzo di verificatori per proteggere le informazioni contenute nei sistemi che aiuta a progettare, quindi lo applica anche a se stesso. **Nessun modello valuta il proprio lavoro, incluso quello che esegue il protocollo.**

## Il protocollo in cinque passaggi:

1. **Identificare** 3-5 domande progettuali fondamentali su cui le prove empiriche potrebbero cambiare la risposta.
2. **Attivare** un agente di ricerca per ogni domanda, in parallelo. Ognuno deve restituire titoli degli articoli + autori + anni + URL + una breve sintesi (una frase) — dare priorità alla specificità rispetto all'ampiezza ("6-8 risultati ben documentati sono meglio di 20 affermazioni vaghe").
3. **Sintetizzare** i risultati in una sezione "Fondamento della ricerca": `N. **<risultato>.** <Autori> <anno> (<arXiv/DOI>). <implicazione progettuale>.`
4. **Verificare esternamente** — una *famiglia di modelli diversa*, priva di capacità di ragionamento, controlla ogni citazione in due fasi: un **oracolo di recupero** conferma che l'articolo esiste (non si basa mai sulla memoria del modello), quindi una "lente di fondatezza" verifica che il risultato corrisponda alla fonte. **Interrompere** se la citazione è fabbricata o attribuita in modo errato; **interrompere e segnalare** se il verificatore o l'oracolo di recupero non sono disponibili (non interpretare mai l'assenza come "le citazioni sono corrette").
5. **Collegare** ogni scelta architettonica a un risultato specifico, tramite numero. Le citazioni prive di implicazioni progettuali sono rumore.

I dettagli completi e eseguibili — la tabella di interruzione, lo standard per le fonti, la regola dell'insieme — si trovano in **[PROTOCOL.md](PROTOCOL.md)**.

## Perché una *famiglia diversa*, priva di capacità di ragionamento?

Perché i modi di errore sono documentati, non ipotetici:

- **Gli LLM non possono verificare in modo affidabile i propri risultati.** Huang et al. 2023 ([arXiv:2310.01798](https://arxiv.org/abs/2310.01798)); Kambhampati et al. 2024 ([arXiv:2402.01817](https://arxiv.org/abs/2402.01817), LLM-Modulo); Stechly et al. 2024 ([arXiv:2402.08115](https://arxiv.org/abs/2402.08115)) — il verificatore esterno offre i vantaggi; l'autovalutazione è inerte.
- **I giudici della stessa famiglia tendono a favorire se stessi.** Panickssery, Bowman & Feng 2024 ([arXiv:2404.13076](https://arxiv.org/abs/2404.13076)) — l'autoriconoscimento è correlato *linearmente* all'autopreferenza, quindi un'occlusione parziale non aiuta. Verga et al. 2024 ([arXiv:2404.18796](https://arxiv.org/abs/2404.18796), PoLL) — un gruppo di esperti provenienti da famiglie diverse è meno influenzato, con un costo inferiore di circa il 7%.
- **Le citazioni sono dove gli LLM mentono.** Walters & Wilder 2023 ([doi:10.1038/s41598-023-41032-5](https://doi.org/10.1038/s41598-023-41032-5)) — il 55% delle citazioni di GPT-3.5 / il 18% di GPT-4 sono fabbricate. Onweller et al. 2026 ([arXiv:2605.06635](https://arxiv.org/abs/2605.06635)) — i collegamenti risolvono oltre il 94% delle volte, ma solo il 39-77% del contenuto citato supporta effettivamente l'affermazione. Pertanto, l'esistenza deve essere verificata tramite **recupero, non richiamo**.
- **Nascondere il ragionamento del generatore.** Khalifa et al. 2026 ([arXiv:2601.14691](https://arxiv.org/abs/2601.14691), "Gaming the Judge") — la sola manipolazione della catena di pensiero aumenta i falsi positivi del giudice fino al 90%, mantenendo le azioni fisse. Turpin et al. 2023 ([arXiv:2305.04388](https://arxiv.org/abs/2305.04388)) — la catena di pensiero è una razionalizzazione post-hoc. Il verificatore vede solo l'affermazione della citazione, mai il "perché ho incluso questo".
- **La diversità supera la quantità.** Rajan 2025 ([arXiv:2511.16708](https://arxiv.org/abs/2511.16708)) — quattro verificatori con una correlazione a coppie ρ ∈ [0,05, 0,25] superano qualsiasi singolo verificatore tramite copertura submodulare. Kim et al. 2025 ([arXiv:2506.07962](https://arxiv.org/abs/2506.07962)) — gli errori degli LLM sono *correlati*, quindi la variabile più importante è la diversità delle "lenti", non la quantità assoluta.

## Funziona davvero? (prova)

Come test, il protocollo è stato applicato alle proprie citazioni. Due famiglie diverse da Claude e non correlate — **Mistral** (`mistral-small:24b`) e **IBM Granite** (`granite4.1:30b`) — hanno controllato un insieme di citazioni, senza capacità di ragionamento, con due "trappole" nascoste:

| Trappola piazzata | Mistral | IBM Granite | Verità oggettiva |
|---|---|---|---|
| Il ragionamento della catena di pensiero è attribuito a "Nakamura & Olsen" | mancato | **rilevato** (attribuito in modo errato → in realtà Wei et al. 2022, arXiv:2201.11903) | attribuito in modo errato |
| un articolo fabbricato con la frase "il 98% degli errori è stato eliminato, non è necessario alcun oracolo" | **caught** (fabricated) | **caught** (fabricated) | fabbricato |

Nessuna delle due famiglie ha rilevato entrambe le trappole da sola, ma la loro **unione ha rilevato 2/2**. Un singolo giudice avrebbe accettato l'attribuzione errata. Separatamente, l'oracolo di recupero ha individuato due *vere* attribuzioni errate nei nostri documenti progettuali (articoli citati con il primo autore sbagliato) che nessun LLM parametrico avrebbe potuto segnalare — e ha confermato correttamente articoli genuini del 2026 che entrambi gli LLM hanno erroneamente contrassegnato come fabbricati semplicemente perché gli articoli sono successivi alla loro data di addestramento. Quest'ultimo punto è la ragione principale per cui il controllo dell'esistenza nel passaggio 4 **deve** essere effettuato tramite un oracolo di recupero, e non tramite un LLM.

Questa singola esecuzione rappresenta la tesi in miniatura: **"lenti" correlate + un oracolo di recupero per l'esistenza superano qualsiasi singolo giudice esperto.**

### ...e ancora, per progettare la versione 1.1

Le modifiche della versione 1.1 sono state scelte nello stesso modo: eseguendo `study-swarm` su `study-swarm`. Quattro domande a cui la prima versione lasciava spazio per un "a mio parere" (come *meccanizzare* il controllo di fondatezza, se effettuare la verifica al momento della generazione, come *combinare* le diverse prospettive, se astenersi in caso di incertezza calibrata) sono state indirizzate ad agenti di ricerca paralleli e tutte le **27 citazioni risultanti** sono state verificate tramite il passaggio 4 prima che qualsiasi elemento influenzasse la progettazione. L'oracolo di recupero ha confermato l'esistenza di **tutte le 27 citazioni**, incluse sei pubblicazioni del 2025-2026 che un modello parametrico avrebbe erroneamente classificato come fabbricate, e ha corretto cinque attribuzioni che un modello non sarebbe stato in grado di fare, tra cui una reale errata attribuzione dell'autore principale individuata dall'agente di ricerca. Eseguendo l'analisi senza ragionamento deduttivo, le diverse prospettive hanno persino riprodotto i propri noti punti deboli nel nostro sistema: un elemento ha identificato erroneamente una pubblicazione reale e la loro *discrepanza* ha innescato un'escalation, esattamente come previsto. Il sistema funzionante viene fornito come [`examples/study-swarm-v1_1.dispatch.md`](examples/study-swarm-v1_1.dispatch.md); le modifiche che sono state apportate (fondatezza scomposta/ternaria, verifica al momento della generazione, cascata controllata dall'oracolo e astensione calibrata) sono disponibili in [PROTOCOL.md](PROTOCOL.md).

## Come è strutturato

È possibile eseguire il protocollo manualmente: qualsiasi modello di famiglia diversa, purché si risolvano autonomamente le informazioni da arXiv/DOI, soddisfa il passaggio 4. Due strumenti complementari lo rendono un unico comando:

- **[prism-verify](https://github.com/mcp-tool-shop-org/prism-verify)**: il verificatore in fase di esecuzione: instradamento per famiglie diverse, analisi senza ragionamento deduttivo, arbitraggio multi-prospettiva, un limite deterministico per l'esistenza dei risultati (arXiv → Crossref) e ricevute firmate.
- **[role-os](https://github.com/mcp-tool-shop-org/role-os)**: fornisce `roleos verify-citations <dispatch>`, lo strumento che estrae le citazioni da un sistema e le verifica tramite prism.

Il passaggio di consegne è il formato del sistema stesso: un risultato scritto come `N. **risultato.** Autori anno (arXiv|DOI). implicazione.` — con **un identificatore risolvibile per ogni risultato** — è esattamente ciò che `roleos verify-citations` estrae e verifica. Un sistema "pulito" secondo i criteri di linting passa senza problemi; una citazione malformata è ciò che lo strumento segnala come non analizzata. Questo contratto è ciò che `study-swarm lint` controlla a livello locale, in modo che il passaggio 3 e il passaggio 4 concordino su cosa sia una citazione.

## Interfaccia a riga di comando (CLI)

```bash
npm i -g @dogfood-lab/study-swarm     # or run ad-hoc: npx @dogfood-lab/study-swarm <command>
```

| Comando | Cosa fa |
|---|---|
| `study-swarm protocol` | Stampa l'intero protocollo: i cinque passaggi, la tabella di arresto e lo standard di riferimento. |
| `study-swarm new <slug>` | Crea uno scheletro `<slug>.dispatch.md` con i cinque passaggi da completare. |
| `study-swarm lint [--json] [--strict] <path…>` | Verifica l'attendibilità delle *fonti* di un documento rispetto agli standard di riferimento: ogni affermazione deve avere un autore, un anno e un identificatore univoco (arXiv / DOI / URL / RFC); le affermazioni generiche del tipo "gli studi dimostrano..." non sono accettate. In caso di violazioni, il processo termina con codice `1`, interrompendo così l'esecuzione continua (CI). Un `<path>` può essere un file, una directory (analizzata ricorsivamente per i file `*.dispatch.md`) o `-` per l'input standard; `--json` genera un report leggibile da macchina. L'opzione `--strict` contrassegna inoltre le **citazioni orfane** (un'affermazione che non è citata in nessuno dei passaggi), poiché "le citazioni senza una connessione sono irrilevanti" (questa opzione è facoltativa, quindi l'impostazione predefinita per il processo CI rimane invariata). |
| `study-swarm lock --init <dispatch>` | Crea il file `<dispatch>.orchestration.json`: un modello di configurazione da completare con i dati necessari (un passaggio per ogni agente del Passo 2) e che verrà utilizzato con il comando `lock … --from`. |
| `study-swarm lock <dispatch> --from <orchestration.json>` | Blocca un sistema per la riproduzione: scrive il contenuto di `<dispatch>.lock.json`, che, per ogni agente del passaggio 2, include l'**ID del modello risolto**, l'**SHA-256 del prompt esatto in byte** e l'**SHA-256 dello schema dello strumento**, oltre alla **ricevuta del verificatore** del passaggio 4, tutto racchiuso in un unico `lock_sha256`. |
| `study-swarm lock --verify <dispatch> [--from …]` | Ricalcola questi hash e verifica che corrispondano al blocco; qualsiasi discrepanza fa terminare il programma con codice `1`, in modo da bloccare l'integrazione continua (CI) come farebbe un file di blocco dei pacchetti. Senza `--from`, controlla l'integrità del blocco stesso. |
| `study-swarm withdraw <id> --reason <reason> [--from <dir>] [--receipt <path>]` | **Meccanismo di compensazione per il rollback.** Contrassegna ogni documento nel corpus in cui l'*attendibilità delle fonti* cita `<id>` come `evidence-withdrawn` (un file "tombstone" aggiuntivo `<slug>.withdrawn.json": contrassegna, ma non elimina) e genera una ricevuta di rimozione basata sul contenuto. `--reason` ∈ `fabricated · misattributed · retracted · verifier-flipped · other`. |
| `study-swarm requalify --check <corpus-dir>` | In caso di errori, il processo termina con codice `1` per qualsiasi documento che contenga un flag `evidence-withdrawn` non risolto: questo è l'indicatore (andon) che **interrompe** i processi dipendenti da un'affermazione rimossa fino a quando questa non viene eliminata o rielaborata. Interrompe il processo CI. |
| `study-swarm requalify --status <corpus-dir> [--json]` | Visualizza in sola lettura lo stato di attendibilità delle fonti del corpus: numero di documenti rimossi rispetto a quelli risolti, suddivisione per motivo e modalità di risoluzione, informazioni per ogni documento. Informazioni generali (il processo termina con codice `0`), a differenza dell'opzione `--check`. |
| `study-swarm requalify --resolve <dispatch> <id> --mode removed\ | regrounded [--note …]` | Rimuove il flag una volta che l'affermazione è stata eliminata (la citazione non esiste più) o rielaborata (verificata nuovamente dal processo parallelo; `--note` registra la conferma). L'operazione può essere eseguita più volte; aggiunge informazioni al registro di controllo del file aggiuntivo. |

`lint` è deterministico: non effettua chiamate al modello, quindi è sicuro da utilizzare nell'integrazione continua (CI). Applica **lo standard di riferimento del passaggio 3** a livello locale; la verifica basata sul modello del **passaggio 4** si basa ancora su [`roleos verify-citations`](https://github.com/mcp-tool-shop-org/role-os) → prism.

Un ciclo tipico:

```bash
study-swarm new my-decision                      # creates my-decision.dispatch.md
# …fill in the questions, run the research dispatch, write the findings…
study-swarm lint my-decision.dispatch.md         # enforce the sourcing standard (Step 3)
roleos verify-citations my-decision.dispatch.md  # model-based Step 4 (different family, via prism)
```

Quattro documenti completi e validati vengono utilizzati come riferimento: [`examples/study-swarm-self.dispatch.md`](examples/study-swarm-self.dispatch.md) (la decisione centrale del protocollo, in forma compatta), [`examples/study-swarm-v1_1.dispatch.md`](examples/study-swarm-v1_1.dispatch.md) (l'implementazione completa della versione 1.1: 27 citazioni, tutte verificate esternamente), [`examples/study-swarm-lock.dispatch.md`](examples/study-swarm-lock.dispatch.md) (il design della versione 1.2 con il meccanismo di blocco: 39 citazioni, gestite tramite il processo parallelo, ed è il primo documento a includere il proprio meccanismo di blocco) e [`examples/study-swarm-canon-rollback.dispatch.md`](examples/study-swarm-canon-rollback.dispatch.md) (il design della versione 1.3 con il meccanismo di rollback: 27 citazioni relative alla revoca, al ritiro, alle sequenze di eventi e all'invalidazione della build, ed è il primo documento ad essere rimosso e poi riqualificato).

### Bloccalo nell'integrazione continua (CI)

`lint` accetta un file, una directory (analizzata ricorsivamente per i file `*.dispatch.md`) o `-` per l'input standard e `--json` emette un report leggibile dalla macchina. Aggiungi questo al tuo repository per verificare la fondatezza di ogni sistema in ogni richiesta pull (un esempio di copia-incolla è disponibile anche in [`examples/study-swarm-ci.yml`](examples/study-swarm-ci.yml)):

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

### Blocca un sistema per la riproduzione (`dispatch.lock.json`)

Un sistema fondato e verificato è auditabile solo se si può dire *cosa lo ha prodotto*. `study-swarm lock` scrive un file di blocco complementare che, per ogni agente di ricerca, include l'**ID del modello risolto** (mai un alias fluttuante), l'**SHA-256 del prompt esatto in byte** e l'**SHA-256 dello schema dello strumento** fornito, oltre alla **ricevuta del verificatore esterno**, tutto racchiuso in un unico `lock_sha256`. `study-swarm lock --verify` ricalcola questi hash e fallisce se rileva discrepanze, quindi una modifica al prompt, uno scambio di modello o una variazione della superficie dello strumento vengono rilevati: lo standard di riproducibilità [PIN_PER_STEP](https://github.com/dogfood-lab/study-swarm), reso eseguibile. Il sistema emette il record; l'interfaccia a riga di comando rimane senza dipendenze e indipendente dalla rete, limitandosi alla normalizzazione (RFC 8785), all'hashing e alla convalida.

**Blocca gli input, non gli output.** Bloccare il modello + prompt + temperatura *non* rende l'output di un LLM identico bit per bit: l'invarianza del batch, la non associatività dei numeri in virgola mobile, il routing a esperti multipli e la deriva silenziosa del provider sono tutti elementi al di fuori del controllo di uno strumento offline. Pertanto, il blocco fornisce **input riproducibili e output con rilevamento della deriva**, mai una "riproduzione deterministica". Il progetto è basato su evidenze, citazione per citazione, in [`examples/study-swarm-lock.dispatch.md`](examples/study-swarm-lock.dispatch.md) — la prima implementazione che include il proprio blocco ([`examples/study-swarm-lock.lock.json`](examples/study-swarm-lock.lock.json)).

### Esegue il rollback di un'affermazione rimossa (`withdraw` / `requalify`)

Un'affermazione verificata diventa **canonica**: fornisce informazioni per una decisione successiva. Quindi, cosa succede quando viene successivamente **rimossa** (una citazione si rivela falsa/errata durante una nuova esecuzione, un articolo citato viene ritirato o il meccanismo di controllo la contrassegna)? Un comando `git revert` non è sufficiente, perché l'affermazione è già stata propagata. Il meccanismo di compensazione per il rollback rende possibile questa operazione:

```bash
study-swarm withdraw arXiv:2402.15089 --reason misattributed --from dispatches/ --receipt rollback.json
#   → flags every dispatch citing it `evidence-withdrawn` (a tombstone sidecar — flag, never delete)
#     and writes a content-addressed withdrawal receipt naming every dependent.
study-swarm requalify --check dispatches/          # exit 1 while any flag is unresolved — the andon HALT
study-swarm requalify --resolve d.dispatch.md arXiv:2402.15089 --mode removed   # or: --mode regrounded --note "<attestation>"
```

`requalify --check` **termina con errore** finché ogni affermazione contrassegnata non viene rimossa o **rielaborata** (verificata nuovamente dal processo parallelo; la CLI registra la conferma, ma non esegue essa stessa la verifica). La rimozione viene evidenziata in modo **contraddittorio**, e non semplicemente eliminando l'elemento. Tutto (il file "tombstone" e la ricevuta) è basato sul contenuto ed è rilevabile nel tempo, e opera solo sullo strato delle *fonti*: `lock --verify` non viene influenzato dalla rimozione. Il design si basa su [`examples/study-swarm-canon-rollback.dispatch.md`](examples/study-swarm-canon-rollback.dispatch.md), e il documento [PROTOCOL.md](PROTOCOL.md) §"Compensating a withdrawn finding" rappresenta l'implementazione pratica. Questo è lo standard **NAMED_COMPENSATORS** reso eseguibile: un meccanismo di annullamento denominato e idempotente che lascia uno stato finale noto e una ricevuta.

## Perché funziona, in sintesi:

**Attuale:** il settore è in rapida evoluzione; richiedere studi specifici che durino anni impedisce di rilasciare i progetti con 18 mesi di ritardo. **Funzionale:** le evidenze mostrano cosa *fallisce*, non solo cosa funziona (le spiegazioni possono aumentare l'eccessiva dipendenza da un'IA *errata* — Bansal et al. 2021, [arXiv:2006.14779](https://arxiv.org/abs/2006.14779)). **Sicuro:** l'ambito protetto dal verificatore è l'architettura supportata dalle evidenze e il protocollo la applica ai propri output. L'analisi delle fonti non è un esercizio accademico; è la traccia delle evidenze.

## Sicurezza

`study-swarm` include una **CLI leggera, senza dipendenze** (`study-swarm`) insieme alla metodologia. Non effettua **nessuna chiamata di rete o al modello** e non raccoglie **dati di telemetria**; non ci sono segreti o credenziali nel codice sorgente. In fase di esecuzione legge solo il file che si passa a `lint` e scrive un singolo file `<slug>.dispatch.md` nella directory corrente per `new` (rifiutando di sovrascriverlo e operando sempre all'interno della directory di lavoro). La verifica basata sul modello descritta dalla metodologia (Passaggio 4) viene eseguita dagli strumenti correlati, non da questo pacchetto. Vedere [SECURITY.md](SECURITY.md).

## Stato

Un protocollo funzionante, verificato esternamente dai suoi stessi strumenti: una famiglia diversa di modelli verifica le sue citazioni (vedi la prova sopra). La **versione 1.1** migliora il meccanismo di verifica rispetto alla prima versione, che era silenziosa: attendibilità delle fonti decomposta/ternaria, verifica al momento della generazione, una cascata controllata da un oracolo per combinare le diverse prospettive e astensione calibrata: ogni elemento è basato sull'affermazione verificata nella versione 1.1. La **versione 1.2** rende un documento riproducibile: `study-swarm lock` memorizza il modello, il prompt e lo schema degli strumenti risolti per ogni passaggio, oltre alla ricevuta del meccanismo di verifica, e `lock --verify` termina con errore in caso di modifiche non autorizzate. La **versione 1.3** rende eseguibile il rollback: quando un'affermazione che è già diventata canonica viene rimossa, `study-swarm withdraw` contrassegna tutti gli elementi dipendenti e `requalify --check` li interrompe, terminando con errore finché non vengono rimossi o rielaborati: un meccanismo di compensazione denominato, dotato di ricevuta e idempotente. La **versione 2.0** rende più parti del protocollo eseguibili e rafforza il meccanismo di blocco: `lint --strict` contrassegna le citazioni orfane (l'unico tipo di errore che la CLI non riusciva a rilevare), `lock --init` crea il modello di configurazione, `requalify --status` legge lo stato delle fonti del corpus e l'indirizzamento basato sul contenuto del blocco è separato per dominio (schema degli artefatti versione 2: un blocco da una versione precedente viene rigenerato anziché essere contrassegnato erroneamente come manomesso; la superficie dei comandi della CLI rimane compatibile con le versioni precedenti). Questo repository è il riferimento pubblico; [PROTOCOL.md](PROTOCOL.md) rappresenta l'implementazione pratica. Fa parte della famiglia [dogfood-lab](https://github.com/dogfood-lab): metodi e esempi per lo sviluppo nell'era dell'intelligenza artificiale.

Con licenza MIT.

---

<p align="center"><sub>Part of the <a href="https://github.com/dogfood-lab">dogfood-lab</a> family — methods &amp; showcases for building in the AI era. Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.</sub></p>
