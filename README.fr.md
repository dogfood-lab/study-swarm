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

`study-swarm` est un protocole, pas un outil. Lorsque vous prenez une décision de conception importante avec un LLM (un nouveau niveau de produit, un choix d’architecture, une question du type « devons-nous faire confiance au modèle ici »), improviser à partir de principes fondamentaux conduit à des conceptions obsolètes, et citer des articles de mémoire conduit à des conceptions qui reposent sur des sources inexistantes ou qui ne disent pas ce que vous pensez. `study-swarm` remplace les deux : il lance en parallèle des agents de recherche, exige des résultats spécifiques cités et soumet chaque citation à un **vérificateur externe d’une famille de modèles différente** avant qu’elle n’influence la conception.

Il applique sa propre méthode. Le protocole prescrit l’utilisation d’enveloppes protégées par un vérificateur pour les systèmes auxquels il contribue à concevoir, il l’applique donc également sur lui-même. **Aucun modèle n’évalue son propre travail, y compris celui qui exécute le protocole.**

## Le protocole en cinq étapes

1. **Identifiez** 3 à 5 questions de conception essentielles dont la réponse serait modifiée par des preuves empiriques.
2. **Lancez** un agent de recherche par question, en parallèle. Chacun doit renvoyer le titre de l’article + les auteurs + les années + les URL + une conclusion d’une phrase (privilégiez la spécificité à l’étendue : « 6 à 8 conclusions bien étayées sont plus efficaces que 20 observations vagues »).
3. **Synthétisez** les résultats dans une section intitulée *Justification par la recherche* : `N. <conclusion>. <Auteurs> <année> (<arXiv/DOI>). <implication pour la conception>.`
4. **Vérifiez de manière externe** — une *famille de modèles différente*, sans raisonnement, vérifie chaque citation en deux étapes : un **oracle de récupération** confirme que l’article existe (jamais à partir de la mémoire du modèle), puis une **lentille d’ancrage** confirme que la conclusion correspond à la source. **Arrêtez le processus** si la citation est fabriquée ou mal attribuée ; **arrêtez et escaladez** si le vérificateur ou l’oracle de récupération n’est pas disponible (ne considérez jamais l’absence comme une indication que les citations sont correctes).
5. **Reliez** chaque choix architectural à une conclusion en utilisant un numéro. Les citations sans implication pour la conception sont du bruit.

Les détails complets et exécutables — le tableau d’arrêt, la norme de référencement, la règle d’ensemble — se trouvent dans **[PROTOCOL.md](PROTOCOL.md)**.

## Pourquoi une *famille différente*, sans raisonnement ?

Parce que les modes d’échec sont documentés, et non hypothétiques :

- **Les LLM ne peuvent pas vérifier de manière fiable leurs propres résultats.** Huang et al. 2023 ([arXiv:2310.01798](https://arxiv.org/abs/2310.01798)) ; Kambhampati et al. 2024 ([arXiv:2402.01817](https://arxiv.org/abs/2402.01817), LLM-Modulo) ; Stechly et al. 2024 ([arXiv:2402.08115](https://arxiv.org/abs/2402.08115)) — le vérificateur externe apporte les améliorations ; le contenu d’auto-évaluation est inerte.
- **Les juges de la même famille ont une préférence pour eux-mêmes.** Panickssery, Bowman & Feng 2024 ([arXiv:2404.13076](https://arxiv.org/abs/2404.13076)) — l’auto-reconnaissance est corrélée *linéairement* avec la préférence pour soi-même, de sorte qu’un aveuglement partiel n’est pas utile. Verga et al. 2024 ([arXiv:2404.18796](https://arxiv.org/abs/2404.18796), PoLL) — un groupe de juges issus de familles différentes est moins biaisé, pour un coût environ 7 fois inférieur.
- **Les citations sont les points où les LLM mentent.** Walters & Wilder 2023 ([doi:10.1038/s41598-023-41032-5](https://doi.org/10.1038/s41598-023-41032-5)) — 55 % des citations de GPT-3.5 et 18 % des citations de GPT-4 sont fabriquées. Onweller et al. 2026 ([arXiv:2605.06635](https://arxiv.org/abs/2605.06635)) — les liens résolvent plus de 94 % du temps, mais seulement 39 à 77 % du contenu cité soutiennent réellement l’affirmation. Par conséquent, l’existence doit être vérifiée par **récupération, et non par rappel**.
- **Masquez le raisonnement du générateur.** Khalifa et al. 2026 ([arXiv:2601.14691](https://arxiv.org/abs/2601.14691), « Gaming the Judge ») — la simple manipulation de la chaîne de pensée augmente les faux positifs d’un juge jusqu’à 90 %, les actions étant maintenues constantes. Turpin et al. 2023 ([arXiv:2305.04388](https://arxiv.org/abs/2305.04388)) — la chaîne de pensée est une rationalisation a posteriori. Le vérificateur voit uniquement l’affirmation de citation, jamais le « pourquoi j’ai inclus ceci ».
- **La diversité surpasse la quantité.** Rajan 2025 ([arXiv:2511.16708](https://arxiv.org/abs/2511.16708)) — quatre vérificateurs avec une corrélation par paires ρ ∈ [0,05, 0,25] sont plus efficaces qu’un seul grâce à la couverture sous-modulaire. Kim et al. 2025 ([arXiv:2506.07962](https://arxiv.org/abs/2506.07962)) — les erreurs des LLM sont *corrélées*, de sorte que la variable essentielle est la diversité des lentilles, et non la quantité brute.

## Est-ce que cela fonctionne réellement ? (preuve)

À titre de test, le protocole a été appliqué à ses propres citations. Deux familles non-Claude décorrélées — **Mistral** (`mistral-small:24b`) et **IBM Granite** (`granite4.1:30b`) — ont vérifié un ensemble de citations, sans raisonnement, en utilisant deux pièges aveugles :

| Piège planté | Mistral | IBM Granite | Vérité terrain |
|---|---|---|---|
| Une chaîne de pensée attribuée à « Nakamura & Olsen » | non détecté | **détecté** (mal attribué → en réalité Wei et al. 2022, arXiv:2201.11903) | mal attribué |
| un article fabriqué affirmant que « 98 % des erreurs sont éliminées, aucun oracle n’est nécessaire » | **caught** (fabricated) | **caught** (fabricated) | fabriqué |

Aucune des deux familles n’a détecté les deux pièges individuellement, mais leur **union a permis de détecter 2/2**. Un seul juge aurait validé la mauvaise attribution. Par ailleurs, l’oracle de récupération a détecté deux *vrais* mauvaises attributions dans nos propres documents de conception (articles cités avec le mauvais premier auteur) que aucun LLM paramétrique n’aurait pu signaler — et il a correctement confirmé des articles authentiques de 2026 que les deux LLM ont faussement signalés comme étant fabriqués simplement parce que les articles sont postérieurs à leur date d’entraînement. Ce dernier point est la raison pour laquelle la vérification de l’existence dans l’étape 4 **doit** être effectuée par un oracle de récupération, et non par un LLM.

Cette seule exécution est la thèse en miniature : **des lentilles décorrélées + un oracle de récupération pour vérifier l’existence sont plus efficaces qu’un seul juge intelligent.**

## Comment cela fonctionne-t-il ?

Vous pouvez exécuter le protocole manuellement : tout modèle d’une famille différente, associé à la résolution de l’identifiant arXiv/DOI, satisfait l’étape 4. Deux outils complémentaires permettent de réaliser cette opération en une seule commande :

- **[prism-verify](https://github.com/mcp-tool-shop-org/prism-verify)** : le vérificateur d’exécution ; il effectue un routage différent selon la famille, supprime les raisonnements inutiles, réalise une évaluation à plusieurs niveaux et établit un seuil minimal de récupération déterministe (arXiv → Crossref), en plus de générer des reçus signés.
- **[role-os](https://github.com/mcp-tool-shop-org/role-os)** : il fournit la commande `roleos verify-citations <dispatch>`, qui extrait les citations d’un document et les transmet à prism pour vérification.

Le transfert se fait via le format du document lui-même : une conclusion rédigée sous la forme `N. **conclusion.** Auteurs année (arXiv|DOI). implication.` — avec **un seul identifiant résolvable par conclusion** — est exactement ce que la commande `roleos verify-citations` extrait et transmet pour vérification. Un document propre, validé par `lint`, est transféré sans problème ; une citation mal formée est signalée comme non analysée par l’outil. Ce contrat est ce que la commande `study-swarm lint` vérifie localement, de sorte que les étapes 3 et 4 s’accordent sur la définition d’une citation.

## CLI

```bash
npm i -g @dogfood-lab/study-swarm     # or run ad-hoc: npx @dogfood-lab/study-swarm <command>
```

| Commande | Fonctionnement |
|---|---|
| `study-swarm protocol` | Affiche le protocole complet : les cinq étapes, la table de terminaison et la norme de référencement. |
| `study-swarm new <slug>` | Crée un fichier `<slug>.dispatch.md` avec le squelette des cinq étapes à compléter. |
| `study-swarm lint [--json] <path…>` | Vérifie le *fondement de la recherche* d’un document par rapport à la norme de référencement : chaque conclusion doit comporter un auteur, une année et un identifiant résolvable (arXiv / DOI / URL) ; les affirmations vagues du type « des études montrent que… » sont rejetées. En cas de violation, le programme se termine avec le code `1`, ce qui permet de contrôler l’intégration continue. Un `<chemin>` peut être un fichier, un répertoire (vérifié récursivement pour les fichiers `*.dispatch.md`) ou `-` pour l’entrée standard ; l’option `--json` génère un rapport lisible par machine. |

La commande `lint` est déterministe — elle n’effectue aucun appel de modèle —, ce qui la rend sûre pour l’intégration continue. Elle applique localement la **norme de référencement de l’étape 3** ; la vérification basée sur un modèle, à l’**étape 4**, est toujours effectuée par les outils complémentaires, et non par ce paquet.

Une boucle typique :

```bash
study-swarm new my-decision                      # creates my-decision.dispatch.md
# …fill in the questions, run the research dispatch, write the findings…
study-swarm lint my-decision.dispatch.md         # enforce the sourcing standard (Step 3)
roleos verify-citations my-decision.dispatch.md  # model-based Step 4 (different family, via prism)
```

Un document complet, propre et validé par `lint` — study-swarm appliqué à sa propre conception — est fourni dans le fichier [`examples/study-swarm-self.dispatch.md`](examples/study-swarm-self.dispatch.md) en tant que référence.

### Activez-le dans l’intégration continue

La commande `lint` prend un fichier, un répertoire (vérifié récursivement pour les fichiers `*.dispatch.md`) ou `-` pour l’entrée standard, et l’option `--json` génère un rapport lisible par machine. Intégrez ceci dans votre dépôt pour contrôler le référencement de chaque document lors de chaque demande d’extraction (un exemple à copier-coller est également disponible dans le fichier [`examples/study-swarm-ci.yml`](examples/study-swarm-ci.yml)) :

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

**Actuel** — le domaine évolue rapidement ; exiger des études spécifiques avec les années correspondantes évite que les conceptions ne soient mises en œuvre avec 18 mois de retard. **Fonctionnel** — les données montrent ce qui *échoue*, et pas seulement ce qui fonctionne (les explications peuvent entraîner une dépendance excessive à l’égard d’une IA *incorrecte* — Bansal et al., 2021, [arXiv:2006.14779](https://arxiv.org/abs/2006.14779)). **Sûr** — l’enveloppe protégée par le vérificateur est l’architecture que les données étayent, et le protocole l’applique à sa propre sortie. Le référencement n’est pas un exercice académique ; il s’agit de la chaîne de preuves.

## Sécurité

`study-swarm` fournit une **CLI légère, sans dépendances**, (`study-swarm`) ainsi que la méthodologie. Il n’effectue **aucun appel réseau ou de modèle** et ne collecte **aucune télémétrie** ; il n’y a pas de secrets ni d’identifiants dans le code source. Lors de l’exécution, il lit uniquement le fichier que vous transmettez à la commande `lint` et écrit un seul fichier `<slug>.dispatch.md` dans le répertoire courant pour une nouvelle version (il refuse d’écraser les fichiers existants et ne sort jamais du répertoire de travail). La vérification basée sur un modèle décrite par la méthodologie (étape 4) est effectuée par les outils complémentaires, et non par ce paquet. Voir [SECURITY.md](SECURITY.md).

## État actuel

Un protocole fonctionnel, vérifié en externe par ses propres mécanismes — une famille de modèles différente vérifie ses citations (voir la preuve ci-dessus). Ce dépôt est la référence publique ; le fichier [PROTOCOL.md](PROTOCOL.md) représente la forme exécutable. Il fait partie de la famille [dogfood-lab](https://github.com/dogfood-lab) — méthodes et exemples pour construire dans l’ère de l’IA.

Licence MIT.

---

<p align="center"><sub>Part of the <a href="https://github.com/dogfood-lab">dogfood-lab</a> family — methods &amp; showcases for building in the AI era. Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.</sub></p>
