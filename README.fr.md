<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/dogfood-lab/study-swarm/main/assets/study-swarm.png" alt="study-swarm" width="360">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License"></a>
  <a href="https://dogfood-lab.github.io/study-swarm/"><img src="https://img.shields.io/badge/handbook-live-purple" alt="Handbook"></a>
  <img src="https://img.shields.io/badge/cited%20research-verified-1f6feb" alt="Cited research, verified">
</p>

**Ancrez les décisions de conception dans les recherches citées, puis vérifiez les citations à l’aide d’un *modèle* différent avant que quoi que ce soit ne devienne une référence.**

`study-swarm` est un protocole, pas un outil. Lorsque vous prenez une décision de conception importante avec un LLM (un nouveau niveau de produit, un choix d’architecture, une question du type « devons-nous faire confiance au modèle ici »), improviser à partir de principes de base conduit à des conceptions obsolètes, et citer des articles de mémoire conduit à des conceptions basées sur des sources qui n’existent pas ou qui ne disent pas ce que vous pensez. `study-swarm` remplace les deux : il lance des agents de recherche parallèles, exige des résultats spécifiques cités et soumet chaque citation à un **vérificateur externe d’une famille de modèles différente** avant qu’elle n’influence la conception.

Il applique sa propre méthode. Le protocole prescrit des enveloppes protégées par un vérificateur pour les systèmes qu’il aide à concevoir, il l’applique donc à lui-même. **Aucun modèle n’évalue son propre travail, y compris celui qui exécute le protocole.**

## Le protocole en cinq étapes

1. **Identifiez** 3 à 5 questions de conception essentielles auxquelles des preuves empiriques permettraient de modifier la réponse.
2. **Lancez** un agent de recherche par question, en parallèle. Chacun doit renvoyer les titres des articles + les auteurs + les années + les URL + un résultat en une phrase — privilégiez la spécificité à l’étendue (« 6 à 8 résultats bien documentés sont plus efficaces que 20 observations vagues »).
3. **Synthétisez** les résultats dans une section *Justification par la recherche* : `N. **<résultat>.** <Auteurs> <année> (<arXiv/DOI>). <implication pour la conception>.`
4. **Vérifiez de manière externe** — une *famille de modèles différente*, sans raisonnement, vérifie chaque citation en deux étapes : un **oracle de récupération** confirme que l’article existe (jamais la mémoire du modèle), puis une **lentille de pertinence** confirme que le résultat correspond à la source. **Arrêtez** si la citation est fabriquée ou mal attribuée ; **arrêtez et escaladez** si le vérificateur ou l’oracle de récupération n’est pas disponible (ne considérez jamais l’absence comme une indication que les citations sont correctes).
5. **Reliez** chaque choix architectural à un résultat par numéro. Les citations sans implication pour la conception sont du bruit.

Les détails complets et exécutables — le tableau d’arrêt, la norme de référencement, la règle d’ensemble — se trouvent dans **[PROTOCOL.md](PROTOCOL.md)**.

## Pourquoi une *famille différente*, sans raisonnement ?

Parce que les modes d’échec sont documentés, et non hypothétiques :

- **Les LLM ne peuvent pas vérifier de manière fiable leurs propres résultats.** Huang et al. 2023 ([arXiv:2310.01798](https://arxiv.org/abs/2310.01798)) ; Kambhampati et al. 2024 ([arXiv:2402.01817](https://arxiv.org/abs/2402.01817), LLM-Modulo) ; Stechly et al. 2024 ([arXiv:2402.08115](https://arxiv.org/abs/2402.08115)) — le vérificateur externe apporte les améliorations ; le contenu d’auto-évaluation est inerte.
- **Les juges de la même famille ont une préférence pour eux-mêmes.** Panickssery, Bowman & Feng 2024 ([arXiv:2404.13076](https://arxiv.org/abs/2404.13076)) — l’auto-reconnaissance est corrélée *linéairement* avec l’auto-préférence, de sorte qu’un aveuglement partiel ne sert à rien. Verga et al. 2024 ([arXiv:2404.18796](https://arxiv.org/abs/2404.18796), PoLL) — un groupe de juges issus de familles différentes est moins biaisé, pour un coût environ 7 fois inférieur.
- **Les citations sont les points où les LLM mentent.** Walters & Wilder 2023 ([doi:10.1038/s41598-023-41032-5](https://doi.org/10.1038/s41598-023-41032-5)) — 55 % des citations de GPT-3.5 et 18 % de celles de GPT-4 sont fabriquées. Onweller et al. 2026 ([arXiv:2605.06635](https://arxiv.org/abs/2605.06635)) — les liens résolvent plus de 94 % du temps, mais seulement 39 à 77 % du contenu cité soutiennent réellement l’affirmation. Par conséquent, l’existence doit être vérifiée par **la récupération, et non par la mémorisation**.
- **Masquez le raisonnement du générateur.** Khalifa et al. 2026 ([arXiv:2601.14691](https://arxiv.org/abs/2601.14691), « Gaming the Judge ») — la simple manipulation de la chaîne de pensée augmente les faux positifs d’un juge jusqu’à 90 %, les actions étant maintenues fixes. Turpin et al. 2023 ([arXiv:2305.04388](https://arxiv.org/abs/2305.04388)) — la chaîne de pensée est une rationalisation a posteriori. Le vérificateur voit la simple affirmation de la citation, jamais la raison pour laquelle elle a été incluse.
- **La diversité est plus importante que la quantité.** Rajan 2025 ([arXiv:2511.16708](https://arxiv.org/abs/2511.16708)) — quatre vérificateurs avec une corrélation par paires ρ ∈ [0,05, 0,25] sont plus efficaces qu’un seul, grâce à une couverture sous-modulaire. Kim et al. 2025 ([arXiv:2506.07962](https://arxiv.org/abs/2506.07962)) — les erreurs des LLM sont *corrélées*, de sorte que la variable essentielle est la diversité des lentilles, et non la quantité brute.

## Est-ce que cela fonctionne réellement ? (preuve)

À titre de test, le protocole a été appliqué à ses propres citations. Deux familles non-Claude non corrélées — **Mistral** (`mistral-small:24b`) et **IBM Granite** (`granite4.1:30b`) — ont vérifié un ensemble de citations, sans raisonnement, en y intégrant deux pièges aveugles :

| Piège implanté | Mistral | IBM Granite | Vérité terrain |
|---|---|---|---|
| Une chaîne de pensée attribuée à « Nakamura et Olsen » | non détecté | **détecté** (mal attribué → en réalité Wei et al. 2022) | mal attribué |
| un article fabriqué affirmant que « 98 % des erreurs sont éliminées, aucun oracle n’est nécessaire » | **caught** (fabricated) | **caught** (fabricated) | fabriqué |

Aucune des deux familles n’a détecté les deux pièges individuellement, mais leur **union a permis de détecter les 2/2**. Un seul juge aurait validé la mauvaise attribution. Par ailleurs, l’oracle de récupération a détecté deux *vrais* mauvaises attributions dans nos propres documents de conception (articles cités sous le mauvais premier auteur) que aucun LLM paramétrique n’aurait pu signaler, et il a correctement confirmé des articles authentiques de 2026 que les deux LLM ont faussement signalés comme étant fabriqués, simplement parce que les articles sont postérieurs à leur date d’entraînement. Ce dernier point est la raison pour laquelle la vérification de l’existence à l’étape 4 **doit** être effectuée par un oracle de récupération, et non par un LLM.

Cette seule expérience est la thèse en miniature : **des lentilles non corrélées + un oracle de récupération pour l’existence sont plus efficaces qu’un seul juge intelligent.**

## Comment cela fonctionne

Vous pouvez exécuter le protocole manuellement — tout modèle d’une famille différente, associé à la résolution de l’arXiv/DOI, suffit pour l’étape 4. Deux outils frères permettent de le faire en une seule commande :

- **[prism-verify](https://github.com/mcp-tool-shop-org/prism-verify)** — le vérificateur d’exécution : routage différencié selon les familles, suppression des raisonnements, adjudication multi-lentilles, seuil de récupération déterministe (arXiv → Crossref) et reçus signés.
- **[role-os](https://github.com/mcp-tool-shop-org/role-os)** — fournit `roleos verify-citations <dispatch>`, l’outil qui extrait les citations d’un document et les soumet à la vérification par prism.

## Pourquoi cela fonctionne, en un clin d’œil

**Efficacité** — le domaine évolue rapidement ; exiger des études spécifiques et approfondies retarde la mise en œuvre des conceptions de 18 mois. **Fonctionnalité** — les données montrent ce qui *ne fonctionne pas*, et pas seulement ce qui fonctionne (les explications peuvent entraîner une dépendance excessive à l’égard d’une IA *erronée* — Bansal et al. 2021). **Sécurité** — l’enveloppe protégée par le vérificateur est l’architecture que les données étayent, et le protocole l’applique à ses propres résultats. La recherche de sources n’est pas un exercice académique ; c’est la chaîne de preuves.

## Sécurité

`study-swarm` est un dépôt de documentation : Markdown et un logo. Il ne contient aucun code exécutable et n’installe rien à partir de ce dépôt. Il n’accède à aucune donnée, ne nécessite aucune autorisation et ne collecte aucune télémétrie ; il n’y a pas de secrets ou d’identifiants dans le code source. La méthodologie *décrit* un flux de travail qui utilise la récupération sur le web et la vérification basée sur des modèles, mais ce dépôt ne l’implémente ni ne l’exécute. Voir [SECURITY.md](SECURITY.md).

## État

Un protocole fonctionnel, vérifié en externe par ses propres mécanismes : une famille de modèles différente vérifie ses citations (voir la preuve ci-dessus). Ce dépôt est la référence publique ; [PROTOCOL.md](PROTOCOL.md) est la forme exécutable. Fait partie de la famille [dogfood-lab](https://github.com/dogfood-lab) : méthodes et exemples pour construire dans l’ère de l’IA.

Licence MIT.

---

<p align="center"><sub>Part of the <a href="https://github.com/dogfood-lab">dogfood-lab</a> family — methods &amp; showcases for building in the AI era. Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.</sub></p>
