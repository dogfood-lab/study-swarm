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

`study-swarm` est un protocole, pas un outil. Lorsque vous prenez une décision de conception importante avec un LLM (un nouveau niveau de produit, un choix d’architecture, une question du type « devons-nous faire confiance au modèle ici »), improviser à partir de principes fondamentaux conduit à des conceptions obsolètes, et citer des articles de mémoire conduit à des conceptions qui reposent sur des sources inexistantes ou qui ne disent pas ce que vous pensez. `study-swarm` remplace les deux : il lance en parallèle des agents de recherche, exige des résultats spécifiques cités et soumet chaque citation à un **vérificateur externe d’une famille de modèles différente** avant qu’elle n’influence la conception.

Il applique sa propre méthode. Le protocole prescrit l’utilisation d’enveloppes protégées par un vérificateur pour les systèmes dont il facilite la conception, il l’applique donc à lui-même. **Aucun modèle ne corrige ses propres devoirs, y compris celui qui exécute le protocole.**

## Le protocole en cinq étapes

1. **Identifiez** 3 à 5 questions de conception essentielles dont la réponse serait modifiée par des preuves empiriques.
2. **Lancez** un agent de recherche par question, en parallèle. Chacun doit renvoyer les titres des articles + les auteurs + les années + les URL + une conclusion d’une phrase (privilégiez la spécificité à l’étendue : « 6 à 8 conclusions bien étayées sont plus efficaces que 20 observations vagues »).
3. **Synthétisez** les conclusions dans une section intitulée *Justification par la recherche* : `N. <conclusion>. <Auteurs> <année> (<arXiv/DOI>). <implication pour la conception>.`
4. **Vérifiez de manière externe** — une *famille de modèles différente*, sans raisonnement, vérifie chaque citation en deux étapes : un **oracle de récupération** confirme que l’article existe (jamais à partir de la mémoire du modèle), puis une **lentille d’exactitude** confirme que la conclusion correspond à la source. **Arrêtez le processus** si la citation est fabriquée ou mal attribuée ; **arrêtez et escaladez** si le vérificateur ou l’oracle de récupération n’est pas disponible (ne considérez jamais l’absence comme signifiant que les citations sont correctes).
5. **Reliez** chaque choix architectural à une conclusion en utilisant un numéro. Les citations qui n’ont pas d’implication pour la conception sont du bruit.

Les détails complets et exécutables (le tableau d’arrêt, la norme de référencement, la règle d’ensemble) se trouvent dans **[PROTOCOL.md](PROTOCOL.md)**.

## Pourquoi une *famille différente*, sans raisonnement ?

Parce que les modes d’échec sont documentés, et non hypothétiques :

- **Les LLM ne peuvent pas vérifier de manière fiable leurs propres résultats.** Huang et al. 2023 ([arXiv:2310.01798](https://arxiv.org/abs/2310.01798)) ; Kambhampati et al. 2024 ([arXiv:2402.01817](https://arxiv.org/abs/2402.01817), LLM-Modulo) ; Stechly et al. 2024 ([arXiv:2402.08115](https://arxiv.org/abs/2402.08115)) — le vérificateur externe apporte les améliorations ; le contenu d’autocritique est inerte.
- **Les juges de la même famille ont une préférence pour eux-mêmes.** Panickssery, Bowman & Feng 2024 ([arXiv:2404.13076](https://arxiv.org/abs/2404.13076)) — l’auto-reconnaissance est corrélée *linéairement* avec la préférence pour soi-même, de sorte qu’un aveuglement partiel n’est pas utile. Verga et al. 2024 ([arXiv:2404.18796](https://arxiv.org/abs/2404.18796), PoLL) — un groupe de juges issus de familles distinctes est moins biaisé, pour un coût environ 7 fois inférieur.
- **Les citations sont les endroits où les LLM mentent.** Walters & Wilder 2023 ([doi:10.1038/s41598-023-41032-5](https://doi.org/10.1038/s41598-023-41032-5)) — 55 % des citations de GPT-3.5 et 18 % des citations de GPT-4 sont fabriquées. Onweller et al. 2026 ([arXiv:2605.06635](https://arxiv.org/abs/2605.06635)) — les liens résolvent plus de 94 % du temps, mais seulement 39 à 77 % du contenu cité soutiennent réellement l’affirmation. Par conséquent, l’existence doit être vérifiée par **la récupération, et non par la mémorisation**.
- **Masquez le raisonnement du générateur.** Khalifa et al. 2026 ([arXiv:2601.14691](https://arxiv.org/abs/2601.14691), « Gaming the Judge ») — la manipulation de la chaîne de pensée seule augmente les faux positifs d’un juge jusqu’à 90 %, les actions étant maintenues fixes. Turpin et al. 2023 ([arXiv:2305.04388](https://arxiv.org/abs/2305.04388)) — la chaîne de pensée est une rationalisation a posteriori. Le vérificateur voit uniquement l’affirmation de citation, jamais le « pourquoi je l’ai incluse ».
- **La diversité surpasse la quantité.** Rajan 2025 ([arXiv:2511.16708](https://arxiv.org/abs/2511.16708)) — quatre vérificateurs avec une corrélation par paires ρ ∈ [0,05, 0,25] sont plus efficaces qu’un seul grâce à la couverture sous-modulaire. Kim et al. 2025 ([arXiv:2506.07962](https://arxiv.org/abs/2506.07962)) — les erreurs des LLM sont *corrélées*, de sorte que la variable essentielle est la diversité des lentilles, et non la quantité brute.

## Est-ce que cela fonctionne réellement ? (preuve)

À titre de test, le protocole a été appliqué à ses propres citations. Deux familles non-Claude décorrélées — **Mistral** (`mistral-small:24b`) et **IBM Granite** (`granite4.1:30b`) — ont vérifié un ensemble de citations, sans raisonnement, en y intégrant deux pièges aveugles :

| Piège planté | Mistral | IBM Granite | Vérité terrain |
|---|---|---|---|
| Une chaîne de pensée attribuée à « Nakamura & Olsen » | non détecté | **détecté** (mal attribué → en réalité Wei et al. 2022, arXiv:2201.11903) | mal attribué |
| un article fabriqué affirmant que « 98 % des erreurs sont éliminées, aucun oracle n’est nécessaire » | **caught** (fabricated) | **caught** (fabricated) | fabriqué |

Aucune des deux familles n’a détecté les deux pièges individuellement, mais leur **union a permis de détecter 2/2**. Un seul juge aurait validé la mauvaise attribution. Par ailleurs, l’oracle de récupération a détecté deux *vrais* mauvaises attributions dans nos propres documents de conception (articles cités sous le nom du mauvais premier auteur) que aucun LLM paramétrique n’aurait pu signaler — et il a correctement confirmé des articles authentiques de 2026 que les deux LLM ont faussement signalés comme étant fabriqués simplement parce que les articles sont postérieurs à leur date d’entraînement. Ce dernier point est la raison pour laquelle la vérification de l’existence dans l’étape 4 **doit** être effectuée par un oracle de récupération, et non par un LLM.

Cette seule expérience résume la thèse : **des lentilles décorrélées + un oracle de récupération pour vérifier l’existence sont plus efficaces qu’un seul juge intelligent.**

### …et encore une fois, pour concevoir la version 1.1

Les améliorations de la version 1.1 ont été choisies de la même manière : en exécutant « study-swarm » sur « study-swarm ». Quatre questions auxquelles la première version n’avait pas répondu (« Je pense que… ») (comment *mécaniser* la vérification du fondement, faut-il effectuer le fondement au moment de la génération, comment *combiner* les différentes sources d’information, faut-il s’abstenir en cas d’incertitude calibrée) ont été soumises à des agents de recherche parallèles, et les **27 références résultantes** ont été validées à l’étape 4 avant d’influencer la conception. L’oracle de récupération a confirmé que **les 27/27 existent**, y compris six articles datant de 2025-2026 qu’un modèle paramétrique aurait faussement identifiés comme étant fabriqués, et il a corrigé cinq attributions qu’un modèle n’aurait pas pu faire, dont une véritable erreur d’attribution à un premier auteur que l’agent de recherche avait lui-même signalée. En exécutant le processus sans raisonnement préalable, les différentes sources d’information ont même reproduit leurs propres modes d’échec documentés dans notre analyse : l’une a identifié avec assurance un article réel de manière incorrecte, et leur *désaccord* a déclenché une escalade, exactement comme le prévoit la cascade. L’analyse effectuée est fournie sous forme de [`examples/study-swarm-v1_1.dispatch.md`](examples/study-swarm-v1_1.dispatch.md) ; les améliorations qui ont été validées (fondement décomposé/ternaire, fondement au moment de la génération, cascade validée par l’oracle et abstention calibrée) sont disponibles dans [PROTOCOL.md](PROTOCOL.md).

## Comment cela fonctionne

Vous pouvez exécuter le protocole manuellement : tout modèle d’une famille différente, associé à la résolution de l’identifiant arXiv/DOI, satisfait les exigences de l’étape 4. Deux outils complémentaires permettent de réaliser cette opération en une seule commande :

- **[prism-verify](https://github.com/mcp-tool-shop-org/prism-verify)** : le vérificateur d’exécution : routage pour les modèles de familles différentes, suppression du raisonnement préalable, arbitrage multi-sources, seuil minimal déterministe pour la récupération (arXiv → Crossref) et reçus signés.
- **[role-os](https://github.com/mcp-tool-shop-org/role-os)** : fournit `roleos verify-citations <dispatch>`, l’outil qui extrait les références d’une analyse et les valide à travers prism.

Le transfert se fait par le biais du format de l’analyse : une conclusion rédigée sous la forme « N. **conclusion**. Auteurs, année (arXiv|DOI). implication » — avec **un seul identifiant résolvable par conclusion** — est exactement ce que `roleos verify-citations` extrait et valide. Une analyse propre (« lint-clean ») se transfère sans problème ; une référence mal formée est celle que l’outil signale comme non analysée. Ce contrat est ce que `study-swarm lint` vérifie localement, de sorte que les étapes 3 et 4 s’accordent sur la définition d’une référence.

## Interface en ligne de commande (CLI)

```bash
npm i -g @dogfood-lab/study-swarm     # or run ad-hoc: npx @dogfood-lab/study-swarm <command>
```

| Commande | Fonctionnalité |
|---|---|
| `study-swarm protocol` | Affiche le protocole complet : les cinq étapes, la table d’arrêt et la norme de référencement. |
| `study-swarm new <slug>` | Crée un fichier `<slug>.dispatch.md` avec le squelette des cinq étapes à compléter. |
| `study-swarm lint [--json] <path…>` | Vérifie le *fondement de la recherche* d’une analyse par rapport à la norme de référencement : chaque conclusion doit comporter un auteur, une année et un identifiant résolvable (arXiv / DOI / URL) ; les affirmations du type « des études montrent que… » ne sont pas acceptées. En cas de violation, le programme se termine avec le code `1`, ce qui permet de contrôler l’intégration continue (CI). Un `<path>` peut être un fichier, un répertoire (vérifié récursivement pour les fichiers `*.dispatch.md`) ou `-` pour l’entrée standard ; l’option `--json` génère un rapport lisible par machine. |

`lint` est déterministe — il n’effectue aucun appel de modèle — ce qui le rend sûr à utiliser dans l’intégration continue (CI). Il applique localement la **norme de référencement de l’étape 3** ; la vérification basée sur un modèle de l’**étape 4** est toujours effectuée par les outils complémentaires, et non par ce paquet. Voir [SECURITY.md](SECURITY.md).

Exemple d’utilisation :

```bash
study-swarm new my-decision                      # creates my-decision.dispatch.md
# …fill in the questions, run the research dispatch, write the findings…
study-swarm lint my-decision.dispatch.md         # enforce the sourcing standard (Step 3)
roleos verify-citations my-decision.dispatch.md  # model-based Step 4 (different family, via prism)
```

Deux analyses complètes et propres sont fournies en exemple : [`examples/study-swarm-self.dispatch.md`](examples/study-swarm-self.dispatch.md) (la décision centrale du protocole, concise) et [`examples/study-swarm-v1_1.dispatch.md`](examples/study-swarm-v1_1.dispatch.md) (l’ensemble des 27 références de la version 1.1, chacune ayant été vérifiée en externe).

### Intégration dans l’intégration continue (CI)

`lint` prend un fichier, un répertoire (vérifié récursivement pour les fichiers `*.dispatch.md`) ou `-` pour l’entrée standard, et `--json` génère un rapport lisible par machine. Vous pouvez intégrer cela dans votre dépôt afin de valider le référencement de chaque analyse lors de chaque demande d’extraction (un exemple de copie-collage est également disponible dans [`examples/study-swarm-ci.yml`](examples/study-swarm-ci.yml)) :

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

## Pourquoi cela fonctionne, en résumé

**Actuel** : le domaine évolue rapidement ; exiger des études spécifiques avec les années correspondantes évite que les conceptions ne soient mises en œuvre avec 18 mois de retard. **Fonctionnel** : les données montrent ce qui *échoue*, et pas seulement ce qui fonctionne (les explications peuvent entraîner une dépendance excessive à l’égard d’une IA *incorrecte* — Bansal et al., 2021, [arXiv:2006.14779](https://arxiv.org/abs/2006.14779)). **Sûr** : l’enveloppe protégée par le vérificateur est l’architecture que les données étayent, et le protocole l’applique à sa propre sortie. Le référencement n’est pas un exercice académique ; c’est la preuve.

## Sécurité

`study-swarm` fournit une **CLI légère et sans dépendances** (`study-swarm`) ainsi que la méthodologie. Il n’effectue **aucun appel réseau ou de modèle** et ne collecte **aucune télémétrie** ; il n’y a pas de secrets ni d’identifiants dans le code source. Lors de l’exécution, il lit uniquement le fichier que vous transmettez à `lint` et écrit un seul fichier `<slug>.dispatch.md` dans le répertoire actuel pour `new` (il refuse d’écraser les fichiers existants et n’écrira jamais en dehors du répertoire de travail). La vérification basée sur un modèle décrite dans la méthodologie (étape 4) est effectuée par les outils complémentaires, et non par ce paquet. Voir [SECURITY.md](SECURITY.md).

## État actuel

Un protocole fonctionnel, vérifié en externe par ses propres mécanismes : un modèle d’une famille différente vérifie ses références (voir la preuve ci-dessus). La **version 1.1** affine le vérificateur là où la première version était silencieuse : fondement décomposé/ternaire, fondement au moment de la génération, cascade validée par l’oracle pour combiner les sources d’information et abstention calibrée — chacun étant basé sur l’analyse vérifiée de la version 1.1. Ce dépôt est la référence publique ; [PROTOCOL.md](PROTOCOL.md) est la forme exécutable. Il fait partie de la famille [dogfood-lab](https://github.com/dogfood-lab) : méthodes et exemples pour construire dans l’ère de l’IA.

Licence MIT.

---

<p align="center"><sub>Part of the <a href="https://github.com/dogfood-lab">dogfood-lab</a> family — methods &amp; showcases for building in the AI era. Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.</sub></p>
