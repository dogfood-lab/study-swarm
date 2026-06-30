<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

**Ancrez les décisions de conception dans des recherches citées, puis vérifiez ces citations à l’aide d’une *autre* famille de modèles avant que quoi que ce soit ne devienne un élément canonique.**

`study-swarm` est un protocole, pas un outil. Lorsque vous prenez une décision de conception importante avec un LLM (un nouveau niveau de produit, un choix d’architecture, une question du type « devons-nous faire confiance au modèle ici »), improviser à partir de principes fondamentaux conduit à des conceptions obsolètes, et citer des articles de mémoire conduit à des conceptions qui reposent sur des sources inexistantes ou qui ne disent pas ce que vous pensez. `study-swarm` remplace les deux : déployez des agents de recherche parallèles, exigez des résultats spécifiques cités et soumettez chaque citation à un **vérificateur externe d’une famille de modèles différente** avant qu’elle n’influence la conception.

Il applique sa propre méthode. Le protocole prescrit l’utilisation d’enveloppes protégées par un vérificateur pour les systèmes dont il facilite la conception, il l’applique donc à lui-même. **Aucun modèle ne corrige ses propres devoirs, y compris celui qui exécute le protocole.**

## Le protocole en cinq étapes

1. **Identifiez** 3 à 5 questions de conception essentielles auxquelles des preuves empiriques permettraient de modifier la réponse.
2. **Déployez** un agent de recherche par question, en parallèle. Chacun doit renvoyer les titres d’articles + les auteurs + les années + les URL + une conclusion en une phrase (la spécificité prime sur l’étendue : « 6 à 8 conclusions bien étayées sont plus efficaces que 20 observations vagues »).
3. **Synthétisez** les conclusions dans une section intitulée *Justification par la recherche* : `N. <conclusion>. <Auteurs> <année> (<arXiv/DOI>). <implication pour la conception>.`
4. **Vérifiez de manière externe** — une *famille de modèles différente*, sans raisonnement, vérifie chaque citation en deux étapes : un **oracle de récupération** confirme que l’article existe (jamais la mémoire du modèle), puis une **lentille d’exactitude** confirme que la conclusion correspond à la source. **Arrêtez le processus** si la citation est fabriquée ou mal attribuée ; **arrêtez et escaladez** si le vérificateur ou l’oracle de récupération n’est pas disponible (ne considérez jamais l’absence comme signifiant que les citations sont correctes).
5. **Reliez** chaque choix architectural à une conclusion en utilisant un numéro. Les citations qui n’ont pas d’implication pour la conception sont du bruit.

Les détails complets et exécutables (le tableau d’arrêt, la norme de référencement, la règle d’ensemble) se trouvent dans **[PROTOCOL.md](PROTOCOL.md)**.

## Pourquoi une *famille différente*, sans raisonnement ?

Parce que les modes d’échec sont documentés, et non hypothétiques :

- **Les LLM ne peuvent pas vérifier de manière fiable leurs propres résultats.** Huang et al. 2023 ([arXiv:2310.01798](https://arxiv.org/abs/2310.01798)) ; Kambhampati et al. 2024 ([arXiv:2402.01817](https://arxiv.org/abs/2402.01817), LLM-Modulo) ; Stechly et al. 2024 ([arXiv:2402.08115](https://arxiv.org/abs/2402.08115)) — le vérificateur externe apporte les améliorations ; le contenu d’autocritique est inerte.
- **Les juges de la même famille ont une préférence pour eux-mêmes.** Panickssery, Bowman & Feng 2024 ([arXiv:2404.13076](https://arxiv.org/abs/2404.13076)) — l’auto-reconnaissance est corrélée *linéairement* avec la préférence pour soi-même, de sorte qu’un aveuglement partiel n’est pas utile. Verga et al. 2024 ([arXiv:2404.18796](https://arxiv.org/abs/2404.18796), PoLL) — un groupe de juges issus de familles différentes est moins biaisé, pour un coût environ 7 fois inférieur.
- **Les citations sont les points où les LLM mentent.** Walters & Wilder 2023 ([doi:10.1038/s41598-023-41032-5](https://doi.org/10.1038/s41598-023-41032-5)) — 55 % des citations de GPT-3.5 et 18 % des citations de GPT-4 sont fabriquées. Onweller et al. 2026 ([arXiv:2605.06635](https://arxiv.org/abs/2605.06635)) — les liens résolvent plus de 94 % du temps, mais seulement 39 à 77 % du contenu cité soutiennent réellement l’affirmation. Par conséquent, l’existence doit être vérifiée par **récupération, et non par rappel**.
- **Masquez le raisonnement du générateur.** Khalifa et al. 2026 ([arXiv:2601.14691](https://arxiv.org/abs/2601.14691), « Gaming the Judge ») — la manipulation de la chaîne de pensée seule augmente les faux positifs d’un juge jusqu’à 90 %, les actions étant maintenues fixes. Turpin et al. 2023 ([arXiv:2305.04388](https://arxiv.org/abs/2305.04388)) — la chaîne de pensée est une rationalisation a posteriori. Le vérificateur voit uniquement l’affirmation de citation, jamais le « pourquoi je l’ai incluse ».
- **La diversité surpasse la quantité.** Rajan 2025 ([arXiv:2511.16708](https://arxiv.org/abs/2511.16708)) — quatre vérificateurs avec une corrélation par paires ρ ∈ [0,05, 0,25] sont plus efficaces qu’un seul grâce à la couverture sous-modulaire. Kim et al. 2025 ([arXiv:2506.07962](https://arxiv.org/abs/2506.07962)) — les erreurs des LLM sont *corrélées*, de sorte que la variable essentielle est la diversité des lentilles, et non la quantité brute.

## Est-ce que cela fonctionne réellement ? (preuve)

À titre de test, le protocole a été appliqué à ses propres citations. Deux familles non-Claude décorrélées — **Mistral** (`mistral-small:24b`) et **IBM Granite** (`granite4.1:30b`) — ont vérifié un ensemble de citations, sans raisonnement, en y intégrant deux pièges aveugles :

| Piège implanté | Mistral | IBM Granite | Vérité terrain |
|---|---|---|---|
| Une chaîne de pensée attribuée à « Nakamura & Olsen » | non détecté | **détecté** (mal attribué → en réalité Wei et al. 2022, arXiv:2201.11903) | mal attribué |
| un article fabriqué affirmant que « 98 % des erreurs sont éliminées, aucun oracle n’est nécessaire » | **caught** (fabricated) | **caught** (fabricated) | fabriqué |

Aucune des deux familles n’a détecté les deux pièges individuellement, mais leur **union a permis de détecter 2/2**. Un seul juge aurait validé la mauvaise attribution. De plus, l’oracle de récupération a détecté deux *vrais* mauvaises attributions dans nos propres documents de conception (articles cités sous le mauvais premier auteur) que aucun LLM paramétrique n’aurait pu signaler — et il a correctement confirmé des articles authentiques de 2026 que les deux LLM ont faussement signalés comme étant fabriqués simplement parce que les articles sont postérieurs à leur date d’entraînement. Ce dernier point est la raison pour laquelle la vérification de l’existence dans l’étape 4 **doit** être effectuée par un oracle de récupération, et non par un LLM.

Cette seule expérience résume la thèse : **des lentilles décorrélées + un oracle de récupération pour vérifier l’existence sont plus efficaces qu’un seul juge intelligent.**

### …et encore une fois, pour concevoir la version 1.1

Les améliorations de la version 1.1 ont été choisies de la même manière : en exécutant « study-swarm » sur « study-swarm ». Quatre questions auxquelles la première version n’avait pas répondu (« Je pense que… ») (comment *automatiser* la vérification de la pertinence, faut-il effectuer cette vérification au moment de la génération, comment *combiner* les différentes sources d’information, faut-il s’abstenir en cas d’incertitude calibrée) ont été soumises à des agents de recherche parallèles, et les **27 références résultantes** ont été validées à l’étape 4 avant d’influencer la conception. L’oracle de récupération a confirmé que **27 sur 27 existent**, y compris six articles datant de 2025-2026 qu’un modèle paramétrique aurait faussement identifiés comme étant fabriqués, et il a corrigé cinq attributions qu’un modèle n’aurait pas pu faire, dont une véritable erreur d’attribution à un premier auteur que l’agent de recherche avait lui-même signalée. En exécutant le processus sans raisonnement préalable, les différentes sources d’information ont même reproduit leurs propres modes d’échec documentés dans notre analyse : l’une a identifié de manière erronée un article réel et leur *divergence* a déclenché une escalade, exactement comme le prévoit la séquence. L’analyse effectuée est fournie sous forme de [`examples/study-swarm-v1_1.dispatch.md`](examples/study-swarm-v1_1.dispatch.md) ; les améliorations qui ont été validées (pertinence décomposée/ternaire, validation au moment de la génération, séquence validée par l’oracle et abstention calibrée) sont disponibles dans [PROTOCOL.md](PROTOCOL.md).

## Comment cela fonctionne

Vous pouvez exécuter le protocole manuellement : tout modèle d’une famille différente, associé à la résolution de l’identifiant arXiv/DOI, suffit pour l’étape 4. Deux outils complémentaires permettent de ne réaliser qu’une seule opération :

- **[prism-verify](https://github.com/mcp-tool-shop-org/prism-verify)** : le vérificateur d’exécution ; il effectue un routage en fonction de la famille, supprime le raisonnement, utilise une adjudication multi-sources et établit un seuil minimal déterministe pour l’existence des références (arXiv → Crossref), et fournit des reçus signés.
- **[role-os](https://github.com/mcp-tool-shop-org/role-os)** : il fournit la commande `roleos verify-citations <dispatch>`, qui extrait les références d’une analyse et les valide à l’aide de prism.

Le transfert se fait par le biais du format de l’analyse : une conclusion rédigée sous la forme `N. **conclusion.** Auteurs année (arXiv|DOI). implication.` — avec **un identifiant résolvable par conclusion** — est exactement ce que `roleos verify-citations` extrait et valide. Une analyse propre, validée par « lint », se transfère sans problème ; une citation mal formée est ce que l’outil signale comme non analysée. Ce contrat est ce que `study-swarm lint` vérifie localement, de sorte que les étapes 3 et 4 s’accordent sur la définition d’une citation.

## Interface en ligne de commande (CLI)

```bash
npm i -g @dogfood-lab/study-swarm     # or run ad-hoc: npx @dogfood-lab/study-swarm <command>
```

| Commande | Fonctionnalité |
|---|---|
| `study-swarm protocol` | Affiche le protocole complet : les cinq étapes, la table d’arrêt et la norme de référencement. |
| `study-swarm new <slug>` | Crée un fichier `<slug>.dispatch.md` avec le squelette des cinq étapes à compléter. |
| `study-swarm lint [--json] <path…>` | Vérifie la *pertinence de la recherche* d’une analyse par rapport à la norme de référencement : chaque conclusion doit comporter un auteur, une année et un identifiant résolvable (arXiv / DOI / URL) ; les affirmations du type « des études montrent que… » ne sont pas acceptées. En cas de violation, le programme se termine avec le code `1`, ce qui permet de contrôler l’intégration continue (CI). Un `<path>` peut être un fichier, un répertoire (validé récursivement pour les fichiers `*.dispatch.md`) ou `-` pour l’entrée standard ; l’option `--json` génère un rapport lisible par machine. |
| `study-swarm lock <dispatch> --from <orchestration.json>` | Enregistre une analyse pour la relecture : écrit le contenu de `<dispatch>.lock.json`, qui, par agent, adresse le **modèle résolu** (jamais un alias flottant), le **SHA-256 de l’invite exacte**, et le **SHA-256 du schéma d’outil** qui lui a été fourni, ainsi que le **reçu du vérificateur** de l’étape 4, dans un seul `lock_sha256`. |
| `study-swarm lock --verify <dispatch> [--from …]` | Recalcule ces hachages et vérifie qu’ils correspondent à ceux enregistrés ; en cas d’écart, le programme se termine avec le code `1`, ce qui permet de contrôler l’intégration continue (CI), comme un fichier de verrouillage des dépendances. Sans l’option `--from`, il vérifie l’intégrité du propre fichier de verrouillage. |
| `study-swarm withdraw <id> --reason <reason> [--from <dir>] [--receipt <path>]` | **Mécanisme de compensation pour annulation.** Marquer chaque élément du corpus dont la *justification* cite `<id>` comme `preuve retirée` (un fichier d’annulation `<slug>.withdrawn.json` – à marquer, ne jamais supprimer) et générer un reçu d’annulation identifié par son contenu. `--reason` ∈ `fabriqué · mal attribué · rétracté · vérificateur inversé · autre`. |
| `study-swarm requalify --check <corpus-dir>` | En cas d’erreur, interrompre le processus (quitter avec le code `1`) pour tout élément portant un indicateur `preuve retirée` non résolu – cet indicateur est comme un signal d’alarme qui **arrête** les dépendances d’une conclusion annulée jusqu’à ce qu’elle soit supprimée ou réévaluée. Intégré à CI. |
| `study-swarm requalify --resolve <dispatch> <id> --mode removed\ | regrounded [--note …]` | Supprimer l’indicateur une fois que la conclusion est supprimée (la citation a disparu) ou réévaluée (revérifiée par le processus parallèle ; `--note` enregistre l’attestation). Idempotent ; ajoute des informations au journal d’audit du fichier. |

`lint` est déterministe : il n’effectue aucun appel au modèle, ce qui le rend sûr pour l’intégration continue (CI). Il applique localement la **norme de référencement de l’étape 3** ; la vérification basée sur un modèle à l’**étape 4** s’appuie toujours sur [`roleos verify-citations`](https://github.com/mcp-tool-shop-org/role-os) → prism.

Exemple de boucle typique :

```bash
study-swarm new my-decision                      # creates my-decision.dispatch.md
# …fill in the questions, run the research dispatch, write the findings…
study-swarm lint my-decision.dispatch.md         # enforce the sourcing standard (Step 3)
roleos verify-citations my-decision.dispatch.md  # model-based Step 4 (different family, via prism)
```

Quatre éléments complets et validés sont fournis en tant que références : [`examples/study-swarm-self.dispatch.md`](examples/study-swarm-self.dispatch.md) (la décision centrale du protocole, concise), [`examples/study-swarm-v1_1.dispatch.md`](examples/study-swarm-v1_1.dispatch.md) (l’ensemble complet de la version 1.1 – 27 citations, chacune vérifiée en externe), [`examples/study-swarm-lock.dispatch.md`](examples/study-swarm-lock.dispatch.md) (la conception du verrouillage de la version 1.2 – 39 citations, soumise au processus parallèle, et le premier élément à inclure son propre verrouillage), et [`examples/study-swarm-canon-rollback.dispatch.md`](examples/study-swarm-canon-rollback.dispatch.md) (la conception d’annulation de la version 1.3 – 27 citations relatives à la révocation, au retrait, aux séquences d’événements et à l’invalidation de la construction, et le premier élément à être annulé puis réévalué).

### Intégration dans l’intégration continue (CI)

`lint` prend un fichier, un répertoire (validé récursivement pour les fichiers `*.dispatch.md`) ou `-` pour l’entrée standard, et `--json` génère un rapport lisible par machine. Intégrez ceci dans votre dépôt afin de contrôler le référencement de chaque analyse à chaque demande d’extraction (un exemple que vous pouvez copier-coller est également disponible dans [`examples/study-swarm-ci.yml`](examples/study-swarm-ci.yml)) :

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

### Enregistre une analyse pour la relecture (`dispatch.lock.json`)

Une analyse validée et vérifiée n’est auditable que si vous pouvez indiquer *ce qui l’a produite*. `study-swarm lock` écrit un fichier de verrouillage associé qui, par agent de recherche, adresse le **modèle résolu** (jamais un alias flottant), le **SHA-256 de l’invite exacte**, et le **SHA-256 du schéma d’outil** qui lui a été fourni, ainsi que le **reçu du vérificateur externe** dans un seul `lock_sha256`. `study-swarm lock --verify` recalcule ces hachages et échoue si l’un d’eux diffère, de sorte qu’une invite modifiée, un modèle remplacé ou une surface d’outil décalée sont détectés : la norme de reproductibilité [PIN_PER_STEP](https://github.com/dogfood-lab/study-swarm), rendue exécutable. L’ensemble des outils émet le rapport ; l’interface en ligne de commande reste sans dépendance et sans connexion réseau, se contentant de normaliser (RFC 8785), de hacher et de valider les données.

**Il fixe les entrées, pas les sorties.** Le fait de fixer le modèle + l’invite + la température ne permet *pas* d’obtenir une sortie d’un LLM qui soit exactement identique à chaque fois — l’invariance par lots, la non-associativité des nombres à virgule flottante, le routage du mélange d’experts et la dérive silencieuse du fournisseur sont autant de facteurs qui échappent au contrôle d’un outil hors ligne. Ainsi, le verrouillage vous donne des **entrées reproductibles et des sorties dont la dérive peut être détectée**, mais jamais une « reproduction déterministe ». La conception est basée sur des données probantes, citation par citation, dans [`examples/study-swarm-lock.dispatch.md`](examples/study-swarm-lock.dispatch.md) — le premier outil à intégrer son propre verrouillage ([`examples/study-swarm-lock.lock.json`](examples/study-swarm-lock.lock.json)).

### Annuler une conclusion retirée (`withdraw` / `requalify`)

Une conclusion vérifiée devient **canonique** – elle influence une décision ultérieure. Alors, que se passe-t-il lorsqu’elle est ensuite **retirée** (une citation s’avère être fabriquée ou mal attribuée lors d’une nouvelle exécution, un article cité est rétracté, ou le processus de validation l’invalide) ? Un `git revert` ne suffit pas, car la conclusion a déjà été diffusée. Le mécanisme de compensation pour annulation rend possible cette opération :

```bash
study-swarm withdraw arXiv:2402.15089 --reason misattributed --from dispatches/ --receipt rollback.json
#   → flags every dispatch citing it `evidence-withdrawn` (a tombstone sidecar — flag, never delete)
#     and writes a content-addressed withdrawal receipt naming every dependent.
study-swarm requalify --check dispatches/          # exit 1 while any flag is unresolved — the andon HALT
study-swarm requalify --resolve d.dispatch.md arXiv:2402.15089 --mode removed   # or: --mode regrounded --note "<attestation>"
```

`requalify --check` **échoue** jusqu’à ce que chaque conclusion marquée soit supprimée ou **réévaluée** (revérifiée par le processus parallèle – l’interface en ligne de commande enregistre l’attestation, mais ne la revérifie pas elle-même). Le retrait est mis en évidence de manière **contrastive**, et non silencieuse. Tout – le fichier d’annulation et le reçu – est identifié par son contenu et permet de détecter les dérives, et opère uniquement sur la couche des *preuves* : `lock --verify` n’est pas affecté par un retrait. La conception est basée sur [`examples/study-swarm-canon-rollback.dispatch.md`](examples/study-swarm-canon-rollback.dispatch.md), et le [PROTOCOL.md](PROTOCOL.md) § « Compenser une conclusion retirée » représente la forme exécutable. Il s’agit de la norme **NAMED_COMPENSATORS** rendue exécutable : une annulation nommée et idempotente qui laisse un état final connu et génère un reçu.

## Pourquoi cela fonctionne, en un clin d’œil

**Efficacité** — le domaine évolue rapidement ; exiger des études spécifiques sur plusieurs années empêcherait la publication de nouvelles versions 18 mois plus tard. **Fonctionnalité** — les données probantes montrent ce qui *ne fonctionne pas*, et pas seulement ce qui fonctionne (les explications peuvent entraîner une dépendance excessive à l’égard d’une IA *erronée* — Bansal et al., 2021, [arXiv:2006.14779](https://arxiv.org/abs/2006.14779)). **Sécurité** — l’enveloppe protégée par le vérificateur est l’architecture que les données probantes soutiennent, et le protocole l’applique à sa propre sortie. La recherche de sources n’est pas un exercice académique ; il s’agit du fil conducteur des données probantes.

## Sécurité

`study-swarm` fournit une **CLI légère et sans dépendances** (`study-swarm`) en plus de la méthodologie. Il n’effectue **aucune requête réseau ou vers le modèle** et ne collecte **aucune télémétrie** ; il n’y a pas de secrets ni d’identifiants dans le code source. Au moment de l’exécution, il lit uniquement le fichier que vous transmettez à `lint` et écrit un seul fichier `<slug>.dispatch.md` dans le répertoire courant pour `new` (il refuse d’écraser les fichiers et ne fonctionne jamais en dehors du répertoire de travail). La vérification basée sur le modèle décrite par la méthodologie (étape 4) est effectuée par les outils associés, et non par ce paquet. Voir [SECURITY.md](SECURITY.md).

## État actuel

Un protocole fonctionnel, vérifié en externe par ses propres mécanismes – une famille de modèles différente vérifie ses citations (voir la preuve ci-dessus). La **version 1.1** améliore le processus de validation là où la première version était silencieuse : justification décomposée/ternaire, justification au moment de la génération, cascade à activation par un oracle pour combiner les perspectives et abstention calibrée – chaque élément est basé sur la conclusion vérifiée de la version 1.1. La **version 1.2** rend un élément rejouable en boucle : `study-swarm lock` fixe le modèle résolu, l’invite et le schéma d’outils pour chaque étape, ainsi que le reçu du processus de validation, et `lock --verify` échoue en cas de dérive. La **version 1.3** rend l’annulation exécutable : lorsqu’une conclusion qui est déjà devenue canonique est retirée, `study-swarm withdraw` marque toutes les dépendances et `requalify --check` les interrompt et provoque leur échec jusqu’à ce qu’elles soient supprimées ou réévaluées – une compensation nommée, avec reçu et idempotente. Ce dépôt constitue la référence publique ; [PROTOCOL.md](PROTOCOL.md) représente la forme exécutable. Il fait partie de la famille [dogfood-lab](https://github.com/dogfood-lab) – méthodes et exemples pour construire des systèmes à l’ère de l’IA.

Licence MIT.

---

<p align="center"><sub>Part of the <a href="https://github.com/dogfood-lab">dogfood-lab</a> family — methods &amp; showcases for building in the AI era. Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.</sub></p>
