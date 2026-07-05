<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

**引用された研究に基づいて設計上の決定を行い、その後、そのすべての内容が公式なものになる前に、*別の*モデルファミリーを使用して引用を検証する。**

`study-swarm`はツールではなくプロトコルである。大規模言語モデル（LLM）を用いて重要な設計上の決定を行う場合（新しい製品レイヤー、アーキテクチャの選択、「ここでモデルを信頼すべきか」という判断など）、最初から即興で進めるのではなく、事前に研究に基づいて設計すると、時代遅れの設計になったり、記憶に基づいて論文を引用すると、存在しない情報源や、あなたが考えていることとは異なる内容の情報源に依存した設計になってしまう。`study-swarm`はこれら2つを置き換える：複数の研究エージェントを並行して派遣し、特定の引用された調査結果を要求し、すべての引用について、設計に影響を与える前に、**別のモデルファミリーの外部検証者**によって検証する。

これは、自らその方法を採用している。このプロトコルは、設計を支援するシステムに対して、検証者による保護された環境を規定するため、それ自体にも適用される。**プロトコルを実行するモデルであっても、自分の宿題を評価することはできない。**

## プロトコルの5つのステップ

1. **特定する：** 実証的な証拠によって回答が変わる可能性のある、3〜5個の重要な設計上の質問を特定する。
2. **派遣する：** 各質問に対して、並行して1つの研究エージェントを派遣する。各エージェントは、論文タイトル＋著者＋年＋URL＋一文の調査結果を返す必要がある（広範囲よりも具体性重視。「6〜8件の信頼できる調査結果が、20件の曖昧な情報よりも優れている」）。
3. **統合する：** 調査結果を「研究による根拠」セクションに統合する：「N.**<調査結果>。<著者><年>(<arXiv/DOI>)。<設計への影響>。」
4. **外部で検証する：** *別のモデルファミリー*（推論機能を削除したもの）を使用して、すべての引用を2つの段階でチェックする。まず、**検索オラクル**が論文が存在することを確認する（モデルの記憶ではなく）。次に、「根拠」レンズが、調査結果が情報源と一致することを確認する。**捏造または誤った帰属の場合、処理を停止する。検証者または検索オラクルが利用できない場合は、処理を停止してエスカレーションする（不在を「引用は問題ない」と解釈しないこと）。
5. **関連付ける：** 各アーキテクチャの選択を、番号を使って調査結果に関連付ける。設計への影響がない引用はノイズである。

完全な実行可能な詳細（停止テーブル、情報源に関する標準、アンサンブルルール）は、**[PROTOCOL.md](PROTOCOL.md)**に記載されている。

## なぜ*別の*ファミリーで、推論機能を削除する必要があるのか？

それは、失敗モードが仮説ではなく、文書化されているためである：

- **LLMは、自分の出力を確実に検証できない。** Huang et al. 2023 ([arXiv:2310.01798](https://arxiv.org/abs/2310.01798)); Kambhampati et al. 2024 ([arXiv:2402.01817](https://arxiv.org/abs/2402.01817), LLM-Modulo); Stechly et al. 2024 ([arXiv:2402.08115](https://arxiv.org/abs/2402.08115)) — 外部検証者がメリットをもたらす。自己批判的な内容は効果がない。
- **同じファミリーの評価者は、自分を高く評価する傾向がある。** Panickssery, Bowman & Feng 2024 ([arXiv:2404.13076](https://arxiv.org/abs/2404.13076)) — 自己認識は、自己選好と*線形に*相関するため、部分的なブラインド処理では効果がない。Verga et al. 2024 ([arXiv:2404.18796](https://arxiv.org/abs/2404.18796), PoLL) — 異なるファミリーのパネルを使用すると、約7分の1のコストで偏りが少なくなる。
- **LLMは、引用において嘘をつく。** Walters & Wilder 2023 ([doi:10.1038/s41598-023-41032-5](https://doi.org/10.1038/s41598-023-41032-5)) — GPT-3.5の55％、GPT-4の18％の引用が捏造されている。Onweller et al. 2026 ([arXiv:2605.06635](https://arxiv.org/abs/2605.06635)) — リンクは94％以上の確率で解決するが、引用されたコンテンツのわずか39〜77％しか主張を裏付けていない。したがって、存在は**検索によって確認する必要があり、記憶に頼るべきではない。**
- **生成者の推論を隠す。** Khalifa et al. 2026 ([arXiv:2601.14691](https://arxiv.org/abs/2601.14691), "Gaming the Judge") — 操作された連鎖思考だけでは、評価者の誤検出率が最大90％まで増加する（アクションは固定）。Turpin et al. 2023 ([arXiv:2305.04388](https://arxiv.org/abs/2305.04388)) — CoTは、事後的な合理化である。検証者は、単なる引用の主張のみを確認し、「なぜこれを含めたのか」という理由は確認しない。
- **多様性は、数よりも重要である。** Rajan 2025 ([arXiv:2511.16708](https://arxiv.org/abs/2511.16708)) — ペアワイズ相関ρ∈[0.05, 0.25]の4つの検証者は、サブモジュラーカバレッジによって、いずれかの単一の検証者よりも優れた結果をもたらす。Kim et al. 2025 ([arXiv:2506.07962](https://arxiv.org/abs/2506.07962)) — LLMのエラーは*相関しているため、重要な変数はレンズの多様性であり、単純な数ではない。

## 実際に機能するのか？（証拠）

テストとして、このプロトコルを自分の引用に対して実行した。2つの非相関性の高いClaude以外のファミリー（**Mistral** (`mistral-small:24b`)と**IBM Granite** (`granite4.1:30b`））を使用して、推論機能を削除し、2つのブラインドトラップを埋め込んだ引用セットをチェックした。

| 仕掛けられたトラップ | Mistral | IBM Granite | 真実 |
|---|---|---|---|
| 「Nakamura & Olsen」に帰属された連鎖思考プロンプト | 見逃した | **検出（誤った帰属→実際にはWei et al. 2022、arXiv:2201.11903）** | 誤って帰属された |
| 「98％のエラーが解消され、オラクルは不要」という捏造された論文 | **caught** (fabricated) | **caught** (fabricated) | 捏造された |

どちらのファミリーも単独では両方のトラップを検出できなかったが、**組み合わせることで2/2を検出した。** 単一の評価者であれば、誤った帰属をそのまま採用していただろう。別途、検索オラクルは、当社の設計ドキュメントにある2つの*実際の*誤った帰属（間違った最初の著者に引用された論文）を検出し、どのパラメトリックLLMでも検出できなかった。また、両方のLLMが、トレーニングデータ以降に発表された論文を単純に捏造されたと誤ってフラグ付けしたため、正当な2026年の論文も正しく確認できた。最後の点が、ステップ4の存在チェックが**検索オラクルでなければならず、LLMであってはならない理由である。**

この単一の実行は、ミニチュア版の仮説である：**相関性の低いレンズと、存在を確認するための検索オラクルがあれば、どんなに優れた単一の評価者よりも優れている。**

### …そして再び、v1.1を設計するために

v1.1の改良は、同じ方法で選択されました。つまり、「study-swarm」上で「study-swarm」を実行することによってです。最初のリリースで「私はそう思う」という形で残された4つの質問（根拠チェックをどのように*機械化*するか、生成時に根拠を与えるかどうか、レンズをどのように*組み合わせるか、校正された不確実性に対して保留にするかどうか）は、並行研究エージェントに割り当てられ、すべての**27件の結果として得られた引用文献**は、設計に反映される前にステップ4で検証されました。検索オラクルは、**27/27件が存在すること**を確認しました。これには、パラメトリックモデルが捏造されたものと誤って判断する可能性のある6つの2025〜2026年の論文も含まれており、また、モデルでは確認できなかった5つの引用の誤りを修正しました。その中には、研究エージェント自身が指摘した実際の最初の著者の誤った引用が含まれています。推論を排除して実行すると、根拠レンズは、私たちのディスパッチで文書化された自身の失敗モードを再現します。つまり、1つの論文を自信を持って誤って分類し、それらの*不一致*がエスカレーションを引き起こします。これはまさにカスケードで規定されているとおりです。この動作するディスパッチは、[`examples/study-swarm-v1_1.dispatch.md`](examples/study-swarm-v1_1.dispatch.md)として提供されます。それに含まれる改良点（分解/三項根拠、生成時の根拠、オラクルによるカスケードの検証、校正された保留）は、[PROTOCOL.md](PROTOCOL.md)に記載されています。

## その仕組み

プロトコルを手動で実行できます。異なるモデルと、arXiv/DOIを自分で解決することでステップ4を満たすことができます。2つの関連ツールを使用すると、1つのコマンドで実行できます。

- **[prism-verify](https://github.com/mcp-tool-shop-org/prism-verify)** — 実行時の検証ツール：異なるモデルファミリーへのルーティング、推論の排除、マルチレンズによる仲裁、決定的な検索存在性の下限（arXiv → Crossref）、署名されたレシート。
- **[role-os](https://github.com/mcp-tool-shop-org/role-os)** — `roleos verify-citations <dispatch>`を提供します。これは、ディスパッチの引用文献を抽出し、prismを通じて検証するランナーです。

ハンドオフは、ディスパッチ形式自体です。`N. **finding.** Authors year (arXiv|DOI). implication.`という形式で記述された発見（**各発見に対して1つの解決可能な識別子**）は、まさに`roleos verify-citations`が読み取り、検証するものです。`lint`によってクリーンなディスパッチは問題なくハンドオフされます。不正な形式の引用文献は、ランナーによって解析不能としてフラグが立てられます。この契約内容は、`study-swarm lint`がローカルでチェックするため、ステップ3とステップ4では、引用文献が何であるかについて合意します。

## CLI

```bash
npm i -g @dogfood-lab/study-swarm     # or run ad-hoc: npx @dogfood-lab/study-swarm <command>
```

| コマンド | その機能 |
|---|---|
| `study-swarm protocol` | 完全なプロトコル（5つのステップ、停止テーブル、ソース標準）を出力します。 |
| `study-swarm new <slug>` | 5つのステップのスケルトンを含む`<slug>.dispatch.md`を作成し、それを埋めるためのテンプレートを提供します。 |
| `study-swarm lint [--json] [--strict] <path…>` | ディスパッチの「研究根拠」を、ソースの標準と比較して確認します。すべての調査結果には、著者、年、および解決可能な識別子（arXiv / DOI / URL / RFC）が必要です。「研究では～と示されています…」という曖昧な表現は認められません。違反があった場合は `1` を返して処理を停止し、CI のゲートとして機能します。`<path>` は、ファイル、ディレクトリ（`*.dispatch.md` に対して再帰的にチェックされます）、または標準入力 (`-`) にすることができます。`--json` オプションを使用すると、機械可読のレポートが出力されます。`--strict` オプションを追加すると、**孤立した引用**（Step 5 のいずれかの選択肢で参照されていない調査結果）がフラグ付けされます。「関連性のない引用はノイズである」ためです（オプションであり、デフォルトの CI ゲートは変更されません）。 |
| `study-swarm lock --init <dispatch>` | `<dispatch>.orchestration.json` を作成します。これは、`lock … --from` に渡すための、穴埋め形式のハーネスレコードです（Step-2 のエージェントごとに1つのステップ）。 |
| `study-swarm lock <dispatch> --from <orchestration.json>` | ディスパッチをリプレイ用に固定します。`<dispatch>.lock.json`ファイルに、ステップ2のエージェントごとに、**解決されたモデルID** + **正確なバイト単位のプロンプトのSHA-256ハッシュ** + **ツールスキーマのSHA-256ハッシュ**、およびステップ4の**検証レシート**をまとめて書き込みます。これらを1つの`lock_sha256`にまとめます。 |
| `study-swarm lock --verify <dispatch> [--from …]` | これらのハッシュを再計算し、ロックファイルと一致することを確認します。いずれかのハッシュが異なる場合、終了コード`1`を返し、CIでゲートとして機能します（パッケージのロックファイルと同様）。`--from`オプションがない場合は、ロックファイルの整合性をチェックします。 |
| `study-swarm withdraw <id> --reason <reason> [--from <dir>] [--receipt <path>]` | **カノンロールバック補正器**。コーパス内のすべてのディスパッチについて、「研究根拠」で `<id>` を引用しているものを `evidence-withdrawn` としてフラグ付けします（墓石のようなサイドカーファイル `<slug>.withdrawn.json` で、フラグを立てますが削除はしません）。また、コンテンツアドレス指定された取り下げレシートを出力します。`--reason` は `fabricated · misattributed · retracted · verifier-flipped · other` のいずれかです。 |
| `study-swarm requalify --check <corpus-dir>` | 未解決の `evidence-withdrawn` フラグを持つディスパッチがある場合、処理を停止してエラー (`1`) を返します。これは、取り下げられた調査結果に依存するものを、削除または再検証されるまで停止させるための「アンドン」です。CI のゲートとしても機能します。 |
| `study-swarm requalify --status <corpus-dir> [--json]` | コーパスの読み取り専用の証拠健全性**ビュー**を提供します。取り下げられたものと解決されたものの数、理由および解決モードごとの内訳、ディスパッチごとの行を表示します。これは情報提供のみを目的としており（`0` を返します）、`--check` ゲートとは異なります。 |
| `study-swarm requalify --resolve <dispatch> <id> --mode removed\ | regrounded [--note …]` | 調査結果が削除されたとき（引用がなくなったとき）または再検証されたときに、フラグをクリアします（兄弟ランナーによって再度検証され、問題がないことが確認されます。`--note` には証拠が記録されます）。べき等であり、サイドカーの監査ログに追加されます。 |

`lint`は決定論的であり、モデル呼び出しはゼロであるため、CIでの使用に安全です。ローカルで**ステップ3のソース標準**を適用し、モデルベースの**ステップ4**検証は引き続き[`roleos verify-citations`](https://github.com/mcp-tool-shop-org/role-os) → prismに委ねます。

典型的なループ：

```bash
study-swarm new my-decision                      # creates my-decision.dispatch.md
# …fill in the questions, run the research dispatch, write the findings…
study-swarm lint my-decision.dispatch.md         # enforce the sourcing standard (Step 3)
roleos verify-citations my-decision.dispatch.md  # model-based Step 4 (different family, via prism)
```

4つの完全で、lint チェックに合格したディスパッチを参考として提供します：[`examples/study-swarm-self.dispatch.md`](examples/study-swarm-self.dispatch.md)（プロトコルの中心的な決定であり、コンパクト）、[`examples/study-swarm-v1_1.dispatch.md`](examples/study-swarm-v1_1.dispatch.md)（完全な v1.1 の設計パスであり、27件の引用があり、そのすべてが外部で検証されています）、[`examples/study-swarm-lock.dispatch.md`](examples/study-swarm-lock.dispatch.md)（v1.2 のロック設計であり、39件の引用があり、ランナーを通じてゲートされ、独自のロックを最初に提供するディスパッチです）、および [`examples/study-swarm-canon-rollback.取り消し、撤回、サガ、ビルド無効化など、27件の引用が含まれており、最初に取り下げられてから再検証されるディスパッチです）。

### CIでゲートとして使用する

`lint`は、ファイル、ディレクトリ（`.dispatch.md`ファイルを再帰的にlint）、または`-`（標準入力）を受け取り、`--json`オプションを使用すると、機械可読形式のレポートが出力されます。これをリポジトリに追加して、各PRでディスパッチのソースをゲートします（コピー＆ペーストできるサンプルは[`examples/study-swarm-ci.yml`](examples/study-swarm-ci.yml)にもあります）。

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

### ディスパッチをリプレイ用に固定する（`dispatch.lock.json`）

根拠があり、検証されたディスパッチは、それがどのように生成されたかを説明できれば、監査可能になります。`study-swarm lock`は、コンパニオンのロックファイルを書き込みます。このファイルには、研究エージェントごとに、**解決されたモデルID**（浮動するエイリアスではありません）、**正確なバイト単位のプロンプトのSHA-256ハッシュ**、および与えられた**ツールスキーマのSHA-256ハッシュ**、さらに外部の**検証レシート**が記録されます。これらはすべて1つの`lock_sha256`にまとめられます。`study-swarm lock --verify`は、これらのハッシュを再計算し、いずれかのハッシュが異なる場合、エラーを表示します。したがって、プロンプトが変更されたり、モデルが切り替えられたり、ツールのバージョンが変更されたりすると、検知されます。[PIN_PER_STEP](https://github.com/dogfood-lab/study-swarm)再現性標準を実際に実行できます。この処理は、レコードを出力し、CLIはゼロ依存でネットワークにアクセスする必要がなく、単に正規化（RFC 8785）、ハッシュ化、および検証を行います。

**入力は固定し、出力は固定しません。** モデル、プロンプト、温度を固定しても、LLMの出力が完全に同一になるわけではありません。バッチ不変性、浮動小数点演算の非結合性、混合エキスパートルーティング、およびサイレントプロバイダドリフトなど、オフラインツールで制御できない要素が存在するためです。したがって、この仕組みは、**再現可能な入力とドリフトを検出可能な出力を提供し、「決定的な再現」を実現するものではありません。** この設計は、[`examples/study-swarm-lock.dispatch.md`](examples/study-swarm-lock.dispatch.md) に記載されているように、個々の要素に基づいて構築されており、独自のロック機能を備えた最初のバージョン ([`examples/study-swarm-lock.lock.json`](examples/study-swarm-lock.lock.json)) として提供されます。

### 取り下げられた調査結果をロールバックします（`withdraw` / `requalify`）

検証された調査結果は**カノン**になります。これは、後続の決定に影響を与えます。では、後で**取り下げられた**場合（再実行時に引用が捏造または誤って帰属されていることが判明した場合、引用された論文が撤回された場合、またはゲートがそれを反転させた場合）はどうなるでしょうか？ `git revert` だけでは不十分です。なぜなら、調査結果はすでに伝播しているからです。カノンロールバック補正器を使用すると、クリーンアップを確実に実行できます。

```bash
study-swarm withdraw arXiv:2402.15089 --reason misattributed --from dispatches/ --receipt rollback.json
#   → flags every dispatch citing it `evidence-withdrawn` (a tombstone sidecar — flag, never delete)
#     and writes a content-addressed withdrawal receipt naming every dependent.
study-swarm requalify --check dispatches/          # exit 1 while any flag is unresolved — the andon HALT
study-swarm requalify --resolve d.dispatch.md arXiv:2402.15089 --mode removed   # or: --mode regrounded --note "<attestation>"
```

`requalify --check` は、フラグが立てられたすべての調査結果が削除されるか、**再検証されるまで**（兄弟ランナーによって再度検証され、問題がないことが確認されます。CLI は証拠を記録しますが、それ自体で再検証は行いません）、**処理を停止してエラーを返します**。取り下げは、静かにドロップするのではなく、**対照的に**表示されます。すべて（墓石とレシート）がコンテンツアドレス指定され、ドリフト検出が可能であり、*証拠* レイヤーでのみ動作します：`lock --verify` は取り消しによって影響を受けません。この設計は [`examples/study-swarm-canon-rollback.dispatch.md`](examples/study-swarm-canon-rollback.dispatch.md) に基づいており、[PROTOCOL.md](PROTOCOL.md) の「Compensating a withdrawn finding」セクションが実行可能な形式です。これは、**NAMED_COMPENSATORS** 標準を実行可能にしたものです。名前付きでべき等なアンドゥ操作であり、既知のポスト状態とレシートを残します。

## その仕組みを簡潔に説明します

**最新性** — この分野は急速に進歩しており、特定の研究（数年間の期間が必要）に固執すると、設計が18か月遅れてしまう可能性があります。**機能性** — 証拠は、何が「うまくいく」かだけでなく、何が「うまくいかない」かを示しています（説明を加えることで、誤ったAIへの過度な依存が生じる可能性があります—Bansal et al. 2021, [arXiv:2006.14779](https://arxiv.org/abs/2006.14779)）。**安全性** — 検証者によって保護された範囲は、証拠が裏付けるアーキテクチャであり、プロトコルによってその出力に強制されます。情報源の提示は学術的なパフォーマンスではなく、証拠の追跡です。

## セキュリティ

`study-swarm` は、この手法とともに、**軽量で依存関係のないCLI（コマンドラインインターフェース）** (`study-swarm`) を提供します。**ネットワーク接続やモデルへのアクセスは行わず、テレメトリデータも収集しません。** ソースコードには、秘密情報や認証情報は含まれていません。実行時には、`lint` に渡されたファイルのみを読み取り、現在のディレクトリに `<slug>.dispatch.md` という名前のファイルを1つだけ書き込みます（上書きは行わず、作業ディレクトリ外への書き込みも行いません）。この手法で説明されているモデルベースの検証（ステップ4）は、このパッケージではなく、関連するツールによって実行されます。詳細は [SECURITY.md](SECURITY.md) を参照してください。

## ステータス

独自のメカニズムによって外部検証された動作するプロトコルです。別のモデルファミリーがその引用をチェックします（上記の証拠を参照）。**v1.1** では、最初のリリースでは静的だった検証器が強化されています：分解/三値の根拠付け、生成時の根拠付け、レンズを組み合わせるためのオラクルゲート付きカスケード、および調整された棄権。これらはすべて、検証済みの v1.1 ディスパッチに基づいています。**v1.2** では、ディスパッチがバイト単位で再現可能になります：`study-swarm lock` は、ステップごとの解決済みモデル、プロンプト、ツールスキーマと、検証器レシートを固定します。また、`lock --verify` はドリフトが発生すると処理を停止してエラーを返します。**v1.3** では、ロールバックを実行可能にします：すでにカノンになった調査結果が取り下げられた場合、`study-swarm withdraw` はすべての依存関係にフラグを立て、`requalify --check` はそれらを削除または再検証されるまで処理を停止してエラーを返します。これは、名前付きでレシート付きのべき等な補正器です。**v2.0** では、プロトコルのより多くの部分を実行可能にし、ロックを強化します：`lint --strict` は孤立した引用にフラグを立てます（CLI が検出できなかった唯一の失敗モード）、`lock --init` はハーネスレコードを作成し、`requalify --status` はコーパスの証拠健全性を読み取り、ロックのコンテンツアドレス指定はドメインで分離されます（アーティファクトスキーマ v2。以前のバージョンのロックは再生成され、改ざんされたと誤ってフラグが立てられることはありません。CLI のコマンドサーフェスは後方互換性を維持します）。このリポジトリは公開参照であり、[PROTOCOL.md](PROTOCOL.md) が実行可能な形式です。これは、[dogfood-lab](https://github.com/dogfood-lab) ファミリーの一部であり、AI 時代に構築するための方法とデモンストレーションを提供します。

MITライセンス。

---

<p align="center"><sub>Part of the <a href="https://github.com/dogfood-lab">dogfood-lab</a> family — methods &amp; showcases for building in the AI era. Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.</sub></p>
